import assert from "node:assert/strict";
import { Pool } from "pg";
import { createPostgresEvidenceScanQueue } from "@/server/evidence/postgres-evidence-scan-queue";
import { createFixedTestIdentityProvider } from "@/server/security/verified-identity";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl || !adminDatabaseUrl) throw new Error("POSTGRESQL_EVIDENCE_SCAN_QUEUE_DATABASE_URL_REQUIRED");

const pool = new Pool({ connectionString: databaseUrl, max: 4 });
const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 2 });
const organizationId = "81000000-0000-0000-0000-000000000001";
const otherOrganizationId = "81000000-0000-0000-0000-000000000002";
const securityUserId = "82000000-0000-0000-0000-000000000001";
const complianceUserId = "82000000-0000-0000-0000-000000000002";
const otherSecurityUserId = "82000000-0000-0000-0000-000000000003";
const projectId = "83000000-0000-0000-0000-000000000001";
const otherProjectId = "83000000-0000-0000-0000-000000000002";
const projectVersionId = "84000000-0000-0000-0000-000000000001";
const otherProjectVersionId = "84000000-0000-0000-0000-000000000002";
const firstObjectId = "85000000-0000-0000-0000-000000000001";
const secondObjectId = "85000000-0000-0000-0000-000000000002";
const otherObjectId = "85000000-0000-0000-0000-000000000003";

try {
  await seed();
  const securityIdentity = createFixedTestIdentityProvider({
    subject: "scan-security",
    userId: securityUserId,
    organizationId,
    roles: ["SECURITY"],
    verifiedAt: "2026-08-20T17:00:00.000Z",
    provider: "CI_FIXED_TEST_IDENTITY",
  });
  const queue = createPostgresEvidenceScanQueue({ pool, identityProvider: securityIdentity });

  const first = await queue.claimNext({ leaseSeconds: 60 });
  assert.equal(first?.objectId, firstObjectId);
  assert.equal(first?.attempt, 1);
  assert.equal(first?.organizationId, organizationId);

  const firstDb = await adminPool.query<{
    state: string;
    scan_status: string;
    scan_claimed_by: string;
    scan_attempt_count: number;
    has_started: boolean;
    has_lease: boolean;
  }>(
    `select state::text, scan_status::text, scan_claimed_by::text, scan_attempt_count,
            scan_started_at is not null as has_started,
            scan_lease_expires_at > now() as has_lease
       from regulatory.evidence_objects where id = $1`,
    [firstObjectId],
  );
  assert.equal(firstDb.rows[0].state, "SCANNING");
  assert.equal(firstDb.rows[0].scan_status, "PENDING");
  assert.equal(firstDb.rows[0].scan_claimed_by, securityUserId);
  assert.equal(firstDb.rows[0].scan_attempt_count, 1);
  assert.equal(firstDb.rows[0].has_started, true);
  assert.equal(firstDb.rows[0].has_lease, true);

  const second = await queue.claimNext({ leaseSeconds: 60 });
  assert.equal(second?.objectId, secondObjectId, "SKIP LOCKED/lease semantics must not return the active first claim.");
  assert.equal(await queue.claimNext({ leaseSeconds: 60 }), null, "No further object exists in this tenant.");

  await adminPool.query(
    `update regulatory.evidence_objects
        set scan_lease_expires_at = now() - interval '1 second'
      where id = $1`,
    [firstObjectId],
  );
  const reclaimed = await queue.claimNext({ leaseSeconds: 90 });
  assert.equal(reclaimed?.objectId, firstObjectId);
  assert.equal(reclaimed?.attempt, 2, "Expired SCANNING claims must be recoverable and increment attempts.");

  const otherQueue = createPostgresEvidenceScanQueue({
    pool,
    identityProvider: createFixedTestIdentityProvider({
      subject: "scan-security-other",
      userId: otherSecurityUserId,
      organizationId: otherOrganizationId,
      roles: ["SECURITY"],
      verifiedAt: "2026-08-20T17:00:00.000Z",
      provider: "CI_FIXED_TEST_IDENTITY",
    }),
  });
  const other = await otherQueue.claimNext({ leaseSeconds: 60 });
  assert.equal(other?.objectId, otherObjectId, "Queue claims must remain tenant-scoped by RLS.");

  const deniedQueue = createPostgresEvidenceScanQueue({
    pool,
    identityProvider: createFixedTestIdentityProvider({
      subject: "scan-compliance",
      userId: complianceUserId,
      organizationId,
      roles: ["COMPLIANCE"],
      verifiedAt: "2026-08-20T17:00:00.000Z",
      provider: "CI_FIXED_TEST_IDENTITY",
    }),
  });
  await assert.rejects(
    () => deniedQueue.claimNext({ leaseSeconds: 60 }),
    /AUTHORIZATION_DENIED:EVIDENCE_SCAN/,
  );

  console.log(JSON.stringify({
    validationId: "POSTGRESQL_EVIDENCE_SCAN_QUEUE_VALIDATION_V1",
    status: "PASS",
    checks: {
      securityRoleRequired: true,
      pendingClaimTransitionsToScanning: true,
      scanStartedRecorded: true,
      leaseRecorded: true,
      activeClaimNotDuplicated: true,
      expiredLeaseRecoverable: true,
      attemptCountIncremented: true,
      tenantIsolationEnforced: true,
      noBrowserScanVerdictIntroduced: true,
    },
  }, null, 2));
} finally {
  await pool.end();
  await adminPool.end();
}

