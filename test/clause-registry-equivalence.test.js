import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLAUSES, CLAUSE_CATALOG_VERSION } from "../src/catalog/clause-catalog.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(
  await readFile(path.join(repoRoot, "regulatory", "catalogs", "CLAUSE_CATALOG_V0_1.json"), "utf8"),
);

test("le registre de clauses matérialisé est strictement équivalent au catalogue historique", () => {
  assert.equal(registry.registry_id, "CLAUSE_CATALOG_V0_1");
  assert.equal(registry.clause_catalog_version, CLAUSE_CATALOG_VERSION);
  assert.equal(registry.clause_count, CLAUSES.length);
  assert.deepEqual(registry.clauses, CLAUSES);
  assert.equal(
    registry.materialization.content_sha256,
    sha256(JSON.stringify({ clauseCatalogVersion: CLAUSE_CATALOG_VERSION, clauses: CLAUSES })),
  );
});

test("la matérialisation ne peut ni approuver ni activer une clause", () => {
  assert.equal(registry.status, "DRAFT_LEGAL_REVIEW_REQUIRED");
  assert.equal(registry.governance.automatic_activation, false);
  assert.equal(registry.governance.ready_for_submission, false);
  assert.equal(registry.governance.legal_review_required, true);
  assert.equal(registry.governance.compliance_review_required, true);
  assert.ok(registry.clauses.length > 0);
  assert.ok(registry.clauses.every((clause) => clause.status === "DRAFT_LEGAL_REVIEW_REQUIRED"));
  assert.equal(new Set(registry.clauses.map((clause) => clause.clause_id)).size, registry.clauses.length);
});

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
