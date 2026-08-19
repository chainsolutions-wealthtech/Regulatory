import "server-only";

import type { EvidenceBinaryStore } from "@/server/evidence/evidence-binary-store";
import type { EvidenceObjectStore } from "@/server/evidence/evidence-object-store";
import { createEvidenceDescriptorService } from "@/server/evidence/evidence-descriptor-service";
import { createDevelopmentFilesystemEvidenceBinaryStore } from "@/server/evidence/filesystem-evidence-binary-store";
import { createHttpAttestationEvidenceScanner } from "@/server/evidence/http-attestation-scanner";
import { createEvidenceIngestionService } from "@/server/evidence/evidence-ingestion-service";
import { createPostgresEvidenceProjectQueryRepository } from "@/server/evidence/postgres-evidence-project-query-repository";
import { createPostgresTrackedEvidenceStore } from "@/server/evidence/postgres-tracked-evidence-store";
import { createPostgresProjectVersionIdResolver } from "@/server/evidence/project-version-id-resolver";
import { createS3EvidenceBinaryStore } from "@/server/evidence/s3-evidence-binary-store";
import { readS3EvidenceRuntimeConfiguration } from "@/server/evidence/s3-evidence-runtime-config";
import { createEvidenceReleaseService } from "@/server/evidence/evidence-scan-release-service";
import { createEvidenceScanWorker } from "@/server/evidence/evidence-scan-worker";
import { createBearerOidcIdentityProvider } from "@/server/security/oidc-identity-provider";
import type { VerifiedIdentityProvider } from "@/server/security/verified-identity";
import {
  getRuntimeIdentityProvider,
  getRuntimePostgresPool,
  regulatoryStorageDriver,
} from "@/server/storage";

let runtimeBinaryEvidenceStore: EvidenceBinaryStore | undefined;
let runtimeEvidenceObjectStore: EvidenceObjectStore | undefined;

export function getRuntimeEvidenceObjectStore(): EvidenceObjectStore {
  requirePostgresqlEvidenceRuntime();
  runtimeEvidenceObjectStore ??= createTrackedStore(getRuntimeIdentityProvider());
  return runtimeEvidenceObjectStore;
}

export function getRuntimeEvidenceScanWorker() {
  requirePostgresqlEvidenceRuntime();
  const scannerDriver = process.env.REGULATORY_EVIDENCE_SCANNER_DRIVER?.trim();
  if (scannerDriver !== "http-attestation") {
    throw new Error(scannerDriver
      ? `EVIDENCE_SCANNER_DRIVER_UNSUPPORTED:${scannerDriver}`
      : "RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_SCANNER_DRIVER");
  }

  const scannerToken = requiredRuntime("REGULATORY_EVIDENCE_SCANNER_TOKEN");
  const scannerUrl = requiredRuntime("REGULATORY_EVIDENCE_SCANNER_URL");
  const serviceBearer = requiredRuntime("REGULATORY_EVIDENCE_SCANNER_SERVICE_BEARER_TOKEN");
  const serviceIdentityProvider = createBearerOidcIdentityProvider({ token: serviceBearer });
  const serviceEvidenceStore = createTrackedStore(serviceIdentityProvider);
  const scanner = createHttpAttestationEvidenceScanner({
    url: scannerUrl,
    token: scannerToken,
    nodeEnv: process.env.NODE_ENV,
  });

  return createEvidenceScanWorker({
    evidenceStore: serviceEvidenceStore,
    scanner,
    identityProvider: serviceIdentityProvider,
  });
}

function createTrackedStore(identityProvider: VerifiedIdentityProvider): EvidenceObjectStore {
  return createPostgresTrackedEvidenceStore({
    pool: getRuntimePostgresPool(),
    identityProvider,
    binaryStore: getRuntimeEvidenceBinaryStore(),
  });
}

function getRuntimeEvidenceBinaryStore(): EvidenceBinaryStore {
  if (runtimeBinaryEvidenceStore) return runtimeBinaryEvidenceStore;
  const driver = process.env.REGULATORY_EVIDENCE_DRIVER?.trim();
  if (!driver) throw new Error("RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_DRIVER");

  if (driver === "filesystem-development") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EVIDENCE_DEVELOPMENT_DRIVER_FORBIDDEN_IN_PRODUCTION");
    }
    const root = requiredRuntime("REGULATORY_EVIDENCE_ROOT");
    runtimeBinaryEvidenceStore = createDevelopmentFilesystemEvidenceBinaryStore(root);
    return runtimeBinaryEvidenceStore;
  }

  if (driver === "s3-private") {
    runtimeBinaryEvidenceStore = createS3EvidenceBinaryStore(
      readS3EvidenceRuntimeConfiguration({
        environment: process.env,
        nodeEnv: process.env.NODE_ENV,
      }),
    );
    return runtimeBinaryEvidenceStore;
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

  const encryptionKeyReference = requiredRuntime("REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE");
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
      async readForScanning(): Promise<never> {
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

function requirePostgresqlEvidenceRuntime(): void {
  if (regulatoryStorageDriver !== "postgresql") {
    throw new Error("EVIDENCE_RUNTIME_REQUIRES_POSTGRESQL_DRIVER");
  }
}

function requiredRuntime(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`RUNTIME_CONFIGURATION_MISSING:${name}`);
  return value;
}
