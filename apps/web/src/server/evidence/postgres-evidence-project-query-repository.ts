import "server-only";

import type { Pool, PoolClient, QueryResultRow } from "pg";
import { assertAuthorized, type ProspectusRole } from "@/domain/authorization";
import type { EvidenceObjectState, EvidenceScanStatus } from "@/server/evidence/evidence-object-store";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

export type ProjectEvidenceSummary = {
  objectId: string;
  projectVersion: number;
  originalFilename: string;
  safeFilename: string;
  declaredMediaType?: string;
  detectedMediaType?: string;
  sha256: string;
  byteSize: number;
  state: EvidenceObjectState;
  scanStatus: EvidenceScanStatus;
  scanProvider?: string;
  scanEngineVersion?: string;
  scanSignatureVersion?: string;
  scanCompletedAt?: string;
  uploadedBy: string;
  releasedBy?: string;
  releasedAt?: string;
  retentionUntil: string;
  legalHold: boolean;
  createdAt: string;
};

export interface EvidenceProjectQueryRepository {
  listProjectEvidence(projectId: string): Promise<ProjectEvidenceSummary[]>;
}

export function createPostgresEvidenceProjectQueryRepository(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
}): EvidenceProjectQueryRepository {
  return {
    async listProjectEvidence(projectId) {
      if (!projectId.trim()) throw new Error("EVIDENCE_PROJECT_ID_REQUIRED");
      const identity = assertVerifiedIdentity(await input.identityProvider.getVerifiedIdentity());
      assertAuthorized(
        {
          userId: identity.userId,
          organizationId: identity.organizationId,
          roles: identity.roles as ProspectusRole[],
        },
        "EVIDENCE_READ",
        { organizationId: identity.organizationId },
      );
      return withTenantRead(input.pool, identity, async (client) => {
        const project = await client.query(`select 1 from regulatory.projects where id = $1 and archived_at is null`, [projectId]);
        if (project.rowCount !== 1) throw new Error("PROJECT_NOT_FOUND");
        const result = await client.query<EvidenceSummaryRow>(
          `select e.id, pv.version_number, e.original_filename, e.safe_filename,
                  e.declared_media_type, e.detected_media_type, e.sha256, e.byte_size,
                  e.state::text, e.scan_status::text, e.scan_provider,
                  e.scan_engine_version, e.scan_signature_version, e.scan_completed_at,
                  e.uploaded_by, e.released_by, e.released_at, e.retention_until,
                  e.legal_hold, e.created_at
             from regulatory.evidence_objects e
             join regulatory.project_versions pv on pv.id = e.project_version_id
            where pv.project_id = $1 and e.state <> 'DELETED'
            order by e.created_at desc, e.id`,
          [projectId],
        );
        return result.rows.map(mapRow);
      });
    },
  };
}

type EvidenceSummaryRow = QueryResultRow & {
  id: string;
  version_number: number;
  original_filename: string;
  safe_filename: string;
  declared_media_type: string | null;
  detected_media_type: string | null;
  sha256: string;
  byte_size: string | number;
  state: EvidenceObjectState;
  scan_status: EvidenceScanStatus;
  scan_provider: string | null;
  scan_engine_version: string | null;
  scan_signature_version: string | null;
  scan_completed_at: Date | string | null;
  uploaded_by: string;
  released_by: string | null;
  released_at: Date | string | null;
  retention_until: Date | string;
  legal_hold: boolean;
  created_at: Date | string;
};

function mapRow(row: EvidenceSummaryRow): ProjectEvidenceSummary {
  return {
    objectId: row.id,
    projectVersion: Number(row.version_number),
    originalFilename: row.original_filename,
    safeFilename: row.safe_filename,
    ...(row.declared_media_type ? { declaredMediaType: row.declared_media_type } : {}),
    ...(row.detected_media_type ? { detectedMediaType: row.detected_media_type } : {}),
    sha256: row.sha256,
    byteSize: Number(row.byte_size),
    state: row.state,
    scanStatus: row.scan_status,
    ...(row.scan_provider ? { scanProvider: row.scan_provider } : {}),
    ...(row.scan_engine_version ? { scanEngineVersion: row.scan_engine_version } : {}),
    ...(row.scan_signature_version ? { scanSignatureVersion: row.scan_signature_version } : {}),
    ...(row.scan_completed_at ? { scanCompletedAt: iso(row.scan_completed_at) } : {}),
    uploadedBy: row.uploaded_by,
    ...(row.released_by ? { releasedBy: row.released_by } : {}),
    ...(row.released_at ? { releasedAt: iso(row.released_at) } : {}),
    retentionUntil: iso(row.retention_until),
    legalHold: row.legal_hold,
    createdAt: iso(row.created_at),
  };
}

async function withTenantRead<T>(
  pool: Pool,
  identity: VerifiedIdentityContext,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin read only");
    await client.query("select set_config('app.current_organization_id', $1, true)", [identity.organizationId]);
    const membership = await client.query(
      `select 1 from regulatory.organization_memberships
        where organization_id = $1 and user_id = $2 and revoked_at is null
        limit 1`,
      [identity.organizationId, identity.userId],
    );
    if (membership.rowCount !== 1) throw new Error("ORGANIZATION_MEMBERSHIP_REQUIRED");
    const value = await operation(client);
    await client.query("commit");
    return value;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
