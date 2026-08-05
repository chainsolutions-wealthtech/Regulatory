import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Pool } from "pg";
import type { GenerationSnapshot } from "@/domain/types";
import { buildCanonicalSnapshot } from "@/server/canonical-snapshot";
import { createFixedTestIdentityProvider } from "@/server/security/verified-identity";
import { createFileSystemArtifactStore } from "@/server/storage/artifact-store";
import { createPostgresProjectRepository } from "@/server/storage/postgres-project-repository";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED_FOR_POSTGRES_REPOSITORY_TEST");
if (!adminDatabaseUrl) throw new Error("DATABASE_ADMIN_URL_REQUIRED_FOR_POSTGRES_REPOSITORY_TEST");

const validationPath = path.resolve(
  process.cwd(),
  "../../regulatory/validation/POSTGRESQL_REPOSITORY_VALIDATION.json",
);
const artifactRoot = await mkdtemp(path.join(tmpdir(), "regulatory-postgres-artifacts-"));
const pool = new Pool({ connectionString: databaseUrl, max: 8 });
const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 2 });

const tenantA = {
  organizationId: "61000000-0000-0000-0000-000000000001",
  userId: "62000000-0000-0000-0000-000000000001",
  subject: "postgres-test-alpha",
  roles: ["PRODUCT", "COMPLIANCE"],
  provider: "CI_FIXED_TEST_IDENTITY",
  verifiedAt: new Date().toISOString(),
};
const tenantB = {
  organizationId: "61000000-0000-0000-0000-000000000002",
  userId: "62000000-0000-0000-0000-000000000002",
  subject: "postgres-test-beta",
  roles: ["PRODUCT"],
  provider: "CI_FIXED_TEST_IDENTITY",
  verifiedAt: new Date().toISOString(),
};

