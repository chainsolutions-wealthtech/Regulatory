import "server-only";

import type { EvidenceObjectStore } from "@/server/evidence/evidence-object-store";
import { createDevelopmentFilesystemEvidenceStore } from "@/server/evidence/filesystem-evidence-object-store";
import { createEvidenceIngestionService } from "@/server/evidence/evidence-ingestion-service";
import {
  getRuntimeIdentityProvider,
  regulatoryStorageDriver,
} from "@/server/storage";

let runtimeEvidenceObjectStore: EvidenceObjectStore | undefined;

export function getRuntimeEvidenceObjectStore(): EvidenceObjectStore {
  if (regulatoryStorageDriver !== "postgresql") {
    throw new Error("EVIDENCE_RUNTIME_REQUIRES_POSTGRESQL_DRIVER");
  }

  const driver = process.env.REGULATORY_EVIDENCE_DRIVER?.trim();
  if (!driver) throw new Error("RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_DRIVER");

  if (driver === "filesystem-development") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EVIDENCE_DEVELOPMENT_DRIVER_FORBIDDEN_IN_PRODUCTION");
    }
    const root = process.env.REGULATORY_EVIDENCE_ROOT?.trim();
    if (!root) throw new Error("RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_ROOT");
    runtimeEvidenceObjectStore ??= createDevelopmentFilesystemEvidenceStore(root);
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
