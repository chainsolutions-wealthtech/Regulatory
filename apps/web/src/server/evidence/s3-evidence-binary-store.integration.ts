import assert from "node:assert/strict";
import { createS3EvidenceBinaryStore } from "@/server/evidence/s3-evidence-binary-store";

const organizationId = "10000000-0000-0000-0000-000000000001";
const objectId = "50000000-0000-0000-0000-000000000001";
const content = new TextEncoder().encode("s3 evidence fixture");
const calls: Array<{ command: string; input: Record<string, unknown> }> = [];
const objects = new Map<string, Uint8Array>();

const client = {
  async send(command: { constructor: { name: string }; input: Record<string, unknown> }) {
    calls.push({ command: command.constructor.name, input: command.input });
    const key = String(command.input.Key ?? "");
    if (command.constructor.name === "PutObjectCommand") {
      objects.set(key, Uint8Array.from(command.input.Body as Uint8Array));
      return {};
    }
    if (command.constructor.name === "HeadObjectCommand") {
      if (!objects.has(key)) throw notFound();
      return {};
    }
    if (command.constructor.name === "GetObjectCommand") {
      const body = objects.get(key);
      if (!body) throw notFound();
      return { Body: { async transformToByteArray() { return Uint8Array.from(body); } } };
    }
    if (command.constructor.name === "CopyObjectCommand") {
      const source = decodeURIComponent(String(command.input.CopySource ?? ""));
      const sourceKey = source.replace(/^private-evidence\//u, "");
      const body = objects.get(sourceKey);
      if (!body) throw notFound();
      objects.set(key, Uint8Array.from(body));
      return {};
    }
    if (command.constructor.name === "DeleteObjectCommand") {
      objects.delete(key);
      return {};
    }
    throw new Error(`UNEXPECTED_S3_COMMAND:${command.constructor.name}`);
  },
};

const store = createS3EvidenceBinaryStore({
  client,
  bucket: "private-evidence",
  region: "eu-west-3",
  kmsKeyId: "arn:aws:kms:eu-west-3:123456789012:key/example",
  keyPrefix: "regulatory",
});
assert.equal(
  store.productionReady,
  false,
  "A configured adapter with a fake client must not attest an operational production object store.",
);

const staged = await store.stage({ objectId, organizationId, content });
assert.equal(staged.storageProvider, "S3_PRIVATE_KMS");
assert.equal(staged.storageObjectKey, `regulatory/quarantine/${organizationId}/${objectId}`);
assert.equal(staged.storageReference, `s3-private:private-evidence:regulatory/quarantine/${organizationId}/${objectId}`);
assert.equal(staged.encryptionAlgorithm, "AWS_S3_SSE_KMS");

const put = calls.find((call) => call.command === "PutObjectCommand");
assert(put);
assert.equal(put.input.Bucket, "private-evidence");
assert.equal(put.input.ServerSideEncryption, "aws:kms");
assert.equal(put.input.SSEKMSKeyId, "arn:aws:kms:eu-west-3:123456789012:key/example");
assert.equal(put.input.ACL, undefined, "Adapter must not request a public ACL.");
assert.deepEqual(Buffer.from(await store.readQuarantined({ objectId, organizationId })), Buffer.from(content));

const cleanLocation = await store.promoteToClean({ objectId, organizationId });
assert.equal(cleanLocation.storageObjectKey, `regulatory/clean/${organizationId}/${objectId}`);
assert.equal(objects.has(`regulatory/quarantine/${organizationId}/${objectId}`), false);
assert.equal(objects.has(`regulatory/clean/${organizationId}/${objectId}`), true);
const copy = calls.find((call) => call.command === "CopyObjectCommand");
assert(copy);
assert.equal(copy.input.ServerSideEncryption, "aws:kms");
assert.equal(copy.input.SSEKMSKeyId, "arn:aws:kms:eu-west-3:123456789012:key/example");

const callCountBeforeRetry = calls.length;
const cleanRetry = await store.promoteToClean({ objectId, organizationId });
assert.deepEqual(cleanRetry, cleanLocation);
assert.equal(
  calls.slice(callCountBeforeRetry).some((call) => call.command === "CopyObjectCommand"),
  false,
  "Idempotent retry must not recopy an already-clean object.",
);
assert.deepEqual(Buffer.from(await store.readClean({ objectId, organizationId })), Buffer.from(content));

await store.delete({ objectId, organizationId });
await store.delete({ objectId, organizationId });
assert.equal(objects.size, 0);

assert.throws(
  () => createS3EvidenceBinaryStore({ client, bucket: "private-evidence", region: "eu-west-3", kmsKeyId: "" }),
  /EVIDENCE_S3_KMS_KEY_REQUIRED/,
);
assert.throws(
  () => createS3EvidenceBinaryStore({ client, bucket: "", region: "eu-west-3", kmsKeyId: "kms-key" }),
  /EVIDENCE_S3_BUCKET_REQUIRED/,
);

console.log("S3_EVIDENCE_BINARY_STORE_PASS");

function notFound() {
  const error = new Error("NotFound") as Error & { name: string; $metadata?: { httpStatusCode?: number } };
  error.name = "NoSuchKey";
  error.$metadata = { httpStatusCode: 404 };
  return error;
}
