import assert from "node:assert/strict";
import type { EvidenceObjectDescriptor, EvidenceObjectStore, RecordEvidenceScanInput } from "@/server/evidence/evidence-object-store";
import { createEvidenceScanWorker } from "@/server/evidence/evidence-scan-worker";
import { createFixedTestIdentityProvider } from "@/server/security/verified-identity";
import type { TrustedEvidenceScanner } from "@/server/evidence/evidence-scan-release-service";

const organizationId = "10000000-0000-0000-0000-000000000001";
const securityUserId = "20000000-0000-0000-0000-000000000008";
const descriptor: EvidenceObjectDescriptor = {
  objectId: "50000000-0000-0000-0000-000000000001",
  organizationId,
  projectVersionId: "40000000-0000-0000-0000-000000000001",
  storageProvider: "S3_PRIVATE_KMS",
  storageObjectKey: "regulatory/quarantine/100/500",
  storageReference: "s3-private:private-evidence:regulatory/quarantine/100/500",
  originalFilename: "prospectus.pdf",
  safeFilename: "prospectus.pdf",
  declaredMediaType: "application/pdf",
  sha256: "a".repeat(64),
  byteSize: 100,
  encryptionAlgorithm: "AWS_S3_SSE_KMS",
  encryptionKeyReference: "kms-reference",
  state: "QUARANTINED",
  scanStatus: "PENDING",
  uploadedBy: "20000000-0000-0000-0000-000000000001",
  retentionUntil: "2036-08-19T00:00:00.000Z",
  legalHold: false,
};

let scannerCalls = 0;
let readCalls = 0;
let recordCalls = 0;
const store = {
  provider: "test",
  productionReady: false,
  async readDescriptor(input: { objectId: string; organizationId: string; requestedBy: string; authorizationDecisionId: string }) {
    readCalls += 1;
    assert.equal(input.objectId, descriptor.objectId);
    assert.equal(input.organizationId, organizationId);
    assert.equal(input.requestedBy, securityUserId);
    assert.match(input.authorizationDecisionId, /^EVIDENCE_SCAN:/u);
    return descriptor;
  },
  async recordScan(input: RecordEvidenceScanInput) {
    recordCalls += 1;
    assert.equal(input.trustedServerResult, true);
    assert.equal(input.expectedSha256, descriptor.sha256);
    return {
      ...descriptor,
      detectedMediaType: input.detectedMediaType,
      scanStatus: input.status,
      scanProvider: input.scanProvider,
      scanEngineVersion: input.scanEngineVersion,
      scanSignatureVersion: input.scanSignatureVersion,
      scanCompletedAt: input.scanCompletedAt,
      state: input.status === "CLEAN" ? "QUARANTINED" as const : "REJECTED" as const,
    };
  },
} as EvidenceObjectStore;

const scanner: TrustedEvidenceScanner = {
  id: "test-scanner",
  async scan(request) {
    scannerCalls += 1;
    assert.equal(request.storageReference, descriptor.storageReference);
    return {
      expectedSha256: request.expectedSha256,
      detectedMediaType: "application/pdf",
      status: "CLEAN",
      scanProvider: "scanner-gateway",
      scanEngineVersion: "1.0",
      scanSignatureVersion: "2026-08-19",
      scanCompletedAt: "2026-08-19T18:30:00.000Z",
    };
  },
};

const worker = createEvidenceScanWorker({
  evidenceStore: store,
  scanner,
  identityProvider: createFixedTestIdentityProvider({
    subject: "scanner-service",
    userId: securityUserId,
    organizationId,
    roles: ["SECURITY"],
    verifiedAt: "2026-08-19T18:29:00.000Z",
    provider: "test",
  }),
});
const scanned = await worker.scan(descriptor.objectId);
assert.equal(scanned.scanStatus, "CLEAN");
assert.equal(scanned.state, "QUARANTINED");
assert.equal(readCalls, 1);
assert.equal(scannerCalls, 1);
assert.equal(recordCalls, 1);

const deniedWorker = createEvidenceScanWorker({
  evidenceStore: store,
  scanner,
  identityProvider: createFixedTestIdentityProvider({
    subject: "compliance-user",
    userId: "20000000-0000-0000-0000-000000000003",
    organizationId,
    roles: ["COMPLIANCE"],
    verifiedAt: "2026-08-19T18:29:00.000Z",
    provider: "test",
  }),
});
const callsBeforeDenied = { readCalls, scannerCalls, recordCalls };
await assert.rejects(() => deniedWorker.scan(descriptor.objectId), /AUTHORIZATION_DENIED:EVIDENCE_SCAN/);
assert.deepEqual({ readCalls, scannerCalls, recordCalls }, callsBeforeDenied);

console.log("EVIDENCE_SCAN_WORKER_PASS");
