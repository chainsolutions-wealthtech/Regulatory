import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCirc005Matrix } from "../src/adapters/circ005-matrix-loader.js";
import { generateProspectusDraft } from "../src/core/generation-service.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedAt = "2026-08-20T20:00:00.000Z";

async function baseFixture() {
  const example = path.join(repoRoot, "examples", "united-capital-diamond");
  return {
    seedData: JSON.parse(await readFile(path.join(example, "preloaded-data.json"), "utf8")),
    answers: JSON.parse(await readFile(path.join(example, "answers.json"), "utf8")),
    matrixRows: await loadCirc005Matrix(repoRoot),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function answer(answers, questionId, fieldValues) {
  const index = answers.findIndex((item) => item.question_id === questionId);
  assert.notEqual(index, -1, `Question fixture missing: ${questionId}`);
  answers[index] = {
    ...answers[index],
    field_values: fieldValues,
    source: { type: "SYNTHETIC_TEST_FIXTURE" },
  };
}

async function corpus() {
  const base = await baseFixture();

  const bond = clone(base);
  bond.seedData.fund.canonical_id = "synthetic-bond-active";
  answer(bond.answers, "Q_FUND_LEGAL_NAME", { "fund.legal_name": "Synthetic Bond Active Test Fund" });

  const balanced = clone(base);
  balanced.seedData.fund.canonical_id = "synthetic-balanced";
  balanced.seedData.fund.classification = "SYNTHETIC_BALANCED_TEST_ONLY";
  answer(balanced.answers, "Q_FUND_LEGAL_NAME", { "fund.legal_name": "Synthetic Balanced Test Fund" });
  answer(balanced.answers, "Q_FINANCIAL_OBJECTIVE", {
    "investment.objective.primary_type": "CAPITAL_GROWTH",
    "investment.objective.summary": "Synthetic test objective only",
    "investment.objective.horizon_years": 7,
  });
  answer(balanced.answers, "Q_ASSET_EXPOSURE_MATRIX", {
    "investment.asset_ranges": [
      { asset_class: "EQUITIES", label: "Actions", minimum_percent: 30, maximum_percent: 60, notes: "Synthetic test range" },
      { asset_class: "DEBT_AND_MONEY_MARKET", label: "Dette", minimum_percent: 30, maximum_percent: 60, notes: "Synthetic test range" },
      { asset_class: "CASH", label: "Liquidités", minimum_percent: 0, maximum_percent: 10, notes: "Synthetic test range" },
    ],
  });

  const conservative = clone(base);
  conservative.seedData.fund.canonical_id = "synthetic-conservative-debt";
  conservative.seedData.fund.classification = "SYNTHETIC_CONSERVATIVE_TEST_ONLY";
  answer(conservative.answers, "Q_FUND_LEGAL_NAME", { "fund.legal_name": "Synthetic Conservative Debt Test Fund" });
  answer(conservative.answers, "Q_MANAGEMENT_STYLE", {
    "investment.management_style": "PASSIVE_OR_RULE_BASED",
    "investment.selection_process": "Synthetic deterministic test process",
  });
  answer(conservative.answers, "Q_ASSET_EXPOSURE_MATRIX", {
    "investment.asset_ranges": [
      { asset_class: "EQUITIES", label: "Actions", minimum_percent: 0, maximum_percent: 0, notes: "Synthetic test range" },
      { asset_class: "DEBT_AND_MONEY_MARKET", label: "Dette et monétaire", minimum_percent: 90, maximum_percent: 100, notes: "Synthetic test range" },
      { asset_class: "CASH", label: "Liquidités", minimum_percent: 0, maximum_percent: 10, notes: "Synthetic test range" },
    ],
  });

  const noRedemption = clone(base);
  noRedemption.seedData.fund.canonical_id = "synthetic-no-redemption";
  noRedemption.seedData.fund.classification = "SYNTHETIC_EDGE_CASE_TEST_ONLY";
  noRedemption.seedData.redemption.gates.enabled = false;
  answer(noRedemption.answers, "Q_FUND_LEGAL_NAME", { "fund.legal_name": "Synthetic No Redemption Edge Test Fund" });
  answer(noRedemption.answers, "Q_REDEMPTION_ALLOWED", {
    "redemption.allowed": false,
    "redemption.request_channels": [],
  });

  return [
    ["bond-active", bond],
    ["balanced", balanced],
    ["conservative-debt", conservative],
    ["no-redemption-edge", noRedemption],
  ];
}

test("le corpus synthétique multi-profils reste déterministe et non soumissionnable", async () => {
  const profiles = await corpus();
  const generationIds = new Set();
  const documentHashes = new Set();

  for (const [profileName, input] of profiles) {
    const first = generateProspectusDraft({ ...input, generatedAt });
    const second = generateProspectusDraft({ ...clone(input), matrixRows: input.matrixRows, generatedAt });

    assert.equal(first.manifest.ready_for_submission, false, `${profileName}: submission must remain disabled`);
    assert.equal(first.concordance.length, 62, `${profileName}: CIRC005 concordance must remain complete`);
    assert.equal(first.manifest.generation_id, second.manifest.generation_id, `${profileName}: generation id drift`);
    assert.equal(first.manifest.prospectus_markdown_sha256, second.manifest.prospectus_markdown_sha256, `${profileName}: document hash drift`);
    assert.equal(first.prospectusMarkdown, second.prospectusMarkdown, `${profileName}: markdown drift`);
    assert.match(first.prospectusMarkdown, /Synthetic .* Test Fund/);

    generationIds.add(first.manifest.generation_id);
    documentHashes.add(first.manifest.prospectus_markdown_sha256);
  }

  assert.equal(generationIds.size, profiles.length, "Distinct synthetic profiles must not collapse to one generation id.");
  assert.equal(documentHashes.size, profiles.length, "Distinct synthetic profiles must not collapse to one document hash.");
});

test("le corpus exerce plusieurs profils de risque sans introduire de vérité réglementaire", async () => {
  const profiles = await corpus();
  const generated = Object.fromEntries(
    profiles.map(([name, input]) => [name, generateProspectusDraft({ ...input, generatedAt })]),
  );

  assert.match(generated["bond-active"].prospectusMarkdown, /Risque de taux/);
  assert.match(generated.balanced.prospectusMarkdown, /Risque actions/);
  assert.doesNotMatch(generated["conservative-debt"].prospectusMarkdown, /Risque actions/);
  assert.doesNotMatch(generated["conservative-debt"].prospectusMarkdown, /Risque lié à la gestion discrétionnaire/);
  assert.equal(generated["no-redemption-edge"].manifest.ready_for_submission, false);
});
