import "server-only";

import { createPostgresImportStagingQueryRepository } from "@/server/import/postgres-import-staging-query-repository";
import type { ImportStagingQueryRepository } from "@/server/import/import-staging-query-repository";
import { unavailableImportStagingQueryRepository } from "@/server/import/unavailable-import-staging-query-repository";
import {
  getRuntimeIdentityProvider,
  getRuntimePostgresPool,
  regulatoryStorageDriver,
} from "@/server/storage";

export function getImportStagingQueryRepository(): ImportStagingQueryRepository {
  if (regulatoryStorageDriver !== "postgresql") return unavailableImportStagingQueryRepository;
  return createPostgresImportStagingQueryRepository({
    pool: getRuntimePostgresPool(),
    identityProvider: getRuntimeIdentityProvider(),
  });
}

export const importStagingQueryRepository = getImportStagingQueryRepository();
