import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCirc005Matrix } from "../src/adapters/circ005-matrix-loader.js";
import { generateProspectusDraft } from "../src/core/generation-service.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const example = path.join(repoRoot, "examples", "united-capital-diamond");
const generatedAt = "2026-08-20T20:00:00.000Z";

const seedData = JSON.parse(await readFile(path.join(example, "preloaded-data.json"), "utf8"));
const answers = JSON.parse(await readFile(path.join(example, "answers.json"), "utf8"));
const matrixRows = await loadCirc005Matrix(repoRoot);

const clone = (value) => JSON.parse(JSON.stringify(value));
const replaceAnswer = (items, questionId, fieldValues) => {
  const index = items.findIndex((item) => item.question_id === questionId);
  assert.notEqual(index, -1, `Question fixture missing: ${questionId}`);
  items[index] = { ...items[index], field_values: fieldValues, source: { type: "SYNTHETIC_TEST_FIXTURE" } };
};

const base = { seedData, answers, matrixRows };
const profiles = [];

{
  const input = clone(base);
  input.matrixRows = matrixRows;
  input.seedData.fund.canonical_id = "synthetic-bond-active";
  replaceAnswer(input.answers, "Q_FUND_LEGAL_NAME", { "fund.legal_name": "Synthetic Bond Active Test Fund" });
  profiles.push(["bond-active", input]);
}
{
  const input = clone(base);
  input.matrixRows = matrixRows;
  input.seedData.fund.canonical_id = "synthetic-balanced";
  input.seedData.fund.classification = "SYNTHETIC_BALANCED_TEST_ONLY";
  replaceAnswer(input.answers, "Q_FUND_LEGAL_NAME", { "fund.legal_name": "Synthetic Balanced Test Fund" });
  replaceAnswer(input.answers, "Q_FINANCIAL_OBJECTIVE", {
    "investment.objective.primary_type": "CAPITAL_GROWTH",
    "investment.objective.summary": "Synthetic test objective only",
    "investment.objective.horizon_years": 7,
  });
  replaceAnswer(input.answers, "Q_ASSET_EXPOSURE_MATRIX", {
    "investment.asset_ranges": [
      { asset_class: "EQUITIES", label: "Actions", minimum_percent: 30, maximum_percent: 60, notes: "Synthetic test range" },
      { asset_class: "DEBT_AND_MONEY_MARKET", label: "Dette", minimum_percent: 30, maximum_percent: 60, notes: "Synthetic test range" },
      { asset_class: "CASH", label: "Liquidités", minimum_percent: 0, maximum_percent: 10, notes: "Synthetic test range" },
    ],
  });
  profiles.push(["balanced", input]);
}
{
  const input = clone(base);
  input.matrixRows = matrixRows;
  input.seedData.fund.canonical_id = "synthetic-conservative-debt";
  input.seedData.fund.classification = "SYNTHETIC_CONSERVATIVE_TEST_ONLY";
  replaceAnswer(input.answers, "Q_FUND_LEGAL_NAME", { "fund.legal_name": "Synthetic Conservative Debt Test Fund" });
  replaceAnswer(input.answers, "Q_MANAGEMENT_STYLE", {
    "investment.management_style": "PASSIVE_OR_RULE_BASED",
    "investment.selection_process": "Synthetic deterministic test process",
  });
  replaceAnswer(input.answers, "Q_ASSET_EXPOSURE_MATRIX", {
    "investment.asset_ranges": [
      { asset_class: "EQUITIES", label: "Actions", minimum_percent: 0, maximum_percent: 0, notes: "Synthetic test range" },
      { asset_class: "DEBT_AND_MONEY_MARKET", label: "Dette et monétaire", minimum_percent: 90, maximum_percent: 100, notes: "Synthetic test range" },
      { asset_class: "CASH", label: "Liquidités", minimum_percent: 0, maximum_percent: 10, notes: "Synthetic test range" },
    ],
  });
  profiles.push(["conservative-debt", input]);
}
{
  const input = clone(base);
  input.matrixRows = matrixRows;
  input.seedData.fund.canonical_id = "synthetic-no-redemption";
  input.seedData.fund.classification = "SYNTHETIC_EDGE_CASE_TEST_ONLY";
  input.seedData.redemption.gates.enabled = false;
  replaceAnswer(input.answers, "Q_FUND_LEGAL_NAME", { "fund.legal_name": "Synthetic No Redemption Edge Test Fund" });
  replaceAnswer(input.answers, "Q_REDEMPTION_ALLOWED", {
    "redemption.allowed": false,
    "redemption.request_channels": [],
  });
  profiles.push(["no-redemption-edge", input]);
}

const results = [];
const generationIds = new Set();
const documentHashes = new Set();
for (const [profile, input] of profiles) {
  const first = generateProspectusDraft({ ...input, generatedAt });
  const second = generateProspectusDraft({ ...clone(input), matrixRows, generatedAt });
  assert.equal(first.manifest.ready_for_submission, false);
  assert.equal(first.concordance.length, 62);
  assert.equal(first.manifest.generation_id, second.manifest.generation_id);
  assert.equal(first.manifest.prospectus_markdown_sha256, second.manifest.prospectus_markdown_sha256);
  assert.equal(first.prospectusMarkdown, second.prospectusMarkdown);
  generationIds.add(first.manifest.generation_id);
  documentHashes.add(first.manifest.prospectus_markdown_sha256);
  results.push({
    profile,
    generation_id: first.manifest.generation_id,
    prospectus_markdown_sha256: first.manifest.prospectus_markdown_sha256,
    canonical_data_sha256: first.manifest.canonical_data_sha256,
    requirement_count: first.manifest.requirement_count,
    coverage_counts: first.manifest.coverage_counts,
    ready_for_submission: first.manifest.ready_for_submission,
  });
}
assert.equal(generationIds.size, profiles.length);
assert.equal(documentHashes.size, profiles.length);

const validation = {
  validationId: "MULTI_PROFILE_REGRESSION_CORPUS_VALIDATION_V1",
  status: "PASS",
  generatedAt,
  syntheticFixtureOnly: true,
  profileCount: profiles.length,
  checks: {
    deterministicGenerationIds: true,
    deterministicDocumentHashes: true,
    distinctProfilesProduceDistinctGenerationIds: true,
    distinctProfilesProduceDistinctDocumentHashes: true,
    circ005ConcordanceRemains62: true,
    readyForSubmissionRemainsFalse: true,
    noRegulatoryTruthIntroduced: true
  },
  profiles: results,
  caveat: "Synthetic regression evidence only. It is neither regulatory approval nor production acceptance. Hashes are generated by the executing runtime and must never be fabricated manually."
};

const validationDir = path.join(repoRoot, "regulatory", "validation");
await mkdir(validationDir, { recursive: true });
await writeFile(
  path.join(validationDir, "MULTI_PROFILE_REGRESSION_CORPUS_VALIDATION.json"),
  `${JSON.stringify(validation, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify({
  validationId: validation.validationId,
  status: validation.status,
  profileCount: validation.profileCount,
  readyForSubmission: false,
}, null, 2));
