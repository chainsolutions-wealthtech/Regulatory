import { createHash } from "node:crypto";
import {
  assertImportRemainsUnverified,
  type ProspectusImportBatch,
} from "@/domain/prospectus-import";
import type { EvidenceReadResult } from "@/server/evidence/evidence-object-store";
import {
  createUnverifiedProspectusImport,
  type ProspectusExtractor,
} from "@/server/import/prospectus-import-service";

const content = Buffer.from("%PDF-1.7\nsynthetic prospectus test\n", "utf8");
const sha256 = createHash("sha256").update(content).digest("hex");
const cleanEvidence: EvidenceReadResult = {
  descriptor: {
    objectId: "evidence-prospectus-test",
    organizationId: "org-test",
    projectVersionId: "project-version-test",
    storageProvider: "TEST",
    storageObjectKey: "test/evidence",
    storageReference: "test:evidence",
    originalFilename: "prospectus.pdf",
    safeFilename: "prospectus.pdf",
    declaredMediaType: "application/pdf",
    detectedMediaType: "application/pdf",
    sha256,
    byteSize: content.byteLength,
    encryptionAlgorithm: "TEST_ONLY",
    encryptionKeyReference: "test-key",
    state: "CLEAN",
    scanStatus: "CLEAN",
    scanProvider: "TEST_SCANNER",
    scanEngineVersion: "1",
    scanSignatureVersion: "1",
    scanCompletedAt: "2026-08-08T20:00:00.000Z",
    uploadedBy: "tester",
    releasedBy: "tester",
    releasedAt: "2026-08-08T20:00:01.000Z",
    retentionUntil: "2036-08-08T20:00:00.000Z",
    legalHold: false,
  },
  content,
  headers: {
    "content-type": "application/pdf",
    "content-disposition": "attachment; filename=prospectus.pdf",
    "cache-control": "private, no-store",
  },
};

const extractor: ProspectusExtractor = {
  id: "DETERMINISTIC_TEST_EXTRACTOR",
  version: "1.0.0",
  async extract() {
    return [
      {
        proposedCanonicalFieldPath: "fund.legal_name",
        extractedValue: "FCP Test Import",
        confidence: 0.97,
        sourceLocation: { page: 1, section: "Dénomination", textAnchor: "FCP Test Import" },
      },
    ];
  },
};

const batch = await createUnverifiedProspectusImport({
  projectId: "project-test",
  projectVersion: 1,
  evidence: cleanEvidence,
  extractor,
  createdAt: "2026-08-08T20:01:00.000Z",
});
assert(batch.status === "EXTRACTED_UNVERIFIED", "The batch must remain unverified.");
assert(batch.canonicalWriteAllowed === false, "Canonical writes must remain disabled.");
assert(batch.readyForSubmission === false, "Submission must remain disabled.");
assert(batch.values.length === 1, "One proposed value is expected.");
assert(batch.values[0].reviewStatus === "EXTRACTED_UNVERIFIED", "The value must require human review.");
assert(batch.values[0].evidenceSha256 === sha256, "Evidence provenance must preserve the digest.");

let dirtyRejected = false;
try {
  await createUnverifiedProspectusImport({
    projectId: "project-test",
    projectVersion: 1,
    evidence: {
      ...cleanEvidence,
      descriptor: { ...cleanEvidence.descriptor, state: "QUARANTINED", scanStatus: "PENDING" },
    },
    extractor,
  });
} catch (error) {
  dirtyRejected = String(error).includes("IMPORT_CLEAN_EVIDENCE_REQUIRED");
}
assert(dirtyRejected, "Unscanned evidence must be rejected.");

let canonicalBypassRejected = false;
try {
  assertImportRemainsUnverified({
    ...batch,
    canonicalWriteAllowed: true,
  } as ProspectusImportBatch);
} catch (error) {
  canonicalBypassRejected = String(error).includes("IMPORT_CANONICAL_WRITE_MUST_REMAIN_FALSE");
}
assert(canonicalBypassRejected, "An extraction must never enable canonical writes by itself.");

console.log(
  JSON.stringify(
    {
      validationId: "PROSPECTUS_IMPORT_EXTRACTED_UNVERIFIED_VALIDATION_V1",
      status: "PASS",
      checks: {
        cleanEvidenceRequired: true,
        sourceProvenancePreserved: true,
        extractionRemainsUnverified: true,
        canonicalWriteDisabled: true,
        readyForSubmissionFalse: true,
      },
    },
    null,
    2,
  ),
);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
