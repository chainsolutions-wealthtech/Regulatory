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
const tenantAReadOnly: VerifiedIdentityContext = {
  ...tenantA,
  roles: ["COMPLIANCE"],
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
const promotedValueId = "77000000-0000-0000-0000-000000000088";
const staleValueId = "77000000-0000-0000-0000-000000000089";
const unreviewedValueId = "77000000-0000-0000-0000-000000000099";
const questionId = "Q_FUND_CONSTITUTION_DATE";

try {
  await seedPromotionValue(promotedValueId, "CONFIRMED_BY_HUMAN");
  await seedPromotionValue(staleValueId, "CONFIRMED_BY_HUMAN");
  await seedPromotionValue(unreviewedValueId, "EXTRACTED_UNVERIFIED");

  const repositoryA = createPostgresImportPromotionRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(tenantA),
  });
  const repositoryAReadOnly = createPostgresImportPromotionRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(tenantAReadOnly),
  });
  const repositoryB = createPostgresImportPromotionRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(tenantB),
  });

  assert.equal(await readProjectVersion(projectId), 1, "Promotion seed must start at project version 1.");

  await assertRejects(
    () => repositoryAReadOnly.promoteConfirmedValue({
      projectId,
      importId,
      importValueId: promotedValueId,
      questionId,
      expectedVersion: 1,
    }),
    "AUTHORIZATION_DENIED:ANSWER_WRITE",
  );
  assert.equal(await readProjectVersion(projectId), 1, "Denied RBAC attempt must not create a version.");

  const receipt = await repositoryA.promoteConfirmedValue({
    projectId,
    importId,
    importValueId: promotedValueId,
    questionId,
    expectedVersion: 1,
  });

  assert.equal(receipt.projectId, projectId);
  assert.equal(receipt.importId, importId);
  assert.equal(receipt.importValueId, promotedValueId);
  assert.equal(receipt.questionId, questionId);
  assert.equal(receipt.projectVersion, 2);
  assert.equal(receipt.sourceSha256, "a".repeat(64));
  assert.equal(receipt.reviewedByUserId, tenantA.userId);
  assert.equal(receipt.promotedByUserId, tenantA.userId);
  assert.equal(receipt.readyForSubmission, false);
  assert.equal(await readProjectVersion(projectId), 2, "Promotion must create exactly one project version.");
  assert.equal(await readAnswer(projectId, questionId), "2026-08-05");
  assert.equal(await promotionCount(promotedValueId), 1, "Exactly one immutable promotion receipt is expected.");

  await assertRejects(
    () => repositoryA.promoteConfirmedValue({
      projectId,
      importId,
      importValueId: promotedValueId,
      questionId,
      expectedVersion: 2,
    }),
    "IMPORT_VALUE_ALREADY_PROMOTED",
  );
  assert.equal(await readProjectVersion(projectId), 2, "Duplicate promotion must not create a version.");

  await assertRejects(
    () => repositoryA.promoteConfirmedValue({
      projectId,
      importId,
      importValueId: staleValueId,
      questionId,
      expectedVersion: 1,
    }),
    "PROJECT_VERSION_CONFLICT",
  );
  assert.equal(await promotionCount(staleValueId), 0, "Stale version must not create a receipt.");
  assert.equal(await readProjectVersion(projectId), 2, "Stale version must not mutate the project.");

  await assertRejects(
    () => repositoryB.promoteConfirmedValue({
      projectId,
      importId,
      importValueId: staleValueId,
      questionId,
      expectedVersion: 2,
    }),
    "IMPORT_PROMOTION_SCOPE_MISMATCH",
  );
  assert.equal(await readProjectVersion(projectId), 2, "Cross-tenant attempt must not mutate the project.");

  await assertRejects(
    () => repositoryA.promoteConfirmedValue({
      projectId,
      importId,
      importValueId: unreviewedValueId,
      questionId,
      expectedVersion: 2,
    }),
    "IMPORT_VALUE_NOT_HUMAN_CONFIRMED",
  );
  assert.equal(await promotionCount(unreviewedValueId), 0, "Unreviewed value must not create a receipt.");

  await assertRejects(
    () => repositoryA.promoteConfirmedValue({
      projectId,
      importId,
      importValueId: staleValueId,
      questionId: " ",
      expectedVersion: 2,
    }),
    "IMPORT_PROMOTION_QUESTION_ID_REQUIRED",
  );

  await assertAppendOnlyReceipt(promotedValueId);

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
      appendOnlyPromotionReceipt: true,
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

async function seedPromotionValue(
  importValueId: string,
  reviewStatus: "CONFIRMED_BY_HUMAN" | "EXTRACTED_UNVERIFIED",
): Promise<void> {
  const reviewed = reviewStatus === "CONFIRMED_BY_HUMAN";
  await adminPool.query(
    `insert into regulatory.prospectus_import_values (
       id, organization_id, import_batch_id, proposed_canonical_field_path,
       extracted_value, confidence, source_location, evidence_object_id,
       evidence_sha256, review_status, reviewed_by, reviewed_at
     )
     select $1, organization_id, id, 'fund.constitution_date',
            to_jsonb('2026-08-05'::text), 0.97, '{"page":2,"textAnchor":"2026-08-05"}'::jsonb,
            evidence_object_id, evidence_sha256, $3,
            case when $4 then $5::uuid else null end,
            case when $4 then '2026-08-17T20:19:00.000Z'::timestamptz else null end
       from regulatory.prospectus_import_batches
      where id=$2
     on conflict (id) do nothing`,
    [importValueId, importId, reviewStatus, reviewed, tenantA.userId],
  );
}

async function readProjectVersion(id: string): Promise<number> {
  const result = await adminPool.query(
    `select coalesce(max(version_number), 0)::int as version
       from regulatory.project_versions
      where project_id=$1`,
    [id],
  );
  return Number(result.rows[0]?.version ?? 0);
}

async function readAnswer(id: string, targetQuestionId: string): Promise<unknown> {
  const result = await adminPool.query(
    `select a.value
       from regulatory.project_answers a
       join regulatory.project_versions pv on pv.id = a.project_version_id
      where pv.project_id=$1 and a.question_id=$2
      order by pv.version_number desc
      limit 1`,
    [id, targetQuestionId],
  );
  return result.rows[0]?.value;
}

async function promotionCount(valueId: string): Promise<number> {
  const result = await adminPool.query(
    "select count(*)::int as count from regulatory.import_value_promotions where import_value_id=$1",
    [valueId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function assertAppendOnlyReceipt(valueId: string): Promise<void> {
  await assertRejects(
    () => adminPool.query(
      `update regulatory.import_value_promotions
          set question_id='Q_FUND_LEGAL_FORM'
        where import_value_id=$1`,
      [valueId],
    ),
    "IMPORT_PROMOTION_APPEND_ONLY",
  );
  await assertRejects(
    () => adminPool.query(
      "delete from regulatory.import_value_promotions where import_value_id=$1",
      [valueId],
    ),
    "IMPORT_PROMOTION_APPEND_ONLY",
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