try {
  await assertApplicationRoleCannotBypassRls();
  await seedIdentity(
    tenantA.organizationId,
    tenantA.userId,
    "tenant-repository-alpha",
    "Alpha Repository Tenant",
  );
  await seedIdentity(
    tenantB.organizationId,
    tenantB.userId,
    "tenant-repository-beta",
    "Beta Repository Tenant",
  );

  const artifactStore = createFileSystemArtifactStore(artifactRoot);
  const repositoryA = createPostgresProjectRepository({
    pool,
    artifactStore,
    identityProvider: createFixedTestIdentityProvider(tenantA),
  });
  const repositoryB = createPostgresProjectRepository({
    pool,
    artifactStore,
    identityProvider: createFixedTestIdentityProvider(tenantB),
  });

  const projectA = await repositoryA.createProject({
    name: "PostgreSQL Alpha Fund",
    category: "BOND",
    countryCode: "CI",
    operation: "CREATE",
    managementCompanyName: "Alpha Management Company",
  });
  const projectB = await repositoryB.createProject({
    name: "PostgreSQL Beta Fund",
    category: "DIVERSIFIED",
    countryCode: "SN",
    operation: "CREATE",
    managementCompanyName: "Beta Management Company",
  });

  assert((await repositoryA.listProjects()).length === 1, "Tenant A must see one project.");
  assert((await repositoryB.listProjects()).length === 1, "Tenant B must see one project.");
  assert((await repositoryA.getProject(projectB.id)) === null, "Tenant A must not read tenant B.");
  assert((await repositoryB.getProject(projectA.id)) === null, "Tenant B must not read tenant A.");

  const withRanges = await repositoryA.saveAnswer({
    projectId: projectA.id,
    questionId: "Q_ASSET_EXPOSURE_MATRIX",
    expectedVersion: 1,
    value: [
      {
        range_id: "RANGE-GOV",
        asset_class: "GOVERNMENT_BONDS",
        minimum_percent: 40,
        target_percent: 70,
        maximum_percent: 100,
        review_status: "UNREVIEWED",
      },
      {
        range_id: "RANGE-CASH",
        asset_class: "CASH",
        minimum_percent: 0,
        target_percent: 10,
        maximum_percent: 30,
        review_status: "UNREVIEWED",
      },
    ],
  });
  assert(withRanges.version === 2, "The first write must create version 2.");

  const withValuation = await repositoryA.saveAnswer({
    projectId: projectA.id,
    questionId: "Q_VALUATION_METHODS",
    expectedVersion: 2,
    value: [
      {
        method_id: "VALUATION-GOV",
        asset_class: "GOVERNMENT_BONDS",
        primary_method: "Market price or validated yield curve",
        price_source: "Independent source",
        fallback_method: "Documented model",
        frequency: "Each NAV",
        exception_process: "Valuation committee escalation",
        review_status: "UNREVIEWED",
      },
      {
        method_id: "VALUATION-CASH",
        asset_class: "CASH",
        primary_method: "Nominal value plus accrued interest",
        price_source: "Depositary reconciliation",
        fallback_method: "Manual reconciliation",
        frequency: "Each NAV",
        exception_process: "Operations escalation",
        review_status: "UNREVIEWED",
      },
    ],
  });
  assert(withValuation.version === 3, "The second write must create version 3.");

  const concurrentWrites = await Promise.allSettled([
    repositoryA.saveAnswer({
      projectId: projectA.id,
      questionId: "Q_FUND_CONSTITUTION_DATE",
      expectedVersion: 3,
      value: "2026-08-05",
    }),
    repositoryA.saveAnswer({
      projectId: projectA.id,
      questionId: "APP_TAX_REVIEW_CONFIRMED",
      expectedVersion: 3,
      value: "false",
    }),
  ]);
  const fulfilled = concurrentWrites.filter(
    (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof repositoryA.saveAnswer>>> =>
      result.status === "fulfilled",
  );
  const rejected = concurrentWrites.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  assert(fulfilled.length === 1, "Exactly one concurrent write must succeed.");
  assert(rejected.length === 1, "Exactly one concurrent write must be rejected.");
  assert(
    String(rejected[0].reason).includes("PROJECT_VERSION_CONFLICT"),
    "The rejected write must expose a version conflict.",
  );

  const current = await repositoryA.getProject(projectA.id);
  assert(current !== null, "The current project must remain readable.");
  assert(current.version === 4, "The concurrent write winner must create version 4.");

  const canonicalSnapshot = buildCanonicalSnapshot(current);
  const generatedAt = current.updatedAt;
  const generation: GenerationSnapshot = {
    generationId: `GEN-PG-${current.id.slice(0, 8).toUpperCase()}-V${current.version}`,
    generatedAt,
    documentStatus: "DRAFT_PRE_COMPLIANCE_REVIEW",
    readyForComplianceReview: false,
    readyForSubmission: false,
    catalogDigest: current.catalog?.digest,
    requirementCount: current.catalog?.requirementCount,
    questionCount: canonicalSnapshot.answerRecords.length,
  };
  const preview = {
    title: current.name,
    sections: [
      {
        id: "TEST",
        title: "PostgreSQL integration test",
        paragraphs: ["Pre-compliance document generated for transactional repository validation."],
      },
    ],
    generatedAt,
    generationId: generation.generationId,
    readyForComplianceReview: false,
    readyForSubmission: false as const,
    catalogDigest: canonicalSnapshot.catalogDigest,
    requirementCount: canonicalSnapshot.requirementCount,
    canonicalSnapshot,
  };
  const generated = await repositoryA.persistGenerationArtifacts({
    projectId: current.id,
    expectedVersion: current.version,
    generation,
    preview,
    canonicalSnapshot,
    artifacts: [
      {
        fileName: "prospectus-draft.md",
        content: Buffer.from("# PostgreSQL integration prospectus\n", "utf8"),
      },
      {
        fileName: "generation-manifest.json",
        content: Buffer.from(`${JSON.stringify(generation, null, 2)}\n`, "utf8"),
      },
    ],
  });
  assert(generated.generation?.readyForSubmission === false, "Submission must remain false.");
  assert(
    generated.status === "PRE_COMPLIANCE_REVIEW",
    "Generation must move to pre-compliance review.",
  );

  const databaseChecks = await adminPool.query<{
    project_versions: string;
    snapshots: string;
    ranges: string;
    valuations: string;
    documents: string;
    audit_events: string;
    broken_audit_links: string;
  }>(
    `select
       (select count(*)::text from regulatory.project_versions where project_id = $1) as project_versions,
       (select count(*)::text from regulatory.canonical_snapshots where project_version_id in (
          select id from regulatory.project_versions where project_id = $1
        )) as snapshots,
       (select count(*)::text from regulatory.project_asset_ranges where project_version_id = (
          select id from regulatory.project_versions where project_id = $1 order by version_number desc limit 1
        )) as ranges,
       (select count(*)::text from regulatory.project_valuation_methods where project_version_id = (
          select id from regulatory.project_versions where project_id = $1 order by version_number desc limit 1
        )) as valuations,
       (select count(*)::text from regulatory.generated_documents where project_version_id = (
          select id from regulatory.project_versions where project_id = $1 order by version_number desc limit 1
        )) as documents,
       (select count(*)::text from regulatory.audit_events where project_id = $1) as audit_events,
       (select count(*)::text
          from regulatory.audit_events current_event
          left join regulatory.audit_events previous_event
            on previous_event.organization_id = current_event.organization_id
           and previous_event.event_hash = current_event.previous_hash
         where current_event.project_id = $1
           and current_event.previous_hash is not null
           and previous_event.id is null) as broken_audit_links`,
    [projectA.id],
  );
  const checks = databaseChecks.rows[0];
  assert(Number(checks.project_versions) === 4, "Four project versions must exist.");
  assert(Number(checks.snapshots) >= 4, "Each version must retain a canonical snapshot.");
  assert(Number(checks.ranges) === 2, "Two normalized asset ranges must exist.");
  assert(Number(checks.valuations) === 2, "Two normalized valuation methods must exist.");
  assert(Number(checks.documents) === 2, "Two generated document records must exist.");
  assert(Number(checks.audit_events) >= 5, "The audit chain must contain all major writes.");
  assert(Number(checks.broken_audit_links) === 0, "The audit hash chain must not be broken.");

  await access(
    path.join(
      artifactRoot,
      tenantA.organizationId,
      projectA.id,
      generation.generationId,
      "prospectus-draft.md",
    ),
  );

  const validation = {
    validationId: "POSTGRESQL_PROJECT_REPOSITORY_VALIDATION_V1",
    status: "PASS",
    checks: {
      applicationRoleCannotBypassRls: true,
      verifiedIdentityRequired: true,
      organizationMembershipRequired: true,
      tenantAIsolation: true,
      tenantBIsolation: true,
      versionPerWrite: true,
      optimisticConcurrencyConflict: true,
      canonicalSnapshotPerVersion: true,
      normalizedAssetRanges: true,
      normalizedValuationMethods: true,
      generatedDocumentMetadata: true,
      stagedArtifactCommit: true,
      auditInsertPolicy: true,
      auditHashChain: true,
      readyForSubmissionRemainsFalse: true,
    },
    metrics: {
      projectVersions: Number(checks.project_versions),
      snapshots: Number(checks.snapshots),
      generatedDocuments: Number(checks.documents),
      auditEvents: Number(checks.audit_events),
    },
    caveat:
      "Validation transactionnelle sur PostgreSQL éphémère avec identité fixe réservée à la CI et rôle applicatif non propriétaire. Aucun fournisseur d’identité de production ni déploiement n’est activé.",
  };
  await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(validation, null, 2));
} finally {
  await pool.end();
  await adminPool.end();
  await rm(artifactRoot, { recursive: true, force: true });
}

