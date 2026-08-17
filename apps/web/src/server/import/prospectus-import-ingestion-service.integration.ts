import assert from "node:assert/strict";
import type { ProspectusImportBatch } from "@/domain/prospectus-import";
import type { EvidenceObjectStore, EvidenceReadResult } from "@/server/evidence/evidence-object-store";
import type { ImportStagingRepository } from "@/server/import/import-staging-repository";
import type { ProspectusExtractor } from "@/server/import/prospectus-import-service";
import { createProspectusImportIngestionService } from "@/server/import/prospectus-import-ingestion-service";
import { createFixedTestIdentityProvider } from "@/server/security/verified-identity";

const organizationId = "10000000-0000-0000-0000-000000000001";
const userId = "20000000-0000-0000-0000-000000000001";
const projectVersionId = "40000000-0000-0000-0000-000000000001";
const evidenceObjectId = "50000000-0000-0000-0000-000000000001";
let readCleanCalls = 0;
let stagedBatch: ProspectusImportBatch | null = null;

const cleanEvidence: EvidenceReadResult = {
  descriptor: {
    objectId: evidenceObjectId,
    organizationId,
    projectVersionId,
    storageProvider: "test",
    storageObjectKey: "private/test",
    storageReference: "opaque:test",
    originalFilename: "prospectus.pdf",
    safeFilename: "prospectus.pdf",
    declaredMediaType: "application/pdf",
    detectedMediaType: "application/pdf",
    sha256: "a".repeat(64),
    byteSize: 4,
    encryptionAlgorithm: "AES-256-GCM",
    encryptionKeyReference: "kms:test",
    state: "CLEAN",
    scanStatus: "CLEAN",
    scanProvider: "ci",
    scanEngineVersion: "1",
    scanSignatureVersion: "1",
    scanCompletedAt: "2026-08-17T20:00:00.000Z",
    uploadedBy: userId,
    releasedBy: userId,
    releasedAt: "2026-08-17T20:01:00.000Z",
    retentionUntil: "2036-08-17T00:00:00.000Z",
    legalHold: false,
  },
  content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
  headers: {
    "content-type": "application/pdf",
    "content-disposition": "attachment; filename=prospectus.pdf",
    "cache-control": "private, no-store",
  },
};

const evidenceStore = {
  provider: "test",
  productionReady: false,
  async readClean(input: { objectId: string; organizationId: string; requestedBy: string }) {
    readCleanCalls += 1;
    assert.equal(input.objectId, evidenceObjectId);
    assert.equal(input.organizationId, organizationId);
    assert.equal(input.requestedBy, userId);
    return cleanEvidence;
  },
} as EvidenceObjectStore;

const stagingRepository: ImportStagingRepository = {
  async createBatch(input) {
    assert.equal(input.projectVersionId, projectVersionId);
    stagedBatch = input.batch;
    return input.batch;
  },
  async getBatch() { return null; },
  async reviewValue() { throw new Error("NOT_USED"); },
};

const extractor: ProspectusExtractor = {
  id: "test-extractor",
  version: "1",
  async extract() {
    return [{
      proposedCanonicalFieldPath: "fund.legal_name",
      extractedValue: "FCP Horizon",
      confidence: 0.9,
      sourceLocation: { page: 1, textAnchor: "Dénomination du Fonds : FCP Horizon" },
    }];
  },
};

const service = createProspectusImportIngestionService({
  evidenceStore,
  stagingRepository,
  identityProvider: createFixedTestIdentityProvider({
    subject: "subject-product",
    userId,
    organizationId,
    roles: ["PRODUCT"],
    verifiedAt: "2026-08-17T20:00:00.000Z",
    provider: "test",
  }),
  extractor,
});

const batch = await service.extractAndStage({
  projectId: "project-alpha",
  projectVersion: 1,
  projectVersionId,
  evidenceObjectId,
});
assert.equal(readCleanCalls, 1);
assert.equal(stagedBatch?.importId, batch.importId);
assert.equal(batch.status, "EXTRACTED_UNVERIFIED");
assert.equal(batch.values[0]?.reviewStatus, "EXTRACTED_UNVERIFIED");
assert.equal(batch.canonicalWriteAllowed, false);
assert.equal(batch.readyForSubmission, false);
assert.equal(batch.evidenceObjectId, evidenceObjectId);
assert.equal(batch.extractorId, "test-extractor");

const readerService = createProspectusImportIngestionService({
  evidenceStore,
  stagingRepository,
  identityProvider: createFixedTestIdentityProvider({
    subject: "subject-reader",
    userId: "20000000-0000-0000-0000-000000000002",
    organizationId,
    roles: ["READER"],
    verifiedAt: "2026-08-17T20:00:00.000Z",
    provider: "test",
  }),
  extractor,
});
const callsBeforeDenied = readCleanCalls;
await assert.rejects(
  () => readerService.extractAndStage({ projectId: "project-alpha", projectVersion: 1, projectVersionId, evidenceObjectId }),
  /AUTHORIZATION_DENIED:EVIDENCE_READ/,
);
assert.equal(readCleanCalls, callsBeforeDenied);

console.log("PROSPECTUS_IMPORT_INGESTION_SERVICE_PASS");
