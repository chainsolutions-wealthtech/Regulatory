import "server-only";

import { randomUUID } from "node:crypto";
import type {
  ImportedProspectusValue,
  ProspectusImportBatch,
} from "@/domain/prospectus-import";
import { assertImportRemainsUnverified } from "@/domain/prospectus-import";
import type { EvidenceReadResult } from "@/server/evidence/evidence-object-store";

export type ProspectusExtractionProposal = {
  proposedCanonicalFieldPath: string;
  extractedValue: unknown;
  confidence?: number;
  sourceLocation: {
    page?: number;
    section?: string;
    textAnchor?: string;
  };
};

export interface ProspectusExtractor {
  readonly id: string;
  readonly version: string;
  extract(input: {
    fileName: string;
    mediaType: string;
    content: Uint8Array;
  }): Promise<ProspectusExtractionProposal[]>;
}

export async function createUnverifiedProspectusImport(input: {
  projectId: string;
  projectVersion: number;
  evidence: EvidenceReadResult;
  extractor: ProspectusExtractor;
  createdAt?: string;
}): Promise<ProspectusImportBatch> {
  assertCleanEvidence(input.evidence);
  assertSupportedProspectusMediaType(input.evidence.descriptor.detectedMediaType ?? "");
  if (!input.projectId.trim()) throw new Error("IMPORT_PROJECT_REQUIRED");
  if (!Number.isInteger(input.projectVersion) || input.projectVersion < 1) {
    throw new Error("IMPORT_PROJECT_VERSION_INVALID");
  }

  const proposals = await input.extractor.extract({
    fileName: input.evidence.descriptor.safeFilename,
    mediaType: input.evidence.descriptor.detectedMediaType ?? "application/octet-stream",
    content: input.evidence.content,
  });
  const values: ImportedProspectusValue[] = proposals.map((proposal) => ({
    importValueId: randomUUID(),
    proposedCanonicalFieldPath: proposal.proposedCanonicalFieldPath,
    extractedValue: proposal.extractedValue,
    confidence: proposal.confidence,
    sourceLocation: proposal.sourceLocation,
    evidenceObjectId: input.evidence.descriptor.objectId,
    evidenceSha256: input.evidence.descriptor.sha256,
    reviewStatus: "EXTRACTED_UNVERIFIED",
  }));

  const batch: ProspectusImportBatch = {
    importId: randomUUID(),
    projectId: input.projectId,
    projectVersion: input.projectVersion,
    evidenceObjectId: input.evidence.descriptor.objectId,
    evidenceSha256: input.evidence.descriptor.sha256,
    sourceFilename: input.evidence.descriptor.safeFilename,
    sourceMediaType: input.evidence.descriptor.detectedMediaType ?? "application/octet-stream",
    createdAt: input.createdAt ?? new Date().toISOString(),
    extractorId: input.extractor.id,
    extractorVersion: input.extractor.version,
    status: "EXTRACTED_UNVERIFIED",
    values,
    canonicalWriteAllowed: false,
    readyForSubmission: false,
  };
  assertImportRemainsUnverified(batch);
  return batch;
}

function assertCleanEvidence(evidence: EvidenceReadResult): void {
  if (evidence.descriptor.state !== "CLEAN" || evidence.descriptor.scanStatus !== "CLEAN") {
    throw new Error("IMPORT_CLEAN_EVIDENCE_REQUIRED");
  }
  if (evidence.descriptor.sha256.length !== 64) throw new Error("IMPORT_EVIDENCE_SHA_REQUIRED");
}

function assertSupportedProspectusMediaType(mediaType: string): void {
  if (
    mediaType !== "application/pdf" &&
    mediaType !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    throw new Error(`IMPORT_UNSUPPORTED_MEDIA_TYPE:${mediaType}`);
  }
}
