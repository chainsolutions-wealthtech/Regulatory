import assert from "node:assert/strict";
import { createEvidenceServerScanOrchestrator } from "@/server/evidence/evidence-server-scan-orchestrator";
import type { EvidenceObjectDescriptor } from "@/server/evidence/evidence-object-store";

const descriptor: EvidenceObjectDescriptor = {
  objectId: "50000000-0000-0000-0000-000000000001",
  organizationId: "10000000-0000-0000-0000-000000000001",
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

let descriptorReads = 0;
let scans = 0;
const orchestrator = createEvidenceServerScanOrchestrator({
  descriptorService: {
    async readForScanning(objectId: string) {
      descriptorReads += 1;
      assert.equal(objectId, descriptor.objectId);
      return descriptor;
    },
  },
  scanService: {
    async scanQuarantined(input: EvidenceObjectDescriptor) {
      scans += 1;
      assert.equal(input, descriptor);
      return {
        ...input,
        detectedMediaType: "application/pdf",
        scanStatus: "CLEAN" as const,
        scanProvider: "clamav-gateway",
        scanEngineVersion: "1.4.3",
        scanSignatureVersion: "2026-08-19",
        scanCompletedAt: "2026-08-19T18:10:00.000Z",
      };
    },
  },
});

const scanned = await orchestrator.scan(descriptor.objectId);
assert.equal(scanned.scanStatus, "CLEAN");
assert.equal(scanned.state, "QUARANTINED", "Trusted scan must never auto-release.");
assert.equal(descriptorReads, 1);
assert.equal(scans, 1);

const invalid = createEvidenceServerScanOrchestrator({
  descriptorService: {
    async readForScanning() {
      return { ...descriptor, scanStatus: "CLEAN" as const };
    },
  },
  scanService: {
    async scanQuarantined() {
      throw new Error("SCAN_SERVICE_MUST_NOT_BE_CALLED");
    },
  },
});
await assert.rejects(() => invalid.scan(descriptor.objectId), /EVIDENCE_SCAN_REQUIRES_PENDING_QUARANTINE/);

console.log("EVIDENCE_SERVER_SCAN_ORCHESTRATOR_PASS");