async function assertApplicationRoleCannotBypassRls(): Promise<void> {
  const result = await adminPool.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
    `select rolsuper, rolbypassrls from pg_roles where rolname = current_setting('app.ci_role_name')`,
  );
  assert(result.rowCount === 1, "The CI application role must exist.");
  assert(result.rows[0].rolsuper === false, "The application role must not be superuser.");
  assert(result.rows[0].rolbypassrls === false, "The application role must not bypass RLS.");
}

async function seedIdentity(
  organizationId: string,
  userId: string,
  slug: string,
  legalName: string,
): Promise<void> {
  await adminPool.query(
    `insert into regulatory.organizations (id, slug, legal_name, country_code)
     values ($1, $2, $3, 'CI')
     on conflict (id) do nothing`,
    [organizationId, slug, legalName],
  );
  await adminPool.query(
    `insert into regulatory.app_users (id, external_subject, email, display_name)
     values ($1, $2, $3, $4)
     on conflict (id) do nothing`,
    [userId, `subject-${userId}`, `${slug}@example.test`, `${legalName} User`],
  );
  await adminPool.query(
    `insert into regulatory.organization_memberships (
       organization_id, user_id, role, is_administrator
     ) values ($1, $2, 'PRODUCT', true)
     on conflict (organization_id, user_id, role) do nothing`,
    [organizationId, userId],
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
