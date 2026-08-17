export type ImportPromotionReceipt = {
  promotionId: string;
  projectId: string;
  projectVersion: number;
  importId: string;
  importValueId: string;
  questionId: string;
  sourceSha256: string;
  reviewedByUserId: string;
  promotedByUserId: string;
  promotedAt: string;
  readyForSubmission: false;
};

export interface ImportPromotionRepository {
  promoteConfirmedValue(input: {
    projectId: string;
    importId: string;
    importValueId: string;
    questionId: string;
    expectedVersion: number;
  }): Promise<ImportPromotionReceipt>;
}
