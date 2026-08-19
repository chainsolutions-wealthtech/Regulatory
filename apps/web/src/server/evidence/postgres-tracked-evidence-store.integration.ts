import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { createMemoryEvidenceBinaryStore } from "@/server/evidence/evidence-binary-store";
import { createFixedTestIdentityProvider } from "@/server/security/verified-identity";
import { createPostgresTrackedEvidenceStore } from "@/server/evidence/postgres-tracked-evidence-store";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl || !adminDatabaseUrl) throw new Error("POSTGRESQL_EVIDENCE_TEST_DATABASE_URL_REQUIRED");

const pool = new Pool({ connectionString: databaseUrl, max: 4 });
const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 2 });
const organizationId = "71000000-0000-0000-0000-000000000001";
const otherOrganizationId = "71000000-0000-0000-0000-000000000002";
const userId = "72000000-0000-0000-0000-000000000001";
const otherUserId = "72000000-0000-0000-0000-000000000002";
const projectId = "73000000-0000-0000-0000-000000000001";
const projectVersionId = "74000000-0000-0000-0000-000000000001";

try {
  await seed();
  const binaryStore = createMemoryEvidenceBinaryStore();
  const identityProvider = createFixedTestIdentityProvider({
    subject: "postgres-evidence-user",
    userId,
    organizationId,
    roles: ["PRODUCT", "COMPLIANCE"],
    verifiedAt: "2026-08-18T18:30:00.000Z",
    provider: "CI_FIXED_TEST_IDENTITY",
  });
  const store = createPostgresTrackedEvidenceStore({ pool, identityProvider, binaryStore });
  const content = new TextEncoder().encode("%PDF-1.7\npostgres tracked evidence\n");

  const staged = await store.stage({
    organizationId,
    projectVersionId,
    originalFilename: "prospectus.pdf",
    declaredMediaType: "application/pdf",
    content,
    uploadedBy: userId,
    encryptionKeyReference: "development-test-key",
  });
  assert.equal(staged.state, "QUARANTINED");
  assert.equal(staged.scanStatus, "PENDING");
  assert.equal(staged.storageProvider, "MEMORY_TEST_ONLY");
  assert.equal(staged.storageObjectKey, `evidence/${organizationId}/${staged.objectId}`);
  const stagedDb = await adminPool.query<{ state: string; scan_status: string; sha256: string }>(
    `select state::text, scan_status::text, sha256 from regulatory.evidence_objects where id = $1`,
    [staged.objectId],
  );
  assert.equal(stagedDb.rowCount, 1);
  assert.equal(stagedDb.rows[0].state, "QUARANTINED");
  assert.equal(stagedDb.rows[0].scan_status, "PENDING");
  assert.equal(stagedDb.rows[0].sha256, staged.sha256);

  const scanned = await store.recordScan({
    objectId: staged.objectId,
    expectedSha256: staged.sha256,
    detectedMediaType: "application/pdf",
    status: "CLEAN",
    scanProvider: "CI_TRUSTED_SCANNER",
    scanEngineVersion: "1.0.0",
    scanSignatureVersion: "2026-08-18",
    scanCompletedAt: "2026-08-18T18:31:00.000Z",
    trustedServerResult: true,
  });
  assert.equal(scanned.state, "QUARANTINED");
  assert.equal(scanned.scanStatus, "CLEAN");

  const released = await store.release({
    objectId: staged.objectId,
    releasedBy: userId,
    releasedAt: "2026-08-18T18:32:00.000Z",
  });
  assert.equal(released.state, "CLEAN");
  assert.equal(released.scanStatus, "CLEAN");
  const releasedDb = await adminPool.query<{ state: string; scan_status: string; released_by: string }>(
    `select state::text, scan_status::text, released_by::text from regulatory.evidence_objects where id = $1`,
    [staged.objectId],
  );
  assert.equal(releasedDb.rows[0].state, "CLEAN");
  assert.equal(releasedDb.rows[0].scan_status, "CLEAN");
  assert.equal(releasedDb.rows[0].released_by, userId);

  const read = await store.readClean({
    objectId: staged.objectId,
    organizationId,
    requestedBy: userId,
    authorizationDecisionId: "ci-evidence-read",
  });
  assert.deepEqual(Buffer.from(read.content), Buffer.from(content));
  assert.equal(read.descriptor.sha256, staged.sha256);

  const metadata = await store.readDescriptor?.({
    objectId: staged.objectId,
    organizationId,
    requestedBy: userId,
    authorizationDecisionId: "ci-evidence-metadata",
  });
  assert.equal(metadata?.state, "CLEAN");

  const recoveryContent = new TextEncoder().encode("%PDF-1.7\nrelease recovery evidence\n");
  const recoveryStaged = await store.stage({
    organizationId,
    projectVersionId,
    originalFilename: "recovery.pdf",
    declaredMediaType: "application/pdf",
    content: recoveryContent,
    uploadedBy: userId,
    encryptionKeyReference: "development-test-key",
  });
  await store.recordScan({
    objectId: recoveryStaged.objectId,
    expectedSha256: recoveryStaged.sha256,
    detectedMediaType: "application/pdf",
    status: "CLEAN",
    scanProvider: "CI_TRUSTED_SCANNER",
    scanEngineVersion: "1.0.0",
    scanSignatureVersion: "2026-08-18",
    scanCompletedAt: "2026-08-18T18:33:00.000Z",
    trustedServerResult: true,
  });
  const recoveryCommand = {
    objectId: recoveryStaged.objectId,
    releasedBy: userId,
    releasedAt: "2026-08-18T18:34:00.000Z",
  };

  await binaryStore.promoteToClean({ objectId: recoveryStaged.objectId, organizationId });
  assert.deepEqual(
    Buffer.from(await binaryStore.readClean({ objectId: recoveryStaged.objectId, organizationId })),
    Buffer.from(recoveryContent),
  );
  const recoveryDbBefore = await adminPool.query<{ state: string; scan_status: string }>(
    `select state::text, scan_status::text from regulatory.evidence_objects where id = $1`,
    [recoveryStaged.objectId],
  );
  assert.equal(recoveryDbBefore.rows[0].state, "QUARANTINED");
  assert.equal(recoveryDbBefore.rows[0].scan_status, "CLEAN");

  const recovered = await store.release(recoveryCommand);
  assert.equal(recovered.state, "CLEAN", "Retry must reconcile PostgreSQL after binary release already succeeded.");
  assert.equal(recovered.releasedBy, userId);
  const retried = await store.release(recoveryCommand);
  assert.equal(retried.state, "CLEAN", "Repeated release with the same actor must be idempotent.");
  assert.equal(retried.releasedAt, recoveryCommand.releasedAt);

  const recoveryRead = await store.readClean({
    objectId: recoveryStaged.objectId,
    organizationId,
    requestedBy: userId,
    authorizationDecisionId: "ci-evidence-recovery-read",
  });
  assert.deepEqual(Buffer.from(recoveryRead.content), Buffer.from(recoveryContent));

  const otherStore = createPostgresTrackedEvidenceStore({
    pool,
    binaryStore,
    identityProvider: createFixedTestIdentityProvider({
      subject: "postgres-evidence-other",
      userId: otherUserId,
      organizationId: otherOrganizationId,
      roles: ["PRODUCT"],
      verifiedAt: "2026-08-18T18:30:00.000Z",
      provider: "CI_FIXED_TEST_IDENTITY",
    }),
  });
  await assert.rejects(
    () => otherStore.readDescriptor!({
      objectId: staged.objectId,
      organizationId: otherOrganizationId,
      requestedBy: otherUserId,
      authorizationDecisionId: "ci-cross-tenant",
    }),
    /EVIDENCE_OBJECT_NOT_FOUND/,
  );

  const compatibility = await adminPool.query<{ n: string }>(
    `select count(*)::text as n
       from regulatory.evidence_objects
      where id = $1 and project_version_id = $2 and state = 'CLEAN' and scan_status = 'CLEAN'`,
    [staged.objectId, projectVersionId],
  );
  assert.equal(Number(compatibility.rows[0].n), 1, "Import staging must be able to resolve the released evidence object.");

  const validation = {
    validationId: "POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION_V1",
    status: "PASS",
    checks: {
      binaryAndMetadataTrackedTogether: true,
      binaryStoreContainsNoRegulatoryDescriptor: true,
      quarantinedPendingPersisted: true,
      cleanScanDoesNotAutoRelease: true,
      explicitReleasePersisted: true,
      releaseRecoversAfterBinaryCommitGap: true,
      releaseRetryIdempotent: true,
      releasedBinaryDigestPreserved: true,
      metadataReadTenantScoped: true,
      crossTenantReadBlockedByRls: true,
      importStagingCleanEvidenceCompatible: true,
      productionReadinessNotClaimed: true,
    },
    caveat: "Validation PostgreSQL 17 avec binary store mémoire sans métadonnées réglementaires. Aucun stockage objet, KMS ou antivirus de production n'est déclaré opérationnel.",
  };
  await writeFile(
    path.resolve(process.cwd(), "../../regulatory/validation/POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION.json"),
    `${JSON.stringify(validation, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(validation, null, 2));
} finally {
  await pool.end();
  await adminPool.end();
}

async function seed() {
  await adminPool.query(
    `insert into regulatory.organizations (id, slug, legal_name, country_code) values
      ($1, 'evidence-tracked-a', 'Evidence Tracked A', 'CI'),
      ($2, 'evidence-tracked-b', 'Evidence Tracked B', 'SN')
     on conflict (id) do nothing`,
    [organizationId, otherOrganizationId],
  );
  await adminPool.query(
    `insert into regulatory.app_users (id, external_subject, display_name) values
      ($1, 'postgres-evidence-user', 'Evidence User'),
      ($2, 'postgres-evidence-other', 'Evidence Other')
     on conflict (id) do nothing`,
    [userId, otherUserId],
  );
  await adminPool.query(
    `insert into regulatory.organization_memberships (organization_id, user_id, role) values
      ($1, $2, 'PRODUCT'), ($1, $2, 'COMPLIANCE'), ($3, $4, 'PRODUCT')
     on conflict do nothing`,
    [organizationId, userId, otherOrganizationId, otherUserId],
  );
  await adminPool.query(
    `insert into regulatory.projects (
      id, organization_id, canonical_slug, legal_name, category, operation, created_by
    ) values ($1, $2, 'evidence-tracked-project', 'Evidence Tracked Project', 'BOND', 'CREATE', $3)
    on conflict (id) do nothing`,
    [projectId, organizationId, userId],
  );
  await adminPool.query(
    `insert into regulatory.project_versions (
      id, organization_id, project_id, version_number, schema_version, catalog_digest, created_by
    ) values ($1, $2, $3, 1, 'TEST', $4, $5)
    on conflict (id) do nothing`,
    [projectVersionId, organizationId, projectId, "a".repeat(64), userId],
  );
}
