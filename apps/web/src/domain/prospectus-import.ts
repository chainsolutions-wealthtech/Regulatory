export type ImportedValueReviewStatus =
  | "EXTRACTED_UNVERIFIED"
  | "CONFIRMED_BY_HUMAN"
  | "REJECTED_BY_HUMAN";

export type ImportedSourceLocation = {
  page?: number;
  section?: string;
  textAnchor?: string;
};

export type ImportedProspectusValue = {
  importValueId: string;
  proposedCanonicalFieldPath: string;
  extractedValue: unknown;
  confidence?: number;
  sourceLocation: ImportedSourceLocation;
  evidenceObjectId: string;
  evidenceSha256: string;
  reviewStatus: ImportedValueReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
};

export type ProspectusImportBatch = {
  importId: string;
  projectId: string;
  projectVersion: number;
  evidenceObjectId: string;
  evidenceSha256: string;
  sourceFilename: string;
  sourceMediaType: string;
  createdAt: string;
  extractorId: string;
  extractorVersion: string;
  status: "EXTRACTED_UNVERIFIED" | "HUMAN_REVIEW_IN_PROGRESS" | "REVIEWED";
  values: ImportedProspectusValue[];
  canonicalWriteAllowed: false;
  readyForSubmission: false;
};

export function assertImportRemainsUnverified(batch: ProspectusImportBatch): void {
  if (batch.canonicalWriteAllowed !== false) throw new Error("IMPORT_CANONICAL_WRITE_MUST_REMAIN_FALSE");
  if (batch.readyForSubmission !== false) throw new Error("IMPORT_READY_FOR_SUBMISSION_MUST_REMAIN_FALSE");
  if (batch.status === "EXTRACTED_UNVERIFIED") {
    if (batch.values.some((value) => value.reviewStatus !== "EXTRACTED_UNVERIFIED")) {
      throw new Error("IMPORT_UNREVIEWED_BATCH_CONTAINS_REVIEWED_VALUE");
    }
  }
  for (const value of batch.values) {
    if (!value.evidenceObjectId || !/^[0-9a-f]{64}$/u.test(value.evidenceSha256)) {
      throw new Error("IMPORT_VALUE_EVIDENCE_PROVENANCE_REQUIRED");
    }
    if (!value.proposedCanonicalFieldPath.trim()) {
      throw new Error("IMPORT_CANONICAL_FIELD_PROPOSAL_REQUIRED");
    }
    if (value.confidence !== undefined && (value.confidence < 0 || value.confidence > 1)) {
      throw new Error("IMPORT_CONFIDENCE_OUT_OF_RANGE");
    }
  }
}
