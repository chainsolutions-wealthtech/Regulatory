import assert from "node:assert/strict";
import type { EvidenceObjectDescriptor, EvidenceObjectStore, RecordEvidenceScanInput } from "@/server/evidence/evidence-object-store";
import {
  createEvidenceReleaseService,
  createTrustedEvidenceScanService,
  type TrustedEvidenceScanner,
} from "@/server/evidence/evidence-scan-release-service";
import { createFixedTestIdentityProvider } from "@/server/security/verified-identity";

const organizationId = "10000000-0000-0000-0000-000000000001";
const complianceUserId = "20000000-0000-0000-0000-000000000003";
const descriptor: EvidenceObjectDescriptor = {
  objectId: "50000000-0000-0000-0000-000000000001",
  organizationId,
  projectVersionId: "40000000-0000-0000-0000-000000000001",
  storageProvider: "private-object-store",
  storageObjectKey: "quarantine/object-1",
  storageReference: "opaque:object-1",
  originalFilename: "prospectus.pdf",
  safeFilename: "prospectus.pdf",
  declaredMediaType: "application/pdf",
  sha256: "a".repeat(64),
  byteSize: 1234,
  encryptionAlgorithm: "AES-256-GCM",
  encryptionKeyReference: "kms:key/1",
  state: "QUARANTINED",
  scanStatus: "PENDING",
  uploadedBy: "20000000-0000-0000-0000-000000000001",
  retentionUntil: "2036-08-17T00:00:00.000Z",
  legalHold: false,
};

let scanCalls = 0;
let releaseCalls = 0;

const store = {
  provider: "test",
  productionReady: false,
  async recordScan(input: RecordEvidenceScanInput) {
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
      state: input.status === "CLEAN" ? "QUARANTINED" as const : "INFECTED" as const,
    };
  },
  async release(input: { objectId: string; releasedBy: string; releasedAt: string }) {
    releaseCalls += 1;
    assert.equal(input.objectId, descriptor.objectId);
    assert.equal(input.releasedBy, complianceUserId);
    return {
      ...descriptor,
      detectedMediaType: "application/pdf",
      scanStatus: "CLEAN" as const,
      state: "CLEAN" as const,
      releasedBy: input.releasedBy,
      releasedAt: input.releasedAt,
    };
  },
} as EvidenceObjectStore;

const scanner: TrustedEvidenceScanner = {
  id: "ci-scanner",
  async scan(input) {
    scanCalls += 1;
    assert.equal(input.storageReference, descriptor.storageReference);
    assert.equal(input.expectedSha256, descriptor.sha256);
    return {
      expectedSha256: input.expectedSha256,
      detectedMediaType: "application/pdf",
      status: "CLEAN",
      scanProvider: "clamav-test-adapter",
      scanEngineVersion: "1.0",
      scanSignatureVersion: "2026-08-17",
      scanCompletedAt: "2026-08-17T21:00:00.000Z",
    };
  },
};

const scanService = createTrustedEvidenceScanService({ evidenceStore: store, scanner });
const scanned = await scanService.scanQuarantined(descriptor);
assert.equal(scanCalls, 1);
assert.equal(scanned.scanStatus, "CLEAN");
assert.equal(scanned.state, "QUARANTINED");

const releaseService = createEvidenceReleaseService({
  evidenceStore: store,
  identityProvider: createFixedTestIdentityProvider({
    subject: "subject-compliance",
    userId: complianceUserId,
    organizationId,
    roles: ["COMPLIANCE"],
    verifiedAt: "2026-08-17T21:01:00.000Z",
    provider: "test",
  }),
});
const released = await releaseService.releaseCleanScan({
  descriptor: scanned,
  releasedAt: "2026-08-17T21:02:00.000Z",
});
assert.equal(released.state, "CLEAN");
assert.equal(releaseCalls, 1);

const deniedRelease = createEvidenceReleaseService({
  evidenceStore: store,
  identityProvider: createFixedTestIdentityProvider({
    subject: "subject-product",
    userId: "20000000-0000-0000-0000-000000000004",
    organizationId,
    roles: ["PRODUCT"],
    verifiedAt: "2026-08-17T21:01:00.000Z",
    provider: "test",
  }),
});
const releaseCallsBeforeDenied = releaseCalls;
await assert.rejects(
  () => deniedRelease.releaseCleanScan({ descriptor: scanned, releasedAt: "2026-08-17T21:03:00.000Z" }),
  /AUTHORIZATION_DENIED:EVIDENCE_VERIFY/,
);
assert.equal(releaseCalls, releaseCallsBeforeDenied);

const badScanner: TrustedEvidenceScanner = {
  id: "bad-scanner",
  async scan() {
    return {
      expectedSha256: "b".repeat(64),
      detectedMediaType: "application/pdf",
      status: "CLEAN",
      scanProvider: "bad",
      scanEngineVersion: "1",
      scanSignatureVersion: "1",
      scanCompletedAt: "2026-08-17T21:00:00.000Z",
    };
  },
};
await assert.rejects(
  () => createTrustedEvidenceScanService({ evidenceStore: store, scanner: badScanner }).scanQuarantined(descriptor),
  /EVIDENCE_SCANNER_DIGEST_MISMATCH/,
);

console.log("EVIDENCE_SCAN_RELEASE_SERVICE_PASS");
