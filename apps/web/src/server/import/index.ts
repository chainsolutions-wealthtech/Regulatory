import "server-only";

import { createPostgresImportStagingRepository } from "@/server/import/postgres-import-staging-repository";
import type { ImportStagingRepository } from "@/server/import/import-staging-repository";
import { unavailableImportStagingRepository } from "@/server/import/unavailable-import-staging-repository";
import {
  getRuntimeIdentityProvider,
  getRuntimePostgresPool,
  regulatoryStorageDriver,
} from "@/server/storage";

export function getImportStagingRepository(): ImportStagingRepository {
  if (regulatoryStorageDriver !== "postgresql") return unavailableImportStagingRepository;
  return createPostgresImportStagingRepository({
    pool: getRuntimePostgresPool(),
    identityProvider: getRuntimeIdentityProvider(),
  });
}

export const importStagingRepository = getImportStagingRepository();
