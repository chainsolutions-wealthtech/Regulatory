import assert from "node:assert/strict";
import { createMemoryEvidenceBinaryStore } from "@/server/evidence/evidence-binary-store";

const store = createMemoryEvidenceBinaryStore();
const organizationId = "10000000-0000-0000-0000-000000000001";
const objectId = "50000000-0000-0000-0000-000000000001";
const content = new TextEncoder().encode("binary evidence fixture");

const location = await store.stage({ objectId, organizationId, content });
assert.equal(location.storageProvider, "MEMORY_TEST_ONLY");
assert.equal(location.storageObjectKey, `quarantine/${organizationId}/${objectId}`);
assert.equal(location.storageReference, `memory-private:quarantine:${organizationId}:${objectId}`);
assert.equal(location.encryptionAlgorithm, "NONE_TEST_ONLY");
assert.deepEqual(Buffer.from(await store.readQuarantined({ objectId, organizationId })), Buffer.from(content));
await assert.rejects(
  () => store.readClean({ objectId, organizationId }),
  /EVIDENCE_BINARY_CLEAN_OBJECT_NOT_FOUND/,
);

const cleanLocation = await store.promoteToClean({ objectId, organizationId });
assert.equal(cleanLocation.storageProvider, "MEMORY_TEST_ONLY");
assert.equal(cleanLocation.storageObjectKey, `clean/${organizationId}/${objectId}`);
assert.equal(cleanLocation.storageReference, `memory-private:clean:${organizationId}:${objectId}`);
assert.equal(cleanLocation.encryptionAlgorithm, "NONE_TEST_ONLY");
const cleanLocationRetry = await store.promoteToClean({ objectId, organizationId });
assert.deepEqual(cleanLocationRetry, cleanLocation);
assert.deepEqual(Buffer.from(await store.readClean({ objectId, organizationId })), Buffer.from(content));
await assert.rejects(
  () => store.readQuarantined({ objectId, organizationId }),
  /EVIDENCE_BINARY_QUARANTINE_OBJECT_NOT_FOUND/,
);

await assert.rejects(
  () => store.readClean({ objectId, organizationId: "10000000-0000-0000-0000-000000000002" }),
  /EVIDENCE_BINARY_OBJECT_NOT_FOUND/,
);

await store.delete({ objectId, organizationId });
await store.delete({ objectId, organizationId });
await assert.rejects(
  () => store.readClean({ objectId, organizationId }),
  /EVIDENCE_BINARY_OBJECT_NOT_FOUND/,
);

console.log("EVIDENCE_BINARY_STORE_CONTRACT_PASS");
