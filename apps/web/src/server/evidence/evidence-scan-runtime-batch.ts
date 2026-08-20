import "server-only";

import { createEvidenceScanQueueWorker } from "@/server/evidence/evidence-scan-queue-worker";
import { getRuntimeEvidenceScanWorker } from "@/server/evidence";
import { createPostgresEvidenceScanQueue } from "@/server/evidence/postgres-evidence-scan-queue";
import { createBearerOidcIdentityProvider } from "@/server/security/oidc-identity-provider";
import { getRuntimePostgresPool, regulatoryStorageDriver } from "@/server/storage";

export function getRuntimeEvidenceScanBatchWorker() {
  if (regulatoryStorageDriver !== "postgresql") {
    throw new Error("EVIDENCE_SCAN_BATCH_REQUIRES_POSTGRESQL_DRIVER");
  }
  const serviceBearer = requiredRuntime("REGULATORY_EVIDENCE_SCANNER_SERVICE_BEARER_TOKEN");
  const identityProvider = createBearerOidcIdentityProvider({ token: serviceBearer });
  const queue = createPostgresEvidenceScanQueue({
    pool: getRuntimePostgresPool(),
    identityProvider,
  });
  return createEvidenceScanQueueWorker({
    queue,
    scannerWorker: getRuntimeEvidenceScanWorker(),
  });
}

function requiredRuntime(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`RUNTIME_CONFIGURATION_MISSING:${name}`);
  return value;
}
