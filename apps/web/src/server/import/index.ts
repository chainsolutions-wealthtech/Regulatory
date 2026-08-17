import "server-only";

import { createPostgresImportPromotionRepository } from "@/server/import/postgres-import-promotion-repository";
import { createPostgresImportStagingRepository } from "@/server/import/postgres-import-staging-repository";
import type { ImportPromotionRepository } from "@/server/import/import-promotion-repository";
import type { ImportStagingRepository } from "@/server/import/import-staging-repository";
import { unavailableImportPromotionRepository } from "@/server/import/unavailable-import-promotion-repository";
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

export function getImportPromotionRepository(): ImportPromotionRepository {
  if (regulatoryStorageDriver !== "postgresql") return unavailableImportPromotionRepository;
  return createPostgresImportPromotionRepository({
    pool: getRuntimePostgresPool(),
    identityProvider: getRuntimeIdentityProvider(),
  });
}

export const importStagingRepository = getImportStagingRepository();
export const importPromotionRepository = getImportPromotionRepository();
