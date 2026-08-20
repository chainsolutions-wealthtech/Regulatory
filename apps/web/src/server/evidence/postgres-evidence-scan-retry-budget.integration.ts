import assert from "node:assert/strict";
import { Pool } from "pg";
import { createPostgresEvidenceScanQueue } from "@/server/evidence/postgres-evidence-scan-queue";
import { createFixedTestIdentityProvider } from "@/server/security/verified-identity";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl || !adminDatabaseUrl) throw new Error("POSTGRESQL_EVIDENCE_SCAN_RETRY_DATABASE_URL_REQUIRED");

const pool = new Pool({ connectionString: databaseUrl, max: 3 });
const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 2 });
const organizationId = "91000000-0000-0000-0000-000000000001";
const securityUserId = "92000000-0000-0000-0000-000000000001";
const projectId = "93000000-0000-0000-0000-000000000001";
const projectVersionId = "94000000-0000-0000-0000-000000000001";
const objectId = "95000000-0000-0000-0000-000000000001";

try {
  await seed();
  const queue = createPostgresEvidenceScanQueue({
    pool,
    identityProvider: createFixedTestIdentityProvider({
      subject: "scan-retry-security",
      userId: securityUserId,
      organizationId,
      roles: ["SECURITY"],
      verifiedAt: "2026-08-20T18:00:00.000Z",
      provider: "CI_FIXED_TEST_IDENTITY",
    }),
  });

  const first = await queue.claimNext({ leaseSeconds: 10, maxAttempts: 2 });
  assert.equal(first?.objectId, objectId);
  assert.equal(first?.attempt, 1);
  await expireLease();

  const second = await queue.claimNext({ leaseSeconds: 10, maxAttempts: 2 });
  assert.equal(second?.objectId, objectId);
  assert.equal(second?.attempt, 2);
  await expireLease();

  const exhausted = await queue.claimNext({ leaseSeconds: 10, maxAttempts: 2 });
  assert.equal(exhausted, null, "An exhausted scan must not be reclaimed forever.");

  const row = await adminPool.query<{
    state: string;
    scan_status: string;
    scan_attempt_count: number;
    scan_claimed_by: string | null;
    scan_lease_expires_at: Date | null;
    scan_completed_at: Date | null;
    scan_details: Record<string, unknown>;
  }>(
    `select state::text, scan_status::text, scan_attempt_count, scan_claimed_by::text,
            scan_lease_expires_at, scan_completed_at, scan_details
       from regulatory.evidence_objects where id = $1`,
    [objectId],
  );
  assert.equal(row.rows[0].state, "REJECTED");
  assert.equal(row.rows[0].scan_status, "ERROR");
  assert.equal(row.rows[0].scan_attempt_count, 2);
  assert.equal(row.rows[0].scan_claimed_by, null);
  assert.equal(row.rows[0].scan_lease_expires_at, null);
  assert(row.rows[0].scan_completed_at);
  assert.equal(row.rows[0].scan_details.worker_error_code, "EVIDENCE_SCAN_RETRY_EXHAUSTED");
  assert.equal(row.rows[0].scan_details.malware_verdict, undefined, "Technical exhaustion must not fabricate a malware verdict.");

  await assert.rejects(
    () => queue.claimNext({ leaseSeconds: 10, maxAttempts: 0 }),
    /EVIDENCE_SCAN_MAX_ATTEMPTS_INVALID/,
  );
  await assert.rejects(
    () => queue.claimNext({ leaseSeconds: 10, maxAttempts: 21 }),
    /EVIDENCE_SCAN_MAX_ATTEMPTS_INVALID/,
  );

  console.log("POSTGRESQL_EVIDENCE_SCAN_RETRY_BUDGET_PASS");
} finally {
  await pool.end();
  await adminPool.end();
}

async function expireLease(): Promise<void> {
  await adminPool.query(
    `update regulatory.evidence_objects
        set scan_lease_expires_at = now() - interval '1 second'
      where id = $1`,
    [objectId],
  );
}

async function seed(): Promise<void> {
  await adminPool.query(
    `insert into regulatory.organizations (id, slug, legal_name, country_code)
     values ($1, 'scan-retry-budget', 'Scan Retry Budget', 'CI')
     on conflict (id) do nothing`,
    [organizationId],
  );
  await adminPool.query(
    `insert into regulatory.app_users (id, external_subject, display_name)
     values ($1, 'scan-retry-security', 'Scan Retry Security')
     on conflict (id) do nothing`,
    [securityUserId],
  );
  await adminPool.query(
    `insert into regulatory.organization_memberships (organization_id, user_id, role)
     values ($1, $2, 'SECURITY') on conflict do nothing`,
    [organizationId, securityUserId],
  );
  await adminPool.query(
    `insert into regulatory.projects (id, organization_id, canonical_slug, legal_name, category, operation, created_by)
     values ($1, $2, 'scan-retry-project', 'Scan Retry Project', 'BOND', 'CREATE', $3)
     on conflict (id) do nothing`,
    [projectId, organizationId, securityUserId],
  );
  await adminPool.query(
    `insert into regulatory.project_versions (id, organization_id, project_id, version_number, schema_version, catalog_digest, created_by)
     values ($1, $2, $3, 1, 'TEST', $4, $5)
     on conflict (id) do nothing`,
    [projectVersionId, organizationId, projectId, "d".repeat(64), securityUserId],
  );
  await adminPool.query(
    `insert into regulatory.evidence_objects (
       id, organization_id, project_version_id, storage_provider, storage_object_key, storage_reference,
       original_filename, safe_filename, declared_media_type, sha256, byte_size,
       encryption_algorithm, encryption_key_reference, uploaded_by
     ) values ($1,$2,$3,'TEST_PRIVATE',$4,$5,'retry.pdf','retry.pdf','application/pdf',$6,32,'TEST_ONLY','test-key',$7)
     on conflict (id) do update set
       state='QUARANTINED', scan_status='PENDING', scan_started_at=null, scan_completed_at=null,
       scan_provider=null, scan_engine_version=null, scan_signature_version=null,
       scan_details='{}'::jsonb, scan_claimed_by=null, scan_lease_expires_at=null, scan_attempt_count=0`,
    [objectId, organizationId, projectVersionId, `evidence/${organizationId}/quarantine/retry-object`,
     `test-private:${organizationId}:retry-object`, "e".repeat(64), securityUserId],
  );
}
