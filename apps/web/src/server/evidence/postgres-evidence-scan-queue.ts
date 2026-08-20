import "server-only";

import type { Pool, PoolClient, QueryResultRow } from "pg";
import { assertAuthorized, type ProspectusRole } from "@/domain/authorization";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

export type EvidenceScanClaim = {
  objectId: string;
  organizationId: string;
  attempt: number;
  leaseExpiresAt: string;
};

export function createPostgresEvidenceScanQueue(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
}) {
  return {
    async claimNext(command: { leaseSeconds: number; maxAttempts?: number }): Promise<EvidenceScanClaim | null> {
      const leaseSeconds = normalizeLeaseSeconds(command.leaseSeconds);
      const maxAttempts = normalizeMaxAttempts(command.maxAttempts ?? 5);
      const identity = assertVerifiedIdentity(await input.identityProvider.getVerifiedIdentity());
      assertAuthorized(
        {
          userId: identity.userId,
          organizationId: identity.organizationId,
          roles: identity.roles as ProspectusRole[],
        },
        "EVIDENCE_SCAN",
        { organizationId: identity.organizationId },
      );

      return withTenant(input.pool, identity, async (client) => {
        // A worker crash may leave an item SCANNING until its lease expires.
        // Once the bounded retry budget is exhausted, terminalize it as a
        // technical processing error. This is deliberately not a malware
        // verdict and cannot make the evidence releasable.
        await client.query(
          `update regulatory.evidence_objects
              set state = 'REJECTED',
                  scan_status = 'ERROR',
                  scan_completed_at = now(),
                  scan_details = coalesce(scan_details, '{}'::jsonb)
                    || jsonb_build_object('worker_error_code', 'EVIDENCE_SCAN_RETRY_EXHAUSTED')
            where scan_status = 'PENDING'
              and state = 'SCANNING'
              and scan_lease_expires_at < now()
              and scan_attempt_count >= $1`,
          [maxAttempts],
        );

        const result = await client.query<ClaimRow>(
          `with candidate as (
             select id
               from regulatory.evidence_objects
              where scan_status = 'PENDING'
                and scan_attempt_count < $3
                and (
                  state = 'QUARANTINED'
                  or (state = 'SCANNING' and scan_lease_expires_at < now())
                )
              order by created_at asc, id asc
              for update skip locked
              limit 1
           )
           update regulatory.evidence_objects object
              set state = 'SCANNING',
                  scan_started_at = now(),
                  scan_claimed_by = $1,
                  scan_lease_expires_at = now() + make_interval(secs => $2),
                  scan_attempt_count = object.scan_attempt_count + 1
             from candidate
            where object.id = candidate.id
           returning object.id,
                     object.organization_id,
                     object.scan_attempt_count,
                     object.scan_lease_expires_at`,
          [identity.userId, leaseSeconds, maxAttempts],
        );
        if (result.rowCount === 0) return null;
        const row = result.rows[0];
        return {
          objectId: row.id,
          organizationId: row.organization_id,
          attempt: Number(row.scan_attempt_count),
          leaseExpiresAt: iso(row.scan_lease_expires_at),
        };
      });
    },
  };
}

type ClaimRow = QueryResultRow & {
  id: string;
  organization_id: string;
  scan_attempt_count: number;
  scan_lease_expires_at: Date | string;
};

function normalizeLeaseSeconds(value: number): number {
  if (!Number.isInteger(value) || value < 10 || value > 3600) {
    throw new Error("EVIDENCE_SCAN_LEASE_SECONDS_INVALID");
  }
  return value;
}

function normalizeMaxAttempts(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 20) {
    throw new Error("EVIDENCE_SCAN_MAX_ATTEMPTS_INVALID");
  }
  return value;
}

async function withTenant<T>(
  pool: Pool,
  identity: VerifiedIdentityContext,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.current_organization_id', $1, true)", [identity.organizationId]);
    const membership = await client.query(
      `select 1
         from regulatory.organization_memberships
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
