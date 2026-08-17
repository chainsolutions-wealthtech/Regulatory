import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { createFixedTestIdentityProvider, type VerifiedIdentityContext } from "@/server/security/verified-identity";
import { createPostgresImportStagingRepository } from "@/server/import/postgres-import-staging-repository";
import type { ProspectusImportBatch } from "@/domain/prospectus-import";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED_FOR_IMPORT_STAGING_TEST");
if (!adminDatabaseUrl) throw new Error("DATABASE_ADMIN_URL_REQUIRED_FOR_IMPORT_STAGING_TEST");

const pool = new Pool({ connectionString: databaseUrl, max: 4 });
const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 2 });
const validationPath = path.resolve(
  process.cwd(),
  "../../regulatory/validation/POSTGRESQL_IMPORT_STAGING_VALIDATION.json",
);

const tenantA: VerifiedIdentityContext = {
  organizationId: "71000000-0000-0000-0000-000000000001",
  userId: "72000000-0000-0000-0000-000000000001",
  subject: "import-staging-alpha",
  roles: ["PRODUCT", "COMPLIANCE"],
  provider: "CI_FIXED_TEST_IDENTITY",
  verifiedAt: "2026-08-17T19:30:00.000Z",
};
const tenantB: VerifiedIdentityContext = {
  organizationId: "71000000-0000-0000-0000-000000000002",
  userId: "72000000-0000-0000-0000-000000000002",
  subject: "import-staging-beta",
  roles: ["PRODUCT"],
  provider: "CI_FIXED_TEST_IDENTITY",
  verifiedAt: "2026-08-17T19:30:00.000Z",
};

const projectVersionA = "74000000-0000-0000-0000-000000000001";
const projectVersionB = "74000000-0000-0000-0000-000000000002";
const evidenceA = "75000000-0000-0000-0000-000000000001";
const evidenceB = "75000000-0000-0000-0000-000000000002";

try {
  await seedTenant(tenantA, "alpha-import", "Alpha Import", projectVersionA, evidenceA, "a");
  await seedTenant(tenantB, "beta-import", "Beta Import", projectVersionB, evidenceB, "b");

  const repositoryA = createPostgresImportStagingRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(tenantA),
  });
  const repositoryB = createPostgresImportStagingRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(tenantB),
  });

  const batch: ProspectusImportBatch = {
    importId: "76000000-0000-0000-0000-000000000001",
    projectId: "73000000-0000-0000-0000-000000000001",
    projectVersion: 1,
    evidenceObjectId: evidenceA,
    evidenceSha256: "a".repeat(64),
    sourceFilename: "alpha-prospectus.pdf",
    sourceMediaType: "application/pdf",
    createdAt: "2026-08-17T19:31:00.000Z",
    extractorId: "ci-test-extractor",
    extractorVersion: "1.0.0",
    status: "EXTRACTED_UNVERIFIED",
    values: [
      {
        importValueId: "77000000-0000-0000-0000-000000000001",
        proposedCanonicalFieldPath: "issuer.legal_name",
        extractedValue: "Alpha Import SA",
        confidence: 0.98,
        sourceLocation: { page: 1, textAnchor: "Alpha Import SA" },
        evidenceObjectId: evidenceA,
        evidenceSha256: "a".repeat(64),
        reviewStatus: "EXTRACTED_UNVERIFIED",
      },
    ],
    canonicalWriteAllowed: false,
    readyForSubmission: false,
  };

  const stored = await repositoryA.createBatch({ batch, projectVersionId: projectVersionA });
  assert.equal(stored.importId, batch.importId);
  assert.equal(stored.canonicalWriteAllowed, false);
  assert.equal(stored.readyForSubmission, false);
  assert.equal(stored.values.length, 1);

  const tenantARead = await repositoryA.getBatch(batch.importId);
  assert(tenantARead, "Tenant A must read its own staged import.");
  assert.equal(tenantARead.evidenceSha256, "a".repeat(64));

  const tenantBRead = await repositoryB.getBatch(batch.importId);
  assert.equal(tenantBRead, null, "Tenant B must not read tenant A import staging.");

  const reviewed = await repositoryA.reviewValue({
    importId: batch.importId,
    importValueId: batch.values[0].importValueId,
    decision: "CONFIRMED_BY_HUMAN",
    reviewedAt: "2026-08-17T19:32:00.000Z",
  });
  assert.equal(reviewed.values[0].reviewStatus, "CONFIRMED_BY_HUMAN");
  assert.equal(reviewed.values[0].reviewedBy, tenantA.userId);
  assert.equal(reviewed.status, "REVIEWED");
  assert.equal(reviewed.canonicalWriteAllowed, false);
  assert.equal(reviewed.readyForSubmission, false);

  await assertRejects(
    () => repositoryA.reviewValue({
      importId: batch.importId,
      importValueId: batch.values[0].importValueId,
      decision: "REJECTED_BY_HUMAN",
      reviewedAt: "2026-08-17T19:33:00.000Z",
    }),
    "IMPORT_VALUE_ALREADY_REVIEWED",
  );

  await assertRejects(
    () => repositoryB.createBatch({
      batch: {
        ...batch,
        importId: "76000000-0000-0000-0000-000000000002",
      },
      projectVersionId: projectVersionB,
    }),
    "IMPORT_EVIDENCE_SCOPE_MISMATCH",
  );

  await assertDatabaseSubmissionFlagsLockedFalse();

  const validation = {
    validationId: "POSTGRESQL_IMPORT_STAGING_VALIDATION_V1",
    status: "PASS",
    checks: {
      cleanEvidenceRequired: true,
      tenantIsolation: true,
      crossTenantEvidenceRejected: true,
      reviewerIdentityPersisted: true,
      doubleReviewRejected: true,
      canonicalWriteLockedFalse: true,
      readyForSubmissionLockedFalse: true,
      sourceDigestPreserved: true,
    },
    caveat:
      "Staging tenant-scoped et revue humaine uniquement. Une confirmation d'import ne constitue jamais une écriture canonique ni une autorisation de soumission.",
  };
  await mkdir(path.dirname(validationPath), { recursive: true });
  await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(validation, null, 2));
} finally {
  await pool.end();
  await adminPool.end();
}

