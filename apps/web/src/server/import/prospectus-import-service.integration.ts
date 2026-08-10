import assert from "node:assert/strict";
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

const evidenceContent = Buffer.from("clean prospectus evidence", "utf8");
const sha256 = createHash("sha256").update(evidenceContent).digest("hex");

const cleanEvidence: EvidenceReadResult = {
  descriptor: {
    objectId: "evidence-test",
    organizationId: "org-test",
    projectVersionId: "project-version-test",
    storageProvider: "test",
    storageObjectKey: "org-test/project-test/evidence-test/prospectus.pdf",
    storageReference: "evidence://org-test/project-test/evidence-test",
    originalFilename: "prospectus.pdf",
    safeFilename: "prospectus.pdf",
    declaredMediaType: "application/pdf",
    detectedMediaType: "application/pdf",
    sha256,
    byteSize: evidenceContent.byteLength,
    encryptionAlgorithm: "AES-256-GCM",
    encryptionKeyReference: "test-key-reference",
    state: "CLEAN",
    scanStatus: "CLEAN",
    scanProvider: "test-provider",
    scanEngineVersion: "1.0.0",
    scanSignatureVersion: "test-signature-v1",
    scanCompletedAt: "2026-08-08T20:00:30.000Z",
    uploadedBy: "user-test",
    releasedBy: "reviewer-test",
    releasedAt: "2026-08-08T20:00:45.000Z",
    retentionUntil: "2036-08-08T20:00:00.000Z",
    legalHold: false,
  },
  content: evidenceContent,
  headers: {
    "content-type": "application/pdf",
    "content-disposition": "attachment; filename=prospectus.pdf",
    "cache-control": "private, no-store",
  },
};

const extractor: ProspectusExtractor = {
  id: "test-extractor",
  version: "1.0.0",
  async extract() {
    return [
      {
        proposedCanonicalFieldPath: "issuer.legal_name",
        extractedValue: "Example Issuer SA",
        confidence: 0.98,
        sourceLocation: { page: 1, textAnchor: "Example Issuer SA" },
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
assert(batch.values[0].proposedCanonicalFieldPath === "issuer.legal_name", "Canonical field proposal must be preserved.");
assert(batch.extractorId === "test-extractor" && batch.extractorVersion === "1.0.0", "Extractor provenance must be preserved.");

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
assert(dirtyRejected, "Unscanned or quarantined evidence must be rejected.");

let canonicalBypassRejected = false;
try {
  // Deliberately construct an invalid runtime payload to exercise the guard. The
  // double assertion is intentional: the production type correctly makes `true`
  // unrepresentable, while the runtime guard must still reject untyped/external data.
  assertImportRemainsUnverified({
    ...batch,
    canonicalWriteAllowed: true,
  } as unknown as ProspectusImportBatch);
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
        extractorProvenancePreserved: true,
        extractionRemainsUnverified: true,
        canonicalWriteDisabled: true,
        readyForSubmissionFalse: true,
        runtimeCanonicalBypassRejected: true,
      },
    },
    null,
    2,
  ),
);
