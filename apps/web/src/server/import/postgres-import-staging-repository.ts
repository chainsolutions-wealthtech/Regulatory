import "server-only";

import type { Pool, PoolClient } from "pg";
import {
  assertImportRemainsUnverified,
  type ProspectusImportBatch,
  type ImportedProspectusValue,
} from "@/domain/prospectus-import";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

export interface PostgresImportStagingRepository {
  createBatch(input: {
    batch: ProspectusImportBatch;
    projectVersionId: string;
  }): Promise<ProspectusImportBatch>;
  getBatch(importId: string): Promise<ProspectusImportBatch | null>;
  reviewValue(input: {
    importId: string;
    importValueId: string;
    decision: "CONFIRMED_BY_HUMAN" | "REJECTED_BY_HUMAN";
    reviewedAt?: string;
  }): Promise<ProspectusImportBatch>;
}

export function createPostgresImportStagingRepository(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
}): PostgresImportStagingRepository {
  return {
    async createBatch({ batch, projectVersionId }) {
      assertImportRemainsUnverified(batch);
      return withTenantTransaction(input, async (client, identity) => {
        const evidence = await client.query<{
          id: string;
          sha256: string;
          state: string;
          scan_status: string;
          project_version_id: string;
        }>(
          `select id, sha256, state::text, scan_status::text, project_version_id
             from regulatory.evidence_objects
            where id = $1`,
          [batch.evidenceObjectId],
        );
        if (
          evidence.rowCount !== 1 ||
          evidence.rows[0].project_version_id !== projectVersionId ||
          evidence.rows[0].sha256 !== batch.evidenceSha256
        ) {
          throw new Error("IMPORT_EVIDENCE_SCOPE_MISMATCH");
        }
        if (evidence.rows[0].state !== "CLEAN" || evidence.rows[0].scan_status !== "CLEAN") {
          throw new Error("IMPORT_CLEAN_EVIDENCE_REQUIRED");
        }

        const projectVersion = await client.query<{ project_id: string; version_number: number }>(
          `select project_id, version_number
             from regulatory.project_versions
            where id = $1`,
          [projectVersionId],
        );
        if (
          projectVersion.rowCount !== 1 ||
          projectVersion.rows[0].project_id !== batch.projectId ||
          projectVersion.rows[0].version_number !== batch.projectVersion
        ) {
          throw new Error("IMPORT_PROJECT_SCOPE_MISMATCH");
        }

        await client.query(
          `insert into regulatory.prospectus_import_batches (
             id, organization_id, project_id, project_version_id,
             evidence_object_id, evidence_sha256, source_filename, source_media_type,
             extractor_id, extractor_version, status,
             canonical_write_allowed, ready_for_submission, created_by, created_at
           ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,false,$12,$13)`,
          [
            batch.importId,
            identity.organizationId,
            batch.projectId,
            projectVersionId,
            batch.evidenceObjectId,
            batch.evidenceSha256,
            batch.sourceFilename,
            batch.sourceMediaType,
            batch.extractorId,
            batch.extractorVersion,
            batch.status,
            identity.userId,
            batch.createdAt,
          ],
        );

        for (const value of batch.values) {
          await client.query(
            `insert into regulatory.prospectus_import_values (
               id, organization_id, import_batch_id, proposed_canonical_field_path,
               extracted_value, confidence, source_location,
               evidence_object_id, evidence_sha256, review_status
             ) values ($1,$2,$3,$4,$5::jsonb,$6,$7::jsonb,$8,$9,$10)`,
            [
              value.importValueId,
              identity.organizationId,
              batch.importId,
              value.proposedCanonicalFieldPath,
              JSON.stringify(value.extractedValue),
              value.confidence ?? null,
              JSON.stringify(value.sourceLocation ?? {}),
              value.evidenceObjectId,
              value.evidenceSha256,
              value.reviewStatus,
            ],
          );
        }

        return readBatch(client, batch.importId);
      });
    },

    async getBatch(importId) {
      return withTenantTransaction(input, async (client) => {
        const found = await readBatchNullable(client, importId);
        return found;
      }, true);
    },

    async reviewValue({ importId, importValueId, decision, reviewedAt }) {
      return withTenantTransaction(input, async (client, identity) => {
        if (!identity.roles.some((role) => role === "COMPLIANCE" || role === "LEGAL")) {
          throw new Error("IMPORT_REVIEW_ROLE_REQUIRED");
        }
        const reviewTimestamp = reviewedAt ?? new Date().toISOString();
        if (!Number.isFinite(Date.parse(reviewTimestamp))) {
          throw new Error("IMPORT_REVIEW_TIMESTAMP_INVALID");
        }

        const existing = await client.query<{ review_status: string }>(
          `select review_status
             from regulatory.prospectus_import_values
            where id = $1 and import_batch_id = $2
            for update`,
          [importValueId, importId],
        );
        if (existing.rowCount !== 1) throw new Error("IMPORT_VALUE_NOT_FOUND");
        if (existing.rows[0].review_status !== "EXTRACTED_UNVERIFIED") {
          throw new Error("IMPORT_VALUE_ALREADY_REVIEWED");
        }

        await client.query(
          `update regulatory.prospectus_import_values
              set review_status = $1,
                  reviewed_by = $2,
                  reviewed_at = $3
            where id = $4 and import_batch_id = $5`,
          [decision, identity.userId, reviewTimestamp, importValueId, importId],
        );

        const counts = await client.query<{ total: string; pending: string }>(
          `select count(*)::text as total,
                  count(*) filter (where review_status = 'EXTRACTED_UNVERIFIED')::text as pending
             from regulatory.prospectus_import_values
            where import_batch_id = $1`,
          [importId],
        );
        const total = Number(counts.rows[0]?.total ?? 0);
        const pending = Number(counts.rows[0]?.pending ?? 0);
        if (total < 1) throw new Error("IMPORT_BATCH_EMPTY");
        const status = pending === 0 ? "REVIEWED" : "HUMAN_REVIEW_IN_PROGRESS";
        await client.query(
          `update regulatory.prospectus_import_batches
              set status = $1
            where id = $2`,
          [status, importId],
        );

        return readBatch(client, importId);
      });
    },
  };
}

