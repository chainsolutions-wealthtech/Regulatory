import "server-only";

import { getRuntimeEvidenceObjectStore } from "@/server/evidence";
import { createBinaryProspectusExtractor } from "@/server/import/binary-prospectus-extractor";
import type { ImportPromotionRepository } from "@/server/import/import-promotion-repository";
import type { ImportStagingRepository } from "@/server/import/import-staging-repository";
import { createPostgresImportPromotionRepository } from "@/server/import/postgres-import-promotion-repository";
import { createPostgresImportStagingRepository } from "@/server/import/postgres-import-staging-repository";
import { createProspectusImportIngestionService } from "@/server/import/prospectus-import-ingestion-service";
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

export function getProspectusImportIngestionService() {
  if (regulatoryStorageDriver !== "postgresql") {
    return {
      async extractAndStage(): Promise<never> {
        throw new Error(
          "IMPORT_INGESTION_SERVICE_UNAVAILABLE: configure PostgreSQL, OIDC and a private evidence store before extraction.",
        );
      },
    };
  }

  const identityProvider = getRuntimeIdentityProvider();
  return createProspectusImportIngestionService({
    evidenceStore: getRuntimeEvidenceObjectStore(),
    stagingRepository: createPostgresImportStagingRepository({
      pool: getRuntimePostgresPool(),
      identityProvider,
    }),
    identityProvider,
    extractor: createBinaryProspectusExtractor(),
  });
}

export const importStagingRepository = getImportStagingRepository();
export const importPromotionRepository = getImportPromotionRepository();