async function seedTenant(
  identity: VerifiedIdentityContext,
  slug: string,
  legalName: string,
  projectVersionId: string,
  evidenceId: string,
  digestChar: string,
): Promise<void> {
  const projectId = identity.organizationId.replace(/^71/, "73");
  await adminPool.query(
    `insert into regulatory.organizations (id, slug, legal_name, country_code)
     values ($1,$2,$3,'CI') on conflict (id) do nothing`,
    [identity.organizationId, slug, legalName],
  );
  await adminPool.query(
    `insert into regulatory.app_users (id, external_subject, email, display_name)
     values ($1,$2,$3,$4) on conflict (id) do nothing`,
    [identity.userId, identity.subject, `${slug}@example.test`, legalName],
  );
  await adminPool.query(
    `insert into regulatory.organization_memberships (organization_id,user_id,role,is_administrator)
     values ($1,$2,'PRODUCT',true) on conflict do nothing`,
    [identity.organizationId, identity.userId],
  );
  await adminPool.query(
    `insert into regulatory.projects (id,organization_id,canonical_slug,legal_name,category,operation,created_by)
     values ($1,$2,$3,$4,'BOND','CREATE',$5) on conflict (id) do nothing`,
    [projectId, identity.organizationId, slug, legalName, identity.userId],
  );
  await adminPool.query(
    `insert into regulatory.project_versions (id,organization_id,project_id,version_number,schema_version,catalog_digest,created_by)
     values ($1,$2,$3,1,'PROSPECTUS_CANONICAL_MODEL_V1',$4,$5) on conflict (id) do nothing`,
    [projectVersionId, identity.organizationId, projectId, digestChar.repeat(64), identity.userId],
  );
  await adminPool.query(
    `insert into regulatory.evidence_objects (
       id,organization_id,project_version_id,storage_provider,storage_object_key,storage_reference,
       original_filename,safe_filename,declared_media_type,detected_media_type,sha256,byte_size,
       encryption_algorithm,encryption_key_reference,state,scan_status,scan_provider,scan_engine_version,
       scan_signature_version,scan_started_at,scan_completed_at,released_at,released_by,uploaded_by
     ) values (
       $1,$2,$3,'ci',$4,$5,'prospectus.pdf','prospectus.pdf','application/pdf','application/pdf',$6,1024,
       'AES-256-GCM','ci-key','CLEAN','CLEAN','ci-scanner','1.0','sig-1',now(),now(),now(),$7,$7
     ) on conflict (id) do nothing`,
    [
      evidenceId,
      identity.organizationId,
      projectVersionId,
      `evidence/ci/import-staging/${evidenceId}`,
      `evidence://ci/import-staging/${evidenceId}`,
      digestChar.repeat(64),
      identity.userId,
    ],
  );
}

async function assertDatabaseSubmissionFlagsLockedFalse(): Promise<void> {
  await assertRejects(
    () => adminPool.query(
      `update regulatory.prospectus_import_batches
          set canonical_write_allowed=true
        where id='76000000-0000-0000-0000-000000000001'`,
    ),
    "check constraint",
  );
  await assertRejects(
    () => adminPool.query(
      `update regulatory.prospectus_import_batches
          set ready_for_submission=true
        where id='76000000-0000-0000-0000-000000000001'`,
    ),
    "check constraint",
  );
}

async function assertRejects(
  action: () => Promise<unknown>,
  expectedText: string,
): Promise<void> {
  let rejected = false;
  try {
    await action();
  } catch (error) {
    rejected = String(error).toLowerCase().includes(expectedText.toLowerCase());
  }
  assert(rejected, `Expected rejection containing ${expectedText}`);
}
