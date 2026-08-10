import "server-only";

import { createHash } from "node:crypto";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import {
  listGenerationArtifacts as listLocalGenerationArtifacts,
  readGenerationArtifact as readLocalGenerationArtifact,
} from "@/server/project-store";
import type { ArtifactStore } from "@/server/storage/artifact-store";
import type {
  GenerationArtifactContent,
  GenerationArtifactSummary,
} from "@/server/storage/generation-artifact-types";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

// Public repository consumers (preview page and artifact panel) need the summary
// contract, while the source of truth for the shape remains generation-artifact-types.
export type { GenerationArtifactSummary };

export interface GenerationArtifactRepository {
  readonly driver: "local-json" | "postgresql";
  list(projectId: string, generationId: string): Promise<GenerationArtifactSummary[]>;
  read(projectId: string, generationId: string, fileName: string): Promise<GenerationArtifactContent | null>;
}

export const localGenerationArtifactRepository: GenerationArtifactRepository = {
  driver: "local-json",
  list: listLocalGenerationArtifacts,
  read: readLocalGenerationArtifact,
};

export function createPostgresGenerationArtifactRepository(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
  artifactStore: ArtifactStore;
}): GenerationArtifactRepository {
  return {
    driver: "postgresql",
    async list(projectId, generationId) {
      const identity = await resolveIdentity(input.identityProvider);
      return withTenantTransaction(input.pool, identity, async (client) => {
        const result = await client.query<GeneratedDocumentRow>(
          `select gd.generation_id, gd.document_type, gd.media_type,
                  gd.storage_reference, gd.sha256, gd.byte_size, gd.generation_manifest
             from regulatory.generated_documents gd
             join regulatory.project_versions pv on pv.id = gd.project_version_id
            where pv.project_id = $1
              and gd.generation_id = $2
            order by gd.document_type`,
          [projectId, generationId],
        );
        return result.rows.map(toSummary);
      });
    },
    async read(projectId, generationId, fileName) {
      const safeName = safeFileName(fileName);
      const identity = await resolveIdentity(input.identityProvider);
      const row = await withTenantTransaction(input.pool, identity, async (client) => {
        const result = await client.query<GeneratedDocumentRow>(
          `select gd.generation_id, gd.document_type, gd.media_type,
                  gd.storage_reference, gd.sha256, gd.byte_size, gd.generation_manifest
             from regulatory.generated_documents gd
             join regulatory.project_versions pv on pv.id = gd.project_version_id
            where pv.project_id = $1
              and gd.generation_id = $2
              and gd.generation_manifest->>'artifact_file_name' = $3
            limit 1`,
          [projectId, generationId, safeName],
        );
        return result.rows[0] ?? null;
      });
      if (!row) return null;
      const content = await input.artifactStore.read(row.storage_reference);
      assertIntegrity(row, content);
      return { ...toSummary(row), content };
    },
  };
}

type GeneratedDocumentRow = QueryResultRow & {
  generation_id: string;
  document_type: string;
  media_type: string;
  storage_reference: string;
  sha256: string;
  byte_size: number | string;
  generation_manifest: unknown;
};

function toSummary(row: GeneratedDocumentRow): GenerationArtifactSummary {
  return {
    generationId: row.generation_id,
    fileName: manifestFileName(row.generation_manifest),
    documentType: row.document_type,
    mediaType: row.media_type,
    sha256: row.sha256,
    byteSize: Number(row.byte_size),
  };
}

function manifestFileName(value: unknown): string {
  const parsed = normalizeJson(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("GENERATED_DOCUMENT_MANIFEST_INVALID");
  }
  return safeFileName(String((parsed as Record<string, unknown>).artifact_file_name ?? ""));
}

function normalizeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("GENERATED_DOCUMENT_MANIFEST_INVALID");
  }
}

function assertIntegrity(row: GeneratedDocumentRow, content: Buffer): void {
  const digest = createHash("sha256").update(content).digest("hex");
  if (digest !== row.sha256 || content.byteLength !== Number(row.byte_size)) {
    throw new Error("GENERATED_ARTIFACT_INTEGRITY_MISMATCH");
  }
}

function safeFileName(value: string): string {
  if (!/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(value) || value.includes("..")) {
    throw new Error("INVALID_ARTIFACT_FILE_NAME");
  }
  return value;
}

async function resolveIdentity(provider: VerifiedIdentityProvider): Promise<VerifiedIdentityContext> {
  return assertVerifiedIdentity(await provider.getVerifiedIdentity());
}

async function withTenantTransaction<T>(
  pool: Pool,
  identity: VerifiedIdentityContext,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.current_organization_id', $1, true)", [
      identity.organizationId,
    ]);
    const membership = await client.query(
      `select 1
         from regulatory.organization_memberships
        where organization_id = $1
          and user_id = $2
          and revoked_at is null
        limit 1`,
      [identity.organizationId, identity.userId],
    );
    if (membership.rowCount !== 1) throw new Error("IDENTITY_ORGANIZATION_MEMBERSHIP_REQUIRED");
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
