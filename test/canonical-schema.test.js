import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(
  repoRoot,
  "schemas/canonical/PROSPECTUS_CANONICAL_MODEL_V1.schema.json",
);
const migrationPath = path.join(repoRoot, "database/migrations/0001_regulatory_core.sql");

const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const migration = await readFile(migrationPath, "utf8");

test("le JSON Schema canonique V1 expose toutes les collections structurées", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties.regulatory_context.$ref, "#/$defs/regulatoryContext");
  assert.equal(schema.properties.share_classes.items.$ref, "#/$defs/shareClass");
  assert.equal(
    schema.properties.investment_policy.properties.asset_class_ranges.items.$ref,
    "#/$defs/assetClassRange",
  );
  assert.equal(schema.properties.fees.properties.transaction.items.$ref, "#/$defs/fee");
  assert.equal(schema.properties.remunerations.items.$ref, "#/$defs/fee");
  assert.equal(
    schema.properties.valuation.properties.methods.items.$ref,
    "#/$defs/valuationMethod",
  );
  assert.equal(schema.properties.service_providers.items.$ref, "#/$defs/party");
  assert.equal(schema.properties.risks.items.$ref, "#/$defs/riskFactor");
  assert.equal(
    schema.properties.distribution_countries.items.$ref,
    "#/$defs/countryArrangement",
  );
  assert.equal(schema.properties.evidence.items.$ref, "#/$defs/evidence");
});

test("le schéma canonique interdit un indicateur prêt pour soumission à true", () => {
  assert.equal(schema.$defs.regulatoryContext.properties.ready_for_submission.const, false);
});

test("la migration PostgreSQL contient les tables transactionnelles et canoniques attendues", () => {
  for (const table of [
    "organizations",
    "app_users",
    "organization_memberships",
    "regulatory_sources",
    "requirements",
    "clauses",
    "clause_versions",
    "rules",
    "projects",
    "project_versions",
    "project_answers",
    "canonical_snapshots",
    "project_share_classes",
    "project_asset_ranges",
    "project_fees",
    "project_valuation_methods",
    "project_parties",
    "project_risks",
    "project_country_arrangements",
    "evidence_items",
    "review_requests",
    "review_decisions",
    "generated_documents",
    "audit_events",
  ]) {
    assert.match(migration, new RegExp(`create table regulatory\\.${table} \\(`, "i"));
  }
});

test("la migration applique les contraintes critiques et le multi-tenant", () => {
  assert.match(migration, /minimum_percent <= target_percent and target_percent <= maximum_percent/i);
  assert.match(migration, /ready_for_submission boolean not null default false check \(ready_for_submission = false\)/i);
  assert.match(migration, /create unique index project_country_single_home_state_idx/i);
  assert.match(migration, /create trigger audit_events_prevent_update/i);
  assert.match(migration, /enable row level security/gi);
  assert.match(migration, /current_setting\('app\.current_organization_id', true\)/i);
});

test("la migration est additive et encapsulée dans une transaction", () => {
  assert.match(migration.trimStart(), /^begin;/i);
  assert.match(migration.trimEnd(), /commit;$/i);
  assert.doesNotMatch(migration, /\bdrop\s+(table|schema|column|type)\b/i);
  assert.doesNotMatch(migration, /ready_for_submission\s+boolean[^;]+default\s+true/i);
});
