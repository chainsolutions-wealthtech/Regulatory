import "server-only";

import type { EvidenceObjectStore } from "@/server/evidence/evidence-object-store";
import { createEvidenceDescriptorService } from "@/server/evidence/evidence-descriptor-service";
import { createDevelopmentFilesystemEvidenceStore } from "@/server/evidence/filesystem-evidence-object-store";
import { createEvidenceIngestionService } from "@/server/evidence/evidence-ingestion-service";
import { createPostgresEvidenceProjectQueryRepository } from "@/server/evidence/postgres-evidence-project-query-repository";
import { createPostgresTrackedEvidenceStore } from "@/server/evidence/postgres-tracked-evidence-store";
import { createPostgresProjectVersionIdResolver } from "@/server/evidence/project-version-id-resolver";
import { createEvidenceReleaseService } from "@/server/evidence/evidence-scan-release-service";
import {
  getRuntimeIdentityProvider,
  getRuntimePostgresPool,
  regulatoryStorageDriver,
} from "@/server/storage";

let runtimeBinaryEvidenceStore: EvidenceObjectStore | undefined;
let runtimeEvidenceObjectStore: EvidenceObjectStore | undefined;

export function getRuntimeEvidenceObjectStore(): EvidenceObjectStore {
  if (regulatoryStorageDriver !== "postgresql") {
    throw new Error("EVIDENCE_RUNTIME_REQUIRES_POSTGRESQL_DRIVER");
  }
  if (runtimeEvidenceObjectStore) return runtimeEvidenceObjectStore;

  const driver = process.env.REGULATORY_EVIDENCE_DRIVER?.trim();
  if (!driver) throw new Error("RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_DRIVER");

  if (driver === "filesystem-development") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EVIDENCE_DEVELOPMENT_DRIVER_FORBIDDEN_IN_PRODUCTION");
    }
    const root = process.env.REGULATORY_EVIDENCE_ROOT?.trim();
    if (!root) throw new Error("RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_ROOT");
    runtimeBinaryEvidenceStore ??= createDevelopmentFilesystemEvidenceStore(root);
    runtimeEvidenceObjectStore = createPostgresTrackedEvidenceStore({
      pool: getRuntimePostgresPool(),
      identityProvider: getRuntimeIdentityProvider(),
      binaryStore: runtimeBinaryEvidenceStore,
    });
    return runtimeEvidenceObjectStore;
  }

  throw new Error(`EVIDENCE_RUNTIME_DRIVER_UNSUPPORTED:${driver}`);
}

export function getRuntimeEvidenceIngestionService() {
  if (regulatoryStorageDriver !== "postgresql") {
    return {
      async stageEvidence(): Promise<never> {
        throw new Error(
          "EVIDENCE_INGESTION_SERVICE_UNAVAILABLE: configure PostgreSQL, OIDC and a private evidence store before upload.",
        );
      },
    };
  }

  const encryptionKeyReference = process.env.REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE?.trim();
  if (!encryptionKeyReference) {
    throw new Error("RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE");
  }
  return createEvidenceIngestionService({
    evidenceStore: getRuntimeEvidenceObjectStore(),
    identityProvider: getRuntimeIdentityProvider(),
    encryptionKeyReference,
  });
}

export function getRuntimeEvidenceDescriptorService() {
  if (regulatoryStorageDriver !== "postgresql") {
    return {
      async readMetadata(): Promise<never> {
        throw new Error("EVIDENCE_DESCRIPTOR_SERVICE_UNAVAILABLE: configure PostgreSQL, OIDC and a private evidence store.");
      },
      async readForVerification(): Promise<never> {
        throw new Error("EVIDENCE_DESCRIPTOR_SERVICE_UNAVAILABLE: configure PostgreSQL, OIDC and a private evidence store.");
      },
    };
  }
  return createEvidenceDescriptorService({
    evidenceStore: getRuntimeEvidenceObjectStore(),
    identityProvider: getRuntimeIdentityProvider(),
  });
}

export function getRuntimeEvidenceReleaseService() {
  if (regulatoryStorageDriver !== "postgresql") {
    return {
      async releaseCleanScan(): Promise<never> {
        throw new Error("EVIDENCE_RELEASE_SERVICE_UNAVAILABLE: configure PostgreSQL, OIDC and a private evidence store.");
      },
    };
  }
  return createEvidenceReleaseService({
    evidenceStore: getRuntimeEvidenceObjectStore(),
    identityProvider: getRuntimeIdentityProvider(),
  });
}

export function getRuntimeProjectVersionIdResolver() {
  if (regulatoryStorageDriver !== "postgresql") {
    return {
      async resolve(): Promise<never> {
        throw new Error("PROJECT_VERSION_ID_RESOLVER_UNAVAILABLE: PostgreSQL + OIDC requis.");
      },
    };
  }
  return createPostgresProjectVersionIdResolver({
    pool: getRuntimePostgresPool(),
    identityProvider: getRuntimeIdentityProvider(),
  });
}

export function getRuntimeEvidenceProjectQueryRepository() {
  if (regulatoryStorageDriver !== "postgresql") {
    return {
      async listProjectEvidence(): Promise<never> {
        throw new Error("EVIDENCE_PROJECT_QUERY_UNAVAILABLE: PostgreSQL + OIDC requis.");
      },
    };
  }
  return createPostgresEvidenceProjectQueryRepository({
    pool: getRuntimePostgresPool(),
    identityProvider: getRuntimeIdentityProvider(),
  });
}
