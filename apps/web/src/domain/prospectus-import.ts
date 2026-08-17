export type ImportedValueReviewStatus =
  | "EXTRACTED_UNVERIFIED"
  | "CONFIRMED_BY_HUMAN"
  | "REJECTED_BY_HUMAN";

export type ImportedSourceLocation = {
  page?: number;
  section?: string;
  textAnchor?: string;
};

export type ImportedValuePromotion = {
  promotionId: string;
  questionId: string;
  projectVersion: number;
  promotedBy: string;
  promotedAt: string;
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
  promotion?: ImportedValuePromotion;
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

export type ImportedProspectusReviewInput = {
  importValueId: string;
  decision: "CONFIRM" | "REJECT";
  reviewedBy: string;
  reviewedAt?: string;
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
    if (value.reviewStatus === "EXTRACTED_UNVERIFIED") {
      if (value.reviewedBy || value.reviewedAt) throw new Error("IMPORT_UNVERIFIED_VALUE_HAS_REVIEW_PROVENANCE");
    } else if (!value.reviewedBy || !value.reviewedAt) {
      throw new Error("IMPORT_REVIEW_PROVENANCE_REQUIRED");
    }
    if (value.promotion) {
      if (value.reviewStatus !== "CONFIRMED_BY_HUMAN") {
        throw new Error("IMPORT_PROMOTION_REQUIRES_CONFIRMED_VALUE");
      }
      if (
        !value.promotion.promotionId ||
        !value.promotion.questionId.trim() ||
        !Number.isInteger(value.promotion.projectVersion) ||
        value.promotion.projectVersion < 1 ||
        !value.promotion.promotedBy ||
        Number.isNaN(Date.parse(value.promotion.promotedAt))
      ) {
        throw new Error("IMPORT_PROMOTION_PROVENANCE_INVALID");
      }
    }
  }
}

/**
 * Applique une décision humaine à une proposition extraite sans écrire dans le
 * modèle canonique. La confirmation signifie uniquement "la proposition a été
 * revue par un humain" ; elle n'est ni une approbation juridique globale, ni
 * une autorisation de soumission, ni une opération de persistance projet.
 */
export function reviewImportedProspectusValue(
  batch: ProspectusImportBatch,
  input: ImportedProspectusReviewInput,
): ProspectusImportBatch {
  assertImportRemainsUnverified(batch);
  if (!input.reviewedBy.trim()) throw new Error("IMPORT_REVIEWER_REQUIRED");
  const reviewedAt = input.reviewedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(reviewedAt))) throw new Error("IMPORT_REVIEW_TIMESTAMP_INVALID");

  const index = batch.values.findIndex((value) => value.importValueId === input.importValueId);
  if (index < 0) throw new Error("IMPORT_VALUE_NOT_FOUND");
  if (batch.values[index].reviewStatus !== "EXTRACTED_UNVERIFIED") {
    throw new Error("IMPORT_VALUE_ALREADY_REVIEWED");
  }

  const values = batch.values.map((value, valueIndex) =>
    valueIndex === index
      ? {
          ...value,
          reviewStatus:
            input.decision === "CONFIRM"
              ? ("CONFIRMED_BY_HUMAN" as const)
              : ("REJECTED_BY_HUMAN" as const),
          reviewedBy: input.reviewedBy,
          reviewedAt,
        }
      : { ...value },
  );

  const reviewedCount = values.filter((value) => value.reviewStatus !== "EXTRACTED_UNVERIFIED").length;
  const status: ProspectusImportBatch["status"] =
    reviewedCount === values.length
      ? "REVIEWED"
      : reviewedCount > 0
        ? "HUMAN_REVIEW_IN_PROGRESS"
        : "EXTRACTED_UNVERIFIED";

  const reviewedBatch: ProspectusImportBatch = {
    ...batch,
    status,
    values,
    canonicalWriteAllowed: false,
    readyForSubmission: false,
  };
  assertImportRemainsUnverified(reviewedBatch);
  return reviewedBatch;
}
