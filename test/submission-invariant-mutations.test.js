import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCirc005Matrix } from "../src/adapters/circ005-matrix-loader.js";
import { generateProspectusDraft } from "../src/core/generation-service.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const example = path.join(repoRoot, "examples", "united-capital-diamond");
const generatedAt = "2026-08-20T20:30:00.000Z";

async function fixture() {
  return {
    seedData: JSON.parse(await readFile(path.join(example, "preloaded-data.json"), "utf8")),
    answers: JSON.parse(await readFile(path.join(example, "answers.json"), "utf8")),
    matrixRows: await loadCirc005Matrix(repoRoot),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertSubmissionInvariant(generation, label) {
  assert.equal(generation.manifest.ready_for_submission, false, `${label}: ready_for_submission must remain false`);
  assert.equal(generation.manifest.requirement_count, 62, `${label}: manifest requirement count drift`);
  assert.equal(generation.concordance.length, 62, `${label}: concordance must preserve all CIRC005 requirements`);
}

test("aucune mutation de données métier ne peut activer implicitement la soumission", async () => {
  const base = await fixture();
  const mutations = [
    ["forged-ready-flag", (input) => { input.seedData.ready_for_submission = true; }],
    ["forged-approved-status", (input) => { input.seedData.regulatory_context.document_status = "APPROVED_FOR_SUBMISSION"; }],
    ["forged-review-state", (input) => { input.seedData.reviews = [{ role: "COMPLIANCE", decision: "APPROVED" }, { role: "LEGAL", decision: "APPROVED" }]; }],
    ["missing-answer", (input) => { input.answers = input.answers.filter((item) => item.question_id !== "Q_FUND_TAX_REGIME"); }],
    ["future-generated-at-independent", () => {}],
  ];

  for (const [label, mutate] of mutations) {
    const input = clone(base);
    input.matrixRows = base.matrixRows;
    mutate(input);
    const generation = generateProspectusDraft({ ...input, generatedAt });
    assertSubmissionInvariant(generation, label);
  }
});

test("les données incomplètes restent visibles dans une concordance exhaustive", async () => {
  const input = await fixture();
  const complete = generateProspectusDraft({ ...input, generatedAt });
  const incompleteInput = clone(input);
  incompleteInput.matrixRows = input.matrixRows;
  incompleteInput.answers = incompleteInput.answers.filter((item) =>
    !["Q_FUND_TAX_REGIME", "Q_FINANCIAL_YEAR_END", "Q_TRANSACTION_FEES"].includes(item.question_id),
  );
  const incomplete = generateProspectusDraft({ ...incompleteInput, generatedAt });

  assertSubmissionInvariant(complete, "complete-fixture");
  assertSubmissionInvariant(incomplete, "incomplete-fixture");
  assert.equal(incomplete.manifest.ready_for_submission, false);
  assert.ok(
    incomplete.manifest.coverage_counts.MISSING >= complete.manifest.coverage_counts.MISSING,
    "Removing answers must not make missing coverage look better.",
  );
});
