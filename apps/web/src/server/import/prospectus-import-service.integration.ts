import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  assertImportRemainsUnverified,
  createUnverifiedProspectusImport,
  type ProspectusImportBatch,
} from "@/server/import/prospectus-import-service";
import type { StoredEvidenceObject } from "@/server/storage/evidence-object-store";

const evidenceContent = Buffer.from("clean prospectus evidence", "utf8");
const sha256 = createHash("sha256").update(evidenceContent).digest("hex");

const cleanEvidence: StoredEvidenceObject = {
  descriptor: {
    schemaVersion: "EVIDENCE_OBJECT_DESCRIPTOR_V1",
    organizationId: "org-test",
    projectId: "project-test",
    evidenceObjectId: "evidence-test",
    sourceFilename: "prospectus.pdf",
    mediaType: "application/pdf",
    storageReference: "evidence://org-test/project-test/evidence-test",
    sha256,
    byteSize: evidenceContent.byteLength,
    uploadedAt: "2026-08-08T20:00:00.000Z",
    state: "CLEAN",
    scanStatus: "CLEAN",
    scanEngine: "test-engine",
    scannedAt: "2026-08-08T20:00:30.000Z",
    quarantineReason: null,
  },
  content: evidenceContent,
};

const extractor = {
  async extract() {
    return [
      {
        fieldPath: "issuer.legal_name",
        proposedValue: "Example Issuer SA",
        sourceLocation: "page 1",
        confidence: 0.98,
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
