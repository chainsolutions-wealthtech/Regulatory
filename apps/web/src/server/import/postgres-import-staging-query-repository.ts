import "server-only";

import type { Pool, PoolClient } from "pg";
import type {
  ImportStagingQueryRepository,
  ImportStagingSummary,
} from "@/server/import/import-staging-query-repository";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

export function createPostgresImportStagingQueryRepository(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
}): ImportStagingQueryRepository {
  return {
    async listProjectImports(projectId) {
      return withTenantReadOnly(input, async (client) => {
        const result = await client.query<{
          id: string;
          project_id: string;
          version_number: number;
          source_filename: string;
          source_media_type: string;
          evidence_sha256: string;
          extractor_id: string;
          extractor_version: string;
          status: ImportStagingSummary["status"];
          created_at: Date | string;
          value_count: string;
          pending_count: string;
          confirmed_count: string;
          rejected_count: string;
        }>(
          `select b.id, b.project_id, pv.version_number,
                  b.source_filename, b.source_media_type, b.evidence_sha256,
                  b.extractor_id, b.extractor_version, b.status, b.created_at,
                  count(v.id)::text as value_count,
                  count(v.id) filter (where v.review_status = 'EXTRACTED_UNVERIFIED')::text as pending_count,
                  count(v.id) filter (where v.review_status = 'CONFIRMED_BY_HUMAN')::text as confirmed_count,
                  count(v.id) filter (where v.review_status = 'REJECTED_BY_HUMAN')::text as rejected_count
             from regulatory.prospectus_import_batches b
             join regulatory.project_versions pv on pv.id = b.project_version_id
             left join regulatory.prospectus_import_values v on v.import_batch_id = b.id
            where b.project_id = $1
            group by b.id, b.project_id, pv.version_number
            order by b.created_at desc, b.id desc`,
          [projectId],
        );
        return result.rows.map((row) => ({
          importId: row.id,
          projectId: row.project_id,
          projectVersion: row.version_number,
          sourceFilename: row.source_filename,
          sourceMediaType: row.source_media_type,
          evidenceSha256: row.evidence_sha256,
          extractorId: row.extractor_id,
          extractorVersion: row.extractor_version,
          status: row.status,
          createdAt: toIso(row.created_at),
          valueCount: Number(row.value_count),
          pendingCount: Number(row.pending_count),
          confirmedCount: Number(row.confirmed_count),
          rejectedCount: Number(row.rejected_count),
          canonicalWriteAllowed: false,
          readyForSubmission: false,
        }));
      });
    },
  };
}

async function withTenantReadOnly<T>(
  repositoryInput: { pool: Pool; identityProvider: VerifiedIdentityProvider },
  work: (client: PoolClient, identity: VerifiedIdentityContext) => Promise<T>,
): Promise<T> {
  const identity = assertVerifiedIdentity(await repositoryInput.identityProvider.getVerifiedIdentity());
  const client = await repositoryInput.pool.connect();
  try {
    await client.query("begin read only");
    await client.query(`select set_config('app.current_organization_id', $1, true)`, [
      identity.organizationId,
    ]);
    const membership = await client.query(
      `select 1
         from regulatory.organization_memberships
        where organization_id = $1 and user_id = $2 and revoked_at is null
        limit 1`,
      [identity.organizationId, identity.userId],
    );
    if (membership.rowCount !== 1) throw new Error("ORGANIZATION_MEMBERSHIP_REQUIRED");
    const result = await work(client, identity);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
