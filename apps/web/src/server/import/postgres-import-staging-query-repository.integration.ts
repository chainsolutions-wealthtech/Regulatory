import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { createFixedTestIdentityProvider, type VerifiedIdentityContext } from "@/server/security/verified-identity";
import { createPostgresImportStagingQueryRepository } from "@/server/import/postgres-import-staging-query-repository";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED_FOR_IMPORT_STAGING_QUERY_TEST");

const pool = new Pool({ connectionString: databaseUrl, max: 2 });
const validationPath = path.resolve(
  process.cwd(),
  "../../regulatory/validation/POSTGRESQL_IMPORT_STAGING_QUERY_VALIDATION.json",
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

try {
  const queryA = createPostgresImportStagingQueryRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(tenantA),
  });
  const queryB = createPostgresImportStagingQueryRepository({
    pool,
    identityProvider: createFixedTestIdentityProvider(tenantB),
  });

  const alpha = await queryA.listProjectImports("73000000-0000-0000-0000-000000000001");
  assert.equal(alpha.length, 1, "Tenant A must see its staged import.");
  assert.equal(alpha[0].status, "REVIEWED");
  assert.equal(alpha[0].valueCount, 1);
  assert.equal(alpha[0].pendingCount, 0);
  assert.equal(alpha[0].confirmedCount, 1);
  assert.equal(alpha[0].rejectedCount, 0);
  assert.equal(alpha[0].canonicalWriteAllowed, false);
  assert.equal(alpha[0].readyForSubmission, false);

  const crossTenant = await queryB.listProjectImports("73000000-0000-0000-0000-000000000001");
  assert.equal(crossTenant.length, 0, "Tenant B must not list tenant A imports.");

  const validation = {
    validationId: "POSTGRESQL_IMPORT_STAGING_QUERY_VALIDATION_V1",
    status: "PASS",
    checks: {
      readOnlyProjectListing: true,
      reviewCounters: true,
      tenantIsolation: true,
      canonicalWriteRemainsFalse: true,
      readyForSubmissionRemainsFalse: true,
    },
    caveat:
      "Listing read-only tenant-scoped uniquement. Cette validation ne crée aucune donnée canonique et ne rend jamais le dossier prêt pour soumission.",
  };
  await mkdir(path.dirname(validationPath), { recursive: true });
  await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(validation, null, 2));
} finally {
  await pool.end();
}
