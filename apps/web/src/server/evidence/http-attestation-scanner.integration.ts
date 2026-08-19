import assert from "node:assert/strict";
import { createHttpAttestationEvidenceScanner } from "@/server/evidence/http-attestation-scanner";

const requests: Array<{ url: string; init: RequestInit }> = [];
const scanner = createHttpAttestationEvidenceScanner({
  url: "https://scanner.example.test/v1/scan",
  token: "scanner-secret",
  nodeEnv: "production",
  fetchImpl: async (url, init) => {
    requests.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({
      expectedSha256: "a".repeat(64),
      detectedMediaType: "application/pdf",
      status: "CLEAN",
      scanProvider: "clamav-gateway",
      scanEngineVersion: "1.4.3",
      scanSignatureVersion: "2026-08-19-01",
      scanCompletedAt: "2026-08-19T18:05:00.000Z",
      details: { policy: "default" },
    }), { status: 200, headers: { "content-type": "application/json" } });
  },
});

const result = await scanner.scan({
  objectId: "50000000-0000-0000-0000-000000000001",
  storageProvider: "S3_PRIVATE_KMS",
  storageObjectKey: "regulatory/quarantine/10000000-0000-0000-0000-000000000001/50000000-0000-0000-0000-000000000001",
  storageReference: "s3-private:private-evidence:opaque",
  expectedSha256: "a".repeat(64),
  byteSize: 1234,
  declaredMediaType: "application/pdf",
});
assert.equal(result.status, "CLEAN");
assert.equal(result.expectedSha256, "a".repeat(64));
assert.equal(requests.length, 1);
assert.equal(requests[0].url, "https://scanner.example.test/v1/scan");
assert.equal((requests[0].init.headers as Record<string, string>).authorization, "Bearer scanner-secret");
const sent = JSON.parse(String(requests[0].init.body));
assert.equal(sent.objectId, "50000000-0000-0000-0000-000000000001");
assert.equal(sent.expectedSha256, "a".repeat(64));
assert.equal(sent.storageReference, "s3-private:private-evidence:opaque");
assert.equal(JSON.stringify(result).includes("scanner-secret"), false);

assert.throws(
  () => createHttpAttestationEvidenceScanner({
    url: "http://scanner.internal/v1/scan",
    token: "secret",
    nodeEnv: "production",
  }),
  /EVIDENCE_SCANNER_HTTPS_REQUIRED_IN_PRODUCTION/,
);
assert.throws(
  () => createHttpAttestationEvidenceScanner({ url: "https://scanner.example.test", token: "", nodeEnv: "production" }),
  /EVIDENCE_SCANNER_TOKEN_REQUIRED/,
);

const failingScanner = createHttpAttestationEvidenceScanner({
  url: "https://scanner.example.test/v1/scan",
  token: "secret",
  nodeEnv: "production",
  fetchImpl: async () => new Response("sensitive scanner diagnostic", { status: 503 }),
});
await assert.rejects(
  () => failingScanner.scan({
    objectId: "50000000-0000-0000-0000-000000000001",
    storageProvider: "S3_PRIVATE_KMS",
    storageObjectKey: "quarantine/key",
    storageReference: "opaque",
    expectedSha256: "a".repeat(64),
    byteSize: 1,
  }),
  (error: unknown) => error instanceof Error && error.message === "EVIDENCE_SCANNER_HTTP_FAILURE:503",
);

console.log("HTTP_ATTESTATION_EVIDENCE_SCANNER_PASS");
