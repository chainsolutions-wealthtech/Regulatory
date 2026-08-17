import "server-only";

import type { ImportStagingQueryRepository } from "@/server/import/import-staging-query-repository";

const unavailable = async (): Promise<never> => {
  throw new Error(
    "IMPORT_STAGING_QUERY_UNAVAILABLE: configure PostgreSQL and a verified OIDC identity before listing staged imports.",
  );
};

export const unavailableImportStagingQueryRepository: ImportStagingQueryRepository = {
  listProjectImports: unavailable,
};
