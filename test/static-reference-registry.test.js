import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(repoRoot, "regulatory", "registries", "UMOA_STATIC_REFERENCE_V1.json");
const schemaPath = path.join(repoRoot, "schemas", "canonical", "PROSPECTUS_CANONICAL_MODEL_V1.schema.json");

async function loadRegistry() {
  return JSON.parse(await readFile(registryPath, "utf8"));
}

async function loadSchema() {
  return JSON.parse(await readFile(schemaPath, "utf8"));
}

test("le référentiel UMOA statique contient exactement les huit Etats sourcés", async () => {
  const registry = await loadRegistry();
  const codes = registry.member_states.map((state) => state.iso_alpha2);

  assert.equal(registry.registry_id, "UMOA_STATIC_REFERENCE_V1");
  assert.equal(registry.status, "SOURCE_VERIFIED_BASELINE");
  assert.equal(registry.member_states.length, 8);
  assert.deepEqual([...codes].sort(), ["BF", "BJ", "CI", "GW", "ML", "NE", "SN", "TG"]);
  assert.equal(new Set(codes).size, 8);
  assert.equal(registry.governance.automatic_regulatory_activation, false);
  assert.equal(registry.governance.ready_for_submission, false);
});

test("le registre institutionnel et l'enum pays du schéma canonique restent identiques", async () => {
  const registry = await loadRegistry();
  const schema = await loadSchema();
  const registryCodes = registry.member_states.map((state) => state.iso_alpha2).sort();
  const schemaCodes = [...schema.$defs.countryCode.enum].sort();

  assert.deepEqual(schemaCodes, registryCodes);
  assert.equal(new Set(schemaCodes).size, schemaCodes.length);
});

test("la monnaie commune et son périmètre restent cohérents avec les Etats membres", async () => {
  const registry = await loadRegistry();
  const memberCodes = registry.member_states.map((state) => state.iso_alpha2).sort();
  const currencyScope = [...registry.common_currency.member_state_scope].sort();

  assert.equal(registry.common_currency.canonical_code, "XOF");
  assert.equal(registry.common_currency.display_label, "FCFA");
  assert.equal(registry.common_currency.issuing_institution, "BCEAO");
  assert.equal(registry.common_currency.code_standard, "ISO 4217");
  assert.deepEqual(currencyScope, memberCodes);
});

test("aucun calendrier opérationnel n'est inventé dans le référentiel statique", async () => {
  const registry = await loadRegistry();

  assert.equal(registry.calendars.status, "NOT_MATERIALIZED");
  assert.match(registry.calendars.reason, /year-specific authoritative sources/i);
  assert.ok(Array.isArray(registry.sources));
  assert.ok(registry.sources.some((source) => source.authority === "BCEAO" && source.supports.includes("member_states")));
  assert.ok(registry.sources.some((source) => source.authority === "ISO" && source.supports.includes("currency_code_standard")));
});
