import "server-only";

import { Pool } from "pg";
import { createNextOidcIdentityProvider } from "@/server/security/oidc-identity-provider";
import type { VerifiedIdentityProvider } from "@/server/security/verified-identity";
import {
  createFileSystemArtifactStore,
  type ArtifactStore,
} from "@/server/storage/artifact-store";
import {
  createPostgresGenerationArtifactRepository,
  localGenerationArtifactRepository,
  type GenerationArtifactRepository,
} from "@/server/storage/generation-artifact-repository";
import { localProjectRepository } from "@/server/storage/local-project-repository";
import { createPostgresProjectRepository } from "@/server/storage/postgres-project-repository";
import type { ProjectRepository } from "@/server/storage/project-repository";

export type RegulatoryStorageDriver = "local-json" | "postgresql";

export const regulatoryStorageDriver = resolveStorageDriver();

let runtimePool: Pool | undefined;
let runtimeIdentityProvider: VerifiedIdentityProvider | undefined;
let runtimeArtifactStore: ArtifactStore | undefined;

/**
 * Retourne le pool applicatif PostgreSQL. Aucun URL par défaut ni secret fictif
 * n'est accepté lorsque le driver PostgreSQL est sélectionné.
 */
export function getRuntimePostgresPool(): Pool {
  if (regulatoryStorageDriver !== "postgresql") {
    throw new Error("POSTGRESQL_RUNTIME_REQUIRES_POSTGRESQL_DRIVER");
  }
  if (!runtimePool) {
    runtimePool = new Pool({
      connectionString: requiredEnvironment("DATABASE_URL"),
      application_name: "regulatory-prospectus-web",
      max: Number(process.env.DATABASE_POOL_MAX ?? "10"),
      idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? "30000"),
      connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? "5000"),
    });
  }
  return runtimePool;
}

/**
 * Retourne le fournisseur d'identité OIDC vérifié. La configuration de
 * l'émetteur, de l'audience et du JWKS est contrôlée lors de la résolution
 * effective de l'identité.
 */
export function getRuntimeIdentityProvider(): VerifiedIdentityProvider {
  if (regulatoryStorageDriver !== "postgresql") {
    throw new Error("OIDC_RUNTIME_REQUIRES_POSTGRESQL_DRIVER");
  }
  runtimeIdentityProvider ??= createNextOidcIdentityProvider();
  return runtimeIdentityProvider;
}

/**
 * Store binaire runtime. Le filesystem reste un adaptateur de pré-production ;
 * son remplacement par un stockage objet ne doit pas modifier les repositories.
 */
export function getRuntimeArtifactStore(): ArtifactStore {
  if (regulatoryStorageDriver !== "postgresql") {
    throw new Error("ARTIFACT_RUNTIME_REQUIRES_POSTGRESQL_DRIVER");
  }
  runtimeArtifactStore ??= createFileSystemArtifactStore(
    requiredEnvironment("REGULATORY_ARTIFACT_ROOT"),
  );
  return runtimeArtifactStore;
}

export function getProjectRepository(): ProjectRepository {
  if (regulatoryStorageDriver === "local-json") return localProjectRepository;
  return createPostgresProjectRepository({
    pool: getRuntimePostgresPool(),
    identityProvider: getRuntimeIdentityProvider(),
    artifactStore: getRuntimeArtifactStore(),
  });
}

export function getGenerationArtifactRepository(): GenerationArtifactRepository {
  if (regulatoryStorageDriver === "local-json") return localGenerationArtifactRepository;
  return createPostgresGenerationArtifactRepository({
    pool: getRuntimePostgresPool(),
    identityProvider: getRuntimeIdentityProvider(),
    artifactStore: getRuntimeArtifactStore(),
  });
}

export const projectRepository = getProjectRepository();
export const generationArtifactRepository = getGenerationArtifactRepository();

function resolveStorageDriver(): RegulatoryStorageDriver {
  const value = process.env.REGULATORY_STORAGE_DRIVER?.trim() || "local-json";
  if (value === "local-json" || value === "postgresql") return value;
  throw new Error(`UNSUPPORTED_STORAGE_DRIVER:${value}`);
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`RUNTIME_CONFIGURATION_MISSING:${name}`);
  return value;
}