async function withTenantTransaction<T>(
  repositoryInput: { pool: Pool; identityProvider: VerifiedIdentityProvider },
  work: (client: PoolClient, identity: VerifiedIdentityContext) => Promise<T>,
  readOnly = false,
): Promise<T> {
  const identity = assertVerifiedIdentity(await repositoryInput.identityProvider.getVerifiedIdentity());
  const client = await repositoryInput.pool.connect();
  try {
    await client.query(readOnly ? "begin read only" : "begin");
    await client.query(`select set_config('app.current_organization_id', $1, true)`, [
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

async function readBatch(client: PoolClient, importId: string): Promise<ProspectusImportBatch> {
  const batch = await readBatchNullable(client, importId);
  if (!batch) throw new Error("IMPORT_BATCH_NOT_FOUND");
  return batch;
}

async function readBatchNullable(
  client: PoolClient,
  importId: string,
): Promise<ProspectusImportBatch | null> {
  const batchResult = await client.query<{
    id: string;
    project_id: string;
    version_number: number;
    evidence_object_id: string;
    evidence_sha256: string;
    source_filename: string;
    source_media_type: string;
    created_at: Date | string;
    extractor_id: string;
    extractor_version: string;
    status: ProspectusImportBatch["status"];
    canonical_write_allowed: false;
    ready_for_submission: false;
  }>(
    `select b.id, b.project_id, pv.version_number,
            b.evidence_object_id, b.evidence_sha256,
            b.source_filename, b.source_media_type, b.created_at,
            b.extractor_id, b.extractor_version, b.status,
            b.canonical_write_allowed, b.ready_for_submission
       from regulatory.prospectus_import_batches b
       join regulatory.project_versions pv on pv.id = b.project_version_id
      where b.id = $1`,
    [importId],
  );
  if (batchResult.rowCount !== 1) return null;

  const valueResult = await client.query<{
    id: string;
    proposed_canonical_field_path: string;
    extracted_value: unknown;
    confidence: string | number | null;
    source_location: ImportedProspectusValue["sourceLocation"];
    evidence_object_id: string;
    evidence_sha256: string;
    review_status: ImportedProspectusValue["reviewStatus"];
    reviewed_by: string | null;
    reviewed_at: Date | string | null;
  }>(
    `select id, proposed_canonical_field_path, extracted_value, confidence,
            source_location, evidence_object_id, evidence_sha256,
            review_status, reviewed_by, reviewed_at
       from regulatory.prospectus_import_values
      where import_batch_id = $1
      order by created_at, id`,
    [importId],
  );

  const row = batchResult.rows[0];
  const values: ImportedProspectusValue[] = valueResult.rows.map((value) => ({
    importValueId: value.id,
    proposedCanonicalFieldPath: value.proposed_canonical_field_path,
    extractedValue: value.extracted_value,
    confidence: value.confidence === null ? undefined : Number(value.confidence),
    sourceLocation: value.source_location ?? {},
    evidenceObjectId: value.evidence_object_id,
    evidenceSha256: value.evidence_sha256,
    reviewStatus: value.review_status,
    ...(value.reviewed_by ? { reviewedBy: value.reviewed_by } : {}),
    ...(value.reviewed_at ? { reviewedAt: toIso(value.reviewed_at) } : {}),
  }));

  const batch: ProspectusImportBatch = {
    importId: row.id,
    projectId: row.project_id,
    projectVersion: row.version_number,
    evidenceObjectId: row.evidence_object_id,
    evidenceSha256: row.evidence_sha256,
    sourceFilename: row.source_filename,
    sourceMediaType: row.source_media_type,
    createdAt: toIso(row.created_at),
    extractorId: row.extractor_id,
    extractorVersion: row.extractor_version,
    status: row.status,
    values,
    canonicalWriteAllowed: false,
    readyForSubmission: false,
  };
  assertImportRemainsUnverified(batch);
  return batch;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