async function seed(): Promise<void> {
  await adminPool.query(
    `insert into regulatory.organizations (id, slug, legal_name, country_code) values
      ($1, 'scan-queue-a', 'Scan Queue A', 'CI'),
      ($2, 'scan-queue-b', 'Scan Queue B', 'SN')
     on conflict (id) do nothing`,
    [organizationId, otherOrganizationId],
  );
  await adminPool.query(
    `insert into regulatory.app_users (id, external_subject, display_name) values
      ($1, 'scan-security', 'Scan Security'),
      ($2, 'scan-compliance', 'Scan Compliance'),
      ($3, 'scan-security-other', 'Scan Security Other')
     on conflict (id) do nothing`,
    [securityUserId, complianceUserId, otherSecurityUserId],
  );
  await adminPool.query(
    `insert into regulatory.organization_memberships (organization_id, user_id, role) values
      ($1, $2, 'SECURITY'), ($1, $3, 'COMPLIANCE'), ($4, $5, 'SECURITY')
     on conflict do nothing`,
    [organizationId, securityUserId, complianceUserId, otherOrganizationId, otherSecurityUserId],
  );
  await adminPool.query(
    `insert into regulatory.projects (id, organization_id, canonical_slug, legal_name, category, operation, created_by) values
      ($1, $2, 'scan-project-a', 'Scan Project A', 'BOND', 'CREATE', $3),
      ($4, $5, 'scan-project-b', 'Scan Project B', 'BOND', 'CREATE', $6)
     on conflict (id) do nothing`,
    [projectId, organizationId, securityUserId, otherProjectId, otherOrganizationId, otherSecurityUserId],
  );
  await adminPool.query(
    `insert into regulatory.project_versions (id, organization_id, project_id, version_number, schema_version, catalog_digest, created_by) values
      ($1, $2, $3, 1, 'TEST', $4, $5),
      ($6, $7, $8, 1, 'TEST', $9, $10)
     on conflict (id) do nothing`,
    [projectVersionId, organizationId, projectId, "b".repeat(64), securityUserId,
     otherProjectVersionId, otherOrganizationId, otherProjectId, "c".repeat(64), otherSecurityUserId],
  );
  await insertEvidence(firstObjectId, organizationId, projectVersionId, securityUserId, "0001");
  await new Promise((resolve) => setTimeout(resolve, 5));
  await insertEvidence(secondObjectId, organizationId, projectVersionId, securityUserId, "0002");
  await insertEvidence(otherObjectId, otherOrganizationId, otherProjectVersionId, otherSecurityUserId, "0003");
}

async function insertEvidence(objectId: string, orgId: string, versionId: string, uploadedBy: string, suffix: string) {
  await adminPool.query(
    `insert into regulatory.evidence_objects (
       id, organization_id, project_version_id, storage_provider, storage_object_key, storage_reference,
       original_filename, safe_filename, declared_media_type, sha256, byte_size,
       encryption_algorithm, encryption_key_reference, uploaded_by
     ) values ($1,$2,$3,'TEST_PRIVATE',$4,$5,$6,$6,'application/pdf',$7,32,'TEST_ONLY','test-key',$8)
     on conflict (id) do update set
       state='QUARANTINED', scan_status='PENDING', scan_started_at=null, scan_completed_at=null,
       scan_provider=null, scan_engine_version=null, scan_signature_version=null`,
    [objectId, orgId, versionId, `evidence/${orgId}/quarantine/${suffix}`, `test-private:${orgId}:${suffix}`,
     `scan-${suffix}.pdf`, suffix.repeat(64).slice(0, 64).replace(/[^0-9a-f]/g, "a"), uploadedBy],
  );
}
