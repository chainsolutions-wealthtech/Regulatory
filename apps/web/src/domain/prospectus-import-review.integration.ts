import assert from "node:assert/strict";
import {
  reviewImportedProspectusValue,
  type ProspectusImportBatch,
} from "@/domain/prospectus-import";

const baseBatch: ProspectusImportBatch = {
  importId: "import-review-test",
  projectId: "project-test",
  projectVersion: 7,
  evidenceObjectId: "evidence-test",
  evidenceSha256: "a".repeat(64),
  sourceFilename: "prospectus.pdf",
  sourceMediaType: "application/pdf",
  createdAt: "2026-08-17T19:15:00.000Z",
  extractorId: "test-extractor",
  extractorVersion: "1.0.0",
  status: "EXTRACTED_UNVERIFIED",
  canonicalWriteAllowed: false,
  readyForSubmission: false,
  values: [
    {
      importValueId: "value-1",
      proposedCanonicalFieldPath: "fund.legal_name",
      extractedValue: "FCP Exemple",
      confidence: 0.97,
      sourceLocation: { page: 1, textAnchor: "FCP Exemple" },
      evidenceObjectId: "evidence-test",
      evidenceSha256: "a".repeat(64),
      reviewStatus: "EXTRACTED_UNVERIFIED",
    },
    {
      importValueId: "value-2",
      proposedCanonicalFieldPath: "fund.currency",
      extractedValue: "XOF",
      confidence: 0.99,
      sourceLocation: { page: 2, textAnchor: "Franc CFA" },
      evidenceObjectId: "evidence-test",
      evidenceSha256: "a".repeat(64),
      reviewStatus: "EXTRACTED_UNVERIFIED",
    },
  ],
};

const afterConfirm = reviewImportedProspectusValue(baseBatch, {
  importValueId: "value-1",
  decision: "CONFIRM",
  reviewedBy: "legal-reviewer-1",
  reviewedAt: "2026-08-17T19:16:00.000Z",
});
assert(afterConfirm !== baseBatch, "Human review must return an immutable new batch.");
assert(baseBatch.values[0].reviewStatus === "EXTRACTED_UNVERIFIED", "The source batch must remain untouched.");
assert(afterConfirm.status === "HUMAN_REVIEW_IN_PROGRESS", "A partially reviewed batch must be in progress.");
assert(afterConfirm.values[0].reviewStatus === "CONFIRMED_BY_HUMAN", "The selected proposal must be confirmed.");
assert(afterConfirm.values[0].reviewedBy === "legal-reviewer-1", "Reviewer provenance must be persisted.");
assert(afterConfirm.values[0].reviewedAt === "2026-08-17T19:16:00.000Z", "Review time must be persisted.");
assert(afterConfirm.values[0].extractedValue === "FCP Exemple", "Review must not silently mutate extracted content.");
assert(afterConfirm.values[0].evidenceSha256 === "a".repeat(64), "Evidence provenance must remain intact.");
assert(afterConfirm.canonicalWriteAllowed === false, "Human confirmation alone must not enable canonical writes.");
assert(afterConfirm.readyForSubmission === false, "Human confirmation alone must not enable submission.");

const afterReject = reviewImportedProspectusValue(afterConfirm, {
  importValueId: "value-2",
  decision: "REJECT",
  reviewedBy: "legal-reviewer-2",
  reviewedAt: "2026-08-17T19:17:00.000Z",
});
assert(afterReject.values[1].reviewStatus === "REJECTED_BY_HUMAN", "The second proposal must be rejected.");
assert(afterReject.status === "REVIEWED", "A fully reviewed batch must be marked REVIEWED.");
assert(afterReject.canonicalWriteAllowed === false, "A fully reviewed batch must still not write canonically by itself.");
assert(afterReject.readyForSubmission === false, "A fully reviewed batch must still not unlock submission.");

assert.throws(
  () =>
    reviewImportedProspectusValue(afterReject, {
      importValueId: "value-1",
      decision: "REJECT",
      reviewedBy: "other-reviewer",
      reviewedAt: "2026-08-17T19:18:00.000Z",
    }),
  /IMPORT_VALUE_ALREADY_REVIEWED/,
  "A reviewed proposal must not be silently overwritten by a second decision.",
);

assert.throws(
  () =>
    reviewImportedProspectusValue(baseBatch, {
      importValueId: "missing-value",
      decision: "CONFIRM",
      reviewedBy: "legal-reviewer-1",
      reviewedAt: "2026-08-17T19:18:00.000Z",
    }),
  /IMPORT_VALUE_NOT_FOUND/,
  "Unknown proposals must be rejected.",
);

assert.throws(
  () =>
    reviewImportedProspectusValue(baseBatch, {
      importValueId: "value-1",
      decision: "CONFIRM",
      reviewedBy: " ",
      reviewedAt: "2026-08-17T19:18:00.000Z",
    }),
  /IMPORT_REVIEWER_REQUIRED/,
  "Human review must preserve reviewer identity.",
);

console.log(
  JSON.stringify(
    {
      validationId: "PROSPECTUS_IMPORT_HUMAN_REVIEW_VALIDATION_V1",
      status: "PASS",
      checks: {
        immutableReview: true,
        partialReviewState: true,
        confirmedByHumanState: true,
        rejectedByHumanState: true,
        reviewerProvenancePreserved: true,
        sourceEvidencePreserved: true,
        duplicateDecisionRejected: true,
        unknownValueRejected: true,
        canonicalWriteRemainsDisabled: true,
        readyForSubmissionRemainsFalse: true,
      },
    },
    null,
    2,
  ),
);
