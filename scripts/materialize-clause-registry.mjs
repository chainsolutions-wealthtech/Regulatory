import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLAUSES, CLAUSE_CATALOG_VERSION } from "../src/catalog/clause-catalog.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(repoRoot, "regulatory", "catalogs", "CLAUSE_CATALOG_V0_1.json");

const clauses = structuredClone(CLAUSES);
const clauseIds = clauses.map((clause) => clause.clause_id);
if (new Set(clauseIds).size !== clauseIds.length) throw new Error("CLAUSE_REGISTRY_DUPLICATE_ID");
if (clauses.some((clause) => clause.status !== "DRAFT_LEGAL_REVIEW_REQUIRED")) {
  throw new Error("CLAUSE_REGISTRY_NON_DRAFT_STATUS_FORBIDDEN");
}
if (clauses.some((clause) => !Array.isArray(clause.requirements) || clause.requirements.length === 0)) {
  throw new Error("CLAUSE_REGISTRY_REQUIREMENT_REQUIRED");
}
if (clauses.some((clause) => !Array.isArray(clause.field_paths) || clause.field_paths.length === 0)) {
  throw new Error("CLAUSE_REGISTRY_FIELD_PATH_REQUIRED");
}

const contentDigest = sha256(JSON.stringify({ clauseCatalogVersion: CLAUSE_CATALOG_VERSION, clauses }));
const registry = {
  registry_id: "CLAUSE_CATALOG_V0_1",
  schema_version: "1.0.0",
  clause_catalog_version: CLAUSE_CATALOG_VERSION,
  status: "DRAFT_LEGAL_REVIEW_REQUIRED",
  materialization: {
    source_module: "src/catalog/clause-catalog.js",
    mode: "MIGRATION_EQUIVALENCE_BASELINE",
    content_sha256: contentDigest
  },
  governance: {
    automatic_activation: false,
    ready_for_submission: false,
    legal_review_required: true,
    compliance_review_required: true
  },
  clause_count: clauses.length,
  clauses,
  caveat:
    "Matérialisation déterministe du catalogue exécutable existant. Aucun wording, statut, identifiant, condition ou ordre n'est approuvé juridiquement par cette opération."
};

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(registry, null, 2) + "\n", "utf8");

console.log(JSON.stringify({
  registryId: registry.registry_id,
  clauseCatalogVersion: registry.clause_catalog_version,
  clauseCount: registry.clause_count,
  contentSha256: contentDigest,
  readyForAutomaticActivation: false,
  readyForSubmission: false
}, null, 2));

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
