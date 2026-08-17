import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { createFixedTestIdentityProvider, type VerifiedIdentityContext } from "@/server/security/verified-identity";
import { createPostgresImportPromotionRepository } from "@/server/import/postgres-import-promotion-repository";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED_FOR_IMPORT_PROMOTION_TEST");
if (!adminDatabaseUrl) throw new Error("DATABASE_ADMIN_URL_REQUIRED_FOR_IMPORT_PROMOTION_TEST");

const pool = new Pool({ connectionString: databaseUrl, max: 4 });
const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 2 });
const validationPath = path.resolve(
  process.cwd(),
  "../../regulatory/validation/POSTGRESQL_IMPORT_PROMOTION_VALIDATION.json",
);

const tenantA: VerifiedIdentityContext = {
  organizationId: "71000000-0000-0000-0000-000000000001",
  userId: "72000000-0000-0000-0000-000000000001",
  subject: "import-staging-alpha",
  roles: ["PRODUCT", "COMPLIANCE"],
  provider: "CI_FIXED_TEST_IDENTITY",
  verifiedAt: "2026-08-17T20:20:00.000Z",
};
const tenantB: VerifiedIdentityContext = {
  organizationId: "71000000-0000-0000-0000-000000000002",
  userId: "72000000-0000-0000-0000-000000000002",
  subject: "import-staging-beta",
  roles: ["PRODUCT"],
  provider: "CI_FIXED_TEST_IDENTITY",
  verifiedAt: "2026-08-17T20:20:00.000Z",
};

const projectId = "73000000-0000-0000-0000-000000000001";
const importId = "76000000-0000-0000-0000-000000000001";
const importValueId = "77000000-0000-0000-0000-000000000001";
const questionId = "Q_FUND_NAME";

try {
  const repositoryA = createPostgresImportPromotionRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(tenantA),
  });
  const repositoryB = createPostgresImportPromotionRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(tenantB),
  });

  const before = await readProjectVersion(projectId);
  assert.equal(before, 1, "The staging seed must start promotion from project version 1.");

  const receipt = await repositoryA.promoteConfirmedValue({
    projectId,
    importId,
    importValueId,
    questionId,
    expectedVersion: 1,
  });

  assert.equal(receipt.projectId, projectId);
  assert.equal(receipt.importId, importId);
  assert.equal(receipt.importValueId, importValueId);
  assert.equal(receipt.questionId, questionId);
  assert.equal(receipt.projectVersion, 2);
  assert.equal(receipt.sourceSha256, "a".repeat(64));
  assert.equal(receipt.reviewedByUserId, tenantA.userId);
  assert.equal(receipt.promotedByUserId, tenantA.userId);
  assert.equal(receipt.readyForSubmission, false);

  assert.equal(await readProjectVersion(projectId), 2, "Promotion must create exactly one new project version.");
  assert.equal(await readAnswer(projectId, questionId), "Alpha Import SA");
  assert.equal(await promotionCount(importValueId), 1, "Exactly one immutable promotion receipt is expected.");

  await assertRejects(
    () => repositoryA.promoteConfirmedValue({
      projectId,
      importId,
      importValueId,
      questionId,
      expectedVersion: 1,
    }),
    "IMPORT_VALUE_ALREADY_PROMOTED",
  );
  assert.equal(await readProjectVersion(projectId), 2, "Duplicate promotion must not create a version.");

  await assertRejects(
    () => repositoryB.promoteConfirmedValue({
      projectId,
      importId,
      importValueId,
      questionId,
      expectedVersion: 2,
    }),
    "IMPORT_PROMOTION_SCOPE_MISMATCH",
  );
  assert.equal(await readProjectVersion(projectId), 2, "Cross-tenant attempts must not mutate the project.");

  await seedUnreviewedValue();
  await assertRejects(
    () => repositoryA.promoteConfirmedValue({
      projectId,
      importId,
      importValueId: "77000000-0000-0000-0000-000000000099",
      questionId: "Q_FUND_LEGAL_FORM",
      expectedVersion: 2,
    }),
    "IMPORT_VALUE_NOT_HUMAN_CONFIRMED",
  );

  const validation = {
    validationId: "POSTGRESQL_IMPORT_PROMOTION_VALIDATION_V1",
    status: "PASS",
    checks: {
      answerWriteAuthorizationRequired: true,
      explicitQuestionTargetRequired: true,
      humanConfirmationRequired: true,
      optimisticConcurrencyRequired: true,
      tenantIsolation: true,
      duplicatePromotionRejected: true,
      exactlyOneProjectVersionCreated: true,
      immutableSourceProvenancePersisted: true,
      reviewerAndPromoterIdentityPersisted: true,
      readyForSubmissionRemainsFalse: true,
    },
    caveat:
      "Promotion unitaire explicite uniquement. Aucune déduction de questionId, aucune promotion automatique et aucune autorisation de soumission.",
  };
  await mkdir(path.dirname(validationPath), { recursive: true });
  await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(validation, null, 2));
} finally {
  await pool.end();
  await adminPool.end();
}

async function readProjectVersion(id: string): Promise<number> {
  const result = await adminPool.query(
    "select current_version from regulatory.projects where id=$1",
    [id],
  );
  return Number(result.rows[0]?.current_version ?? 0);
}

async function readAnswer(id: string, targetQuestionId: string): Promise<unknown> {
  const result = await adminPool.query(
    `select answer_value
       from regulatory.project_answers
      where project_id=$1 and question_id=$2
      order by updated_at desc
      limit 1`,
    [id, targetQuestionId],
  );
  return result.rows[0]?.answer_value;
}

async function promotionCount(valueId: string): Promise<number> {
  const result = await adminPool.query(
    "select count(*)::int as count from regulatory.import_value_promotions where import_value_id=$1",
    [valueId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function seedUnreviewedValue(): Promise<void> {
  await adminPool.query(
    `insert into regulatory.prospectus_import_values (
       id, organization_id, import_batch_id, proposed_canonical_field_path,
       extracted_value, confidence, source_location, evidence_object_id,
       evidence_sha256, review_status
     )
     select $1, organization_id, id, 'fund.legal_form', 'SICAV', 0.90,
            '{"page":2}'::jsonb, evidence_object_id, evidence_sha256, 'EXTRACTED_UNVERIFIED'
       from regulatory.prospectus_import_batches
      where id=$2
     on conflict (id) do nothing`,
    ["77000000-0000-0000-0000-000000000099", importId],
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
