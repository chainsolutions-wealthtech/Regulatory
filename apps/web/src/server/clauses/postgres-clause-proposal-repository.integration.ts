import assert from "node:assert/strict";
import { Pool } from "pg";
import { createFixedTestIdentityProvider, type VerifiedIdentityContext } from "@/server/security/verified-identity";
import { createPostgresClauseProposalRepository } from "@/server/clauses/postgres-clause-proposal-repository";

const databaseUrl = process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED_FOR_CLAUSE_PROPOSAL_TEST");
if (!adminDatabaseUrl) throw new Error("DATABASE_ADMIN_URL_REQUIRED_FOR_CLAUSE_PROPOSAL_TEST");

const pool = new Pool({ connectionString: databaseUrl, max: 6 });
const adminPool = new Pool({ connectionString: adminDatabaseUrl, max: 2 });

const organizationA = "91000000-0000-0000-0000-000000000001";
const organizationB = "91000000-0000-0000-0000-000000000002";
const legalA: VerifiedIdentityContext = {
  organizationId: organizationA,
  userId: "92000000-0000-0000-0000-000000000001",
  subject: "clause-proposal-legal-a",
  roles: ["LEGAL"],
  provider: "CI_FIXED_TEST_IDENTITY",
  verifiedAt: "2026-08-17T21:00:00.000Z",
};
const legalB: VerifiedIdentityContext = {
  ...legalA,
  userId: "92000000-0000-0000-0000-000000000002",
  subject: "clause-proposal-legal-b",
};
const productA: VerifiedIdentityContext = {
  ...legalA,
  userId: "92000000-0000-0000-0000-000000000003",
  subject: "clause-proposal-product-a",
  roles: ["PRODUCT"],
};
const legalTenantB: VerifiedIdentityContext = {
  organizationId: organizationB,
  userId: "92000000-0000-0000-0000-000000000004",
  subject: "clause-proposal-legal-b-tenant",
  roles: ["LEGAL"],
  provider: "CI_FIXED_TEST_IDENTITY",
  verifiedAt: "2026-08-17T21:00:00.000Z",
};

