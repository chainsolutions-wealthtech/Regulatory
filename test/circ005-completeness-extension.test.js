import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCirc005Matrix } from "../src/adapters/circ005-matrix-loader.js";
import { generateProspectusDraft } from "../src/core/generation-service.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function generate() {
  const example = path.join(repoRoot, "examples", "united-capital-diamond");
  const [seedData, answers, matrixRows] = await Promise.all([
    readFile(path.join(example, "preloaded-data.json"), "utf8").then(JSON.parse),
    readFile(path.join(example, "answers.json"), "utf8").then(JSON.parse),
    loadCirc005Matrix(repoRoot),
  ]);
  return generateProspectusDraft({
    seedData,
    answers,
    matrixRows,
    generatedAt: "2026-08-05T03:00:00.000Z",
  });
}

test("aucune exigence CIRC005 n'est silencieusement manquante", async () => {
  const generation = await generate();
  assert.equal(generation.manifest.coverage_counts.MISSING, 0);
  assert.deepEqual(generation.manifest.missing_requirement_ids, []);
  assert.equal(generation.concordance.length, 62);
});

test("les informations non vérifiées restent en attente de revue", async () => {
  const generation = await generate();
  assert.ok(generation.manifest.coverage_counts.PENDING_REVIEW > 0);
  assert.ok(generation.manifest.pending_review_requirement_ids.includes("CIRC005_1_7_FCP_ACCOUNTING_CONTROL_PERSONS"));
  assert.ok(generation.manifest.pending_review_requirement_ids.includes("CIRC005_1_3_SGO_OTHER_FUNDS"));
  assert.equal(generation.manifest.ready_for_compliance_review, false);
  assert.equal(generation.manifest.ready_for_submission, false);
  assert.match(generation.prospectusMarkdown, /Zéro exigence manquante ne vaut ni validation juridique/);
});

test("les frais directement supportés par le porteur sont séparés", async () => {
  const generation = await generate();
  const item = generation.concordance.find(
    (entry) => entry.requirement_id === "CIRC005_5_4_OTHER_EXPENSES_HOLDER",
  );
  assert.equal(item.coverage_status, "IN_PROSPECTUS");
  assert.match(generation.prospectusMarkdown, /Commission de souscription non acquise au Fonds/);
});
