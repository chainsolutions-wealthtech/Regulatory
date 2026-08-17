import type { ProspectusImportBatch } from "@/domain/prospectus-import";

export interface ImportStagingRepository {
  createBatch(input: {
    batch: ProspectusImportBatch;
    projectVersionId: string;
  }): Promise<ProspectusImportBatch>;
  getBatch(importId: string): Promise<ProspectusImportBatch | null>;
  reviewValue(input: {
    importId: string;
    importValueId: string;
    decision: "CONFIRMED_BY_HUMAN" | "REJECTED_BY_HUMAN";
    reviewedAt?: string;
  }): Promise<ProspectusImportBatch>;
}
