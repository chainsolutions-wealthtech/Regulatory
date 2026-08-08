import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLAUSES, CLAUSE_CATALOG_VERSION } from "../src/catalog/clause-catalog.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputFile = "apps/web/src/generated/clause-catalog.json";
const validationFile = "regulatory/validation/WEB_CLAUSE_CATALOG_VALIDATION.json";

const normalizedClauses = CLAUSES.map((clause) => ({
  clauseId: clause.clause_id,
  version: clause.version,
  category: clause.category,
  status: clause.status,
  sectionId: clause.section_id,
  requirementIds: [...clause.requirements],
  fieldPaths: [...clause.field_paths],
  condition: clause.condition ?? null,
  wording: clause.wording,
})).toSorted((left, right) => left.clauseId.localeCompare(right.clauseId));

assertUnique(normalizedClauses.map((item) => item.clauseId), "clauseId");
if (normalizedClauses.some((item) => item.status !== "DRAFT_LEGAL_REVIEW_REQUIRED")) {
  throw new Error("WEB_CLAUSE_CATALOG_UNEXPECTED_NON_DRAFT_STATUS");
}
if (normalizedClauses.some((item) => item.requirementIds.length === 0)) {
  throw new Error("WEB_CLAUSE_CATALOG_CLAUSE_WITHOUT_REQUIREMENT");
}
if (normalizedClauses.some((item) => item.fieldPaths.length === 0)) {
  throw new Error("WEB_CLAUSE_CATALOG_CLAUSE_WITHOUT_FIELD_PATH");
}

const digest = sha256(JSON.stringify({
  clauseCatalogVersion: CLAUSE_CATALOG_VERSION,
  clauses: normalizedClauses,
}));

const categoryCounts = countBy(normalizedClauses, (item) => item.category);
const statusCounts = countBy(normalizedClauses, (item) => item.status);
const catalog = {
  schemaVersion: "1.0.0",
  generatedBy: "scripts/generate-web-clause-catalog.mjs",
  doNotEdit: true,
  clauseCatalogVersion: CLAUSE_CATALOG_VERSION,
  catalogDigest: digest,
  clauseCount: normalizedClauses.length,
  categoryCounts,
  statusCounts,
  clauses: normalizedClauses,
};

const validation = {
  validationId: "WEB_CLAUSE_CATALOG_VALIDATION_V1",
  status: "PASS",
  clauseCatalogVersion: CLAUSE_CATALOG_VERSION,
  catalogDigest: digest,
  clauseCount: normalizedClauses.length,
  uniqueClauseIdCount: new Set(normalizedClauses.map((item) => item.clauseId)).size,
  categoryCounts,
  statusCounts,
  invariants: {
    allClauseIdsUnique: true,
    allClausesRemainDraftLegalReviewRequired: true,
    everyClauseHasRequirements: true,
    everyClauseHasFieldPaths: true,
    readyForAutomaticActivation: false,
  },
  caveat:
    "Ce catalogue est une projection déterministe en lecture seule de la bibliothèque de clauses. Il ne constitue ni une approbation juridique, ni une activation de clause.",
};

await Promise.all([
  writeJson(path.join(repoRoot, outputFile), catalog),
  writeJson(path.join(repoRoot, validationFile), validation),
]);

console.log(JSON.stringify({
  output: outputFile,
  validation: validationFile,
  clauseCatalogVersion: CLAUSE_CATALOG_VERSION,
  clauseCount: normalizedClauses.length,
  catalogDigest: digest,
}, null, 2));

function countBy(values, selector) {
  return Object.fromEntries(
    [...values.reduce((map, value) => {
      const key = selector(value);
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map()).entries()].toSorted(([left], [right]) => left.localeCompare(right)),
  );
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`WEB_CLAUSE_CATALOG_DUPLICATE_${label}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