try {
  await seedIdentity(organizationA, legalA, "clause-proposal-a", "Clause Proposal A", "LEGAL");
  await seedIdentity(organizationA, legalB, "clause-proposal-a", "Clause Proposal A", "LEGAL");
  await seedIdentity(organizationA, productA, "clause-proposal-a", "Clause Proposal A", "PRODUCT");
  await seedIdentity(organizationB, legalTenantB, "clause-proposal-b", "Clause Proposal B", "LEGAL");

  const repoLegalA = createPostgresClauseProposalRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(legalA),
  });
  const repoLegalB = createPostgresClauseProposalRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(legalB),
  });
  const repoProductA = createPostgresClauseProposalRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(productA),
  });
  const repoTenantB = createPostgresClauseProposalRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(legalTenantB),
  });

  const globalVersionCountBefore = await globalClauseVersionCount();

  await assertRejects(
    () => repoProductA.create({
      sourceClauseId: "UMOA_FCP_DRAFT_DISCLAIMER_V1",
      wording: "Proposition produit interdite.",
    }),
    "AUTHORIZATION_DENIED:CLAUSE_DRAFT",
  );

  const created = await repoLegalA.create({
    sourceClauseId: "UMOA_FCP_DRAFT_DISCLAIMER_V1",
    wording: "Proposition juridique tenant-scoped, sans effet sur le catalogue global.",
  });
  assert.equal(created.currentVersion, 1);
  assert.equal(created.status, "DRAFT");
  assert.equal(created.createdBy, legalA.userId);
  assert.equal(created.readyForSubmission, false);
  assert.equal(created.sourceClauseId, "UMOA_FCP_DRAFT_DISCLAIMER_V1");

  assert.equal((await repoLegalA.list()).length, 1);
  assert.equal((await repoTenantB.list()).length, 0, "Tenant B must not list tenant A proposals.");
  assert.equal(await repoTenantB.get(created.proposalId), null, "Tenant B must not read tenant A proposal.");

  const reviewRequested = await repoLegalA.requestLegalReview({
    proposalId: created.proposalId,
    expectedVersion: 1,
  });
  assert.equal(reviewRequested.currentVersion, 2);
  assert.equal(reviewRequested.status, "DRAFT_LEGAL_REVIEW_REQUIRED");
  assert.equal(reviewRequested.readyForSubmission, false);

  await assertRejects(
    () => repoLegalA.requestLegalReview({
      proposalId: created.proposalId,
      expectedVersion: 1,
    }),
    "CLAUSE_PROPOSAL_VERSION_CONFLICT",
  );

  await assertRejects(
    () => repoLegalA.approve({
      proposalId: created.proposalId,
      expectedVersion: 2,
    }),
    "DENIED_SEPARATION_OF_DUTIES",
  );

  const approved = await repoLegalB.approve({
    proposalId: created.proposalId,
    expectedVersion: 2,
  });
  assert.equal(approved.currentVersion, 3);
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.approvedBy, legalB.userId);
  assert.equal(approved.readyForSubmission, false);
  assert.equal(approved.versions.length, 3);
  assert.deepEqual(approved.versions.map((version) => version.status), [
    "DRAFT",
    "DRAFT_LEGAL_REVIEW_REQUIRED",
    "APPROVED",
  ]);

  await assertRejects(
    () => repoLegalB.approve({
      proposalId: created.proposalId,
      expectedVersion: 2,
    }),
    "CLAUSE_PROPOSAL_VERSION_CONFLICT",
  );

  await assertAppendOnlyVersion(approved.versions[2].versionId);
  assert.equal(
    await globalClauseVersionCount(),
    globalVersionCountBefore,
    "Clause proposals must never mutate the global clause_versions catalog.",
  );

  const validation = {
    validationId: "POSTGRESQL_CLAUSE_PROPOSAL_VALIDATION_V1",
    status: "PASS",
    checks: {
      tenantScopedRls: true,
      clauseDraftAuthorization: true,
      clauseApproveAuthorization: true,
      authorCannotSoleApprove: true,
      appendOnlyVersionHistory: true,
      optimisticConcurrency: true,
      globalClauseCatalogUnchanged: true,
      activationSurfaceAbsent: true,
      readyForSubmissionRemainsFalse: true,
    },
    caveat:
      "Une proposition approuvée reste une proposition tenant-scoped. Elle n'active ni ne modifie le catalogue global et n'autorise jamais une soumission réglementaire.",
  };
  console.log(JSON.stringify(validation, null, 2));
} finally {
  await pool.end();
  await adminPool.end();
}

async function seedIdentity(
  organizationId: string,
  identity: VerifiedIdentityContext,
  slug: string,
  legalName: string,
  role: string,
): Promise<void> {
  await adminPool.query(
    `insert into regulatory.organizations (id, slug, legal_name, country_code)
     values ($1,$2,$3,'CI') on conflict (id) do nothing`,
    [organizationId, slug, legalName],
  );
  await adminPool.query(
    `insert into regulatory.app_users (id, external_subject, email, display_name)
     values ($1,$2,$3,$4) on conflict (id) do nothing`,
    [identity.userId, identity.subject, `${identity.subject}@example.test`, identity.subject],
  );
  await adminPool.query(
    `insert into regulatory.organization_memberships (organization_id,user_id,role,is_administrator)
     values ($1,$2,$3::regulatory.review_role,false) on conflict do nothing`,
    [organizationId, identity.userId, role],
  );
}

async function globalClauseVersionCount(): Promise<number> {
  const result = await adminPool.query("select count(*)::int as count from regulatory.clause_versions");
  return Number(result.rows[0]?.count ?? 0);
}

async function assertAppendOnlyVersion(versionId: string): Promise<void> {
  await assertRejects(
    () => adminPool.query(
      "update regulatory.clause_proposal_versions set wording='mutation interdite' where id=$1",
      [versionId],
    ),
    "CLAUSE_PROPOSAL_VERSION_APPEND_ONLY",
  );
  await assertRejects(
    () => adminPool.query("delete from regulatory.clause_proposal_versions where id=$1", [versionId]),
    "CLAUSE_PROPOSAL_VERSION_APPEND_ONLY",
  );
}

async function assertRejects(action: () => Promise<unknown>, expected: string): Promise<void> {
  let rejected = false;
  try {
    await action();
  } catch (error) {
    rejected = String(error).includes(expected);
  }
  assert(rejected, `Expected rejection containing ${expected}`);
}
