export type ImportStagingSummary = {
  importId: string;
  projectId: string;
  projectVersion: number;
  sourceFilename: string;
  sourceMediaType: string;
  evidenceSha256: string;
  extractorId: string;
  extractorVersion: string;
  status: "EXTRACTED_UNVERIFIED" | "HUMAN_REVIEW_IN_PROGRESS" | "REVIEWED";
  createdAt: string;
  valueCount: number;
  pendingCount: number;
  confirmedCount: number;
  rejectedCount: number;
  canonicalWriteAllowed: false;
  readyForSubmission: false;
};

export interface ImportStagingQueryRepository {
  listProjectImports(projectId: string): Promise<ImportStagingSummary[]>;
}
