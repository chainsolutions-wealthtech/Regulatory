import "server-only";

import type { ImportPromotionRepository } from "@/server/import/import-promotion-repository";

const unavailable = async (): Promise<never> => {
  throw new Error(
    "IMPORT_PROMOTION_REPOSITORY_UNAVAILABLE: configure PostgreSQL and a verified OIDC identity before promoting reviewed import values.",
  );
};

export const unavailableImportPromotionRepository: ImportPromotionRepository = {
  promoteConfirmedValue: unavailable,
};
