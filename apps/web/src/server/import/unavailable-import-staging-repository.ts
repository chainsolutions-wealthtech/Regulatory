import "server-only";

import type { ImportStagingRepository } from "@/server/import/import-staging-repository";

const unavailable = async (): Promise<never> => {
  throw new Error(
    "IMPORT_STAGING_REPOSITORY_UNAVAILABLE: configure PostgreSQL and a verified OIDC identity before using import staging actions.",
  );
};

export const unavailableImportStagingRepository: ImportStagingRepository = {
  createBatch: unavailable,
  getBatch: unavailable,
  reviewValue: unavailable,
};
