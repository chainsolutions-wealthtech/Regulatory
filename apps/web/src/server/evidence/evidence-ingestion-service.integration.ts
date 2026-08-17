import assert from "node:assert/strict";
import type { EvidenceObjectStore, StageEvidenceInput } from "@/server/evidence/evidence-object-store";
import { createEvidenceIngestionService } from "@/server/evidence/evidence-ingestion-service";
import { createFixedTestIdentityProvider } from "@/server/security/verified-identity";

const organizationId = "10000000-0000-0000-0000-000000000001";
const userId = "20000000-0000-0000-0000-000000000001";
const projectVersionId = "40000000-0000-0000-0000-000000000001";
let stageCalls = 0;

const store = {
  provider: "test",
  productionReady: false,
  async stage(input: StageEvidenceInput) {
    stageCalls += 1;
    assert.equal(input.organizationId, organizationId);
    assert.equal(input.uploadedBy, userId);
    assert.equal(input.encryptionKeyReference, "development-key-reference");
    return {
      objectId: "50000000-0000-0000-0000-000000000001",
      organizationId: input.organizationId,
      projectVersionId: input.projectVersionId,
      storageProvider: "test",
      storageObjectKey: "private/test",
      storageReference: "opaque:test",
      originalFilename: input.originalFilename,
      safeFilename: input.originalFilename,
      declaredMediaType: input.declaredMediaType,
      sha256: "a".repeat(64),
      byteSize: input.content.byteLength,
      encryptionAlgorithm: "NONE_TEST",
      encryptionKeyReference: input.encryptionKeyReference,
      state: "QUARANTINED" as const,
      scanStatus: "PENDING" as const,
      uploadedBy: input.uploadedBy,
      retentionUntil: "2036-08-17T00:00:00.000Z",
      legalHold: false,
    };
  },
} as EvidenceObjectStore;

const service = createEvidenceIngestionService({
  evidenceStore: store,
  identityProvider: createFixedTestIdentityProvider({
    subject: "subject-product",
    userId,
    organizationId,
    roles: ["PRODUCT"],
    verifiedAt: "2026-08-17T20:00:00.000Z",
    provider: "test",
  }),
  encryptionKeyReference: "development-key-reference",
});

const descriptor = await service.stageEvidence({
  projectVersionId,
  originalFilename: "prospectus.pdf",
  declaredMediaType: "application/pdf",
  content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
});
assert.equal(stageCalls, 1);
assert.equal(descriptor.state, "QUARANTINED");
assert.equal(descriptor.scanStatus, "PENDING");

const readerService = createEvidenceIngestionService({
  evidenceStore: store,
  identityProvider: createFixedTestIdentityProvider({
    subject: "subject-reader",
    userId: "20000000-0000-0000-0000-000000000002",
    organizationId,
    roles: ["READER"],
    verifiedAt: "2026-08-17T20:00:00.000Z",
    provider: "test",
  }),
  encryptionKeyReference: "development-key-reference",
});
const callsBeforeDenied = stageCalls;
await assert.rejects(
  () => readerService.stageEvidence({
    projectVersionId,
    originalFilename: "prospectus.pdf",
    declaredMediaType: "application/pdf",
    content: new Uint8Array([1]),
  }),
  /AUTHORIZATION_DENIED:EVIDENCE_WRITE/,
);
assert.equal(stageCalls, callsBeforeDenied);

console.log("EVIDENCE_INGESTION_SERVICE_PASS");
