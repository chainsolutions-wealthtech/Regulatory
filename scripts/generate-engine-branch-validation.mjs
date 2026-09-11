import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCirc005Matrix } from "../src/adapters/circ005-matrix-loader.js";
import { evaluateCondition } from "../src/core/condition-engine.js";
import { applyQuestionnaireAnswers, buildQuestionCatalog, listApplicableQuestions } from "../src/core/questionnaire-engine.js";
import { runValidation } from "../src/core/rule-engine.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exampleRoot = path.join(repoRoot, "examples", "united-capital-diamond");
const matrixRows = await loadCirc005Matrix(repoRoot);
const questionCatalog = buildQuestionCatalog(matrixRows);
const seedData = JSON.parse(await readFile(path.join(exampleRoot, "preloaded-data.json"), "utf8"));
const answers = JSON.parse(await readFile(path.join(exampleRoot, "answers.json"), "utf8"));

const conditionData = { fund: { active: true, score: 7, empty: "", tags: ["BOND", "XOF"], list: [] } };
assert.equal(evaluateCondition({ all: [{ path: "fund.active", operator: "equals", value: true }, { path: "fund.score", operator: "greater_than", value: 3 }] }, conditionData), true);
assert.equal(evaluateCondition({ any: [{ path: "fund.active", operator: "equals", value: false }, { path: "fund.tags", operator: "includes", value: "XOF" }] }, conditionData), true);
assert.equal(evaluateCondition({ not: { path: "fund.active", operator: "equals", value: false } }, conditionData), true);
assert.equal(evaluateCondition({ path: "fund.active", operator: "not_equals", value: false }, conditionData), true);
assert.equal(evaluateCondition({ path: "fund.active", operator: "exists" }, conditionData), true);
assert.equal(evaluateCondition({ path: "fund.empty", operator: "exists" }, conditionData), false);
assert.equal(evaluateCondition({ path: "fund.tags", operator: "not_empty" }, conditionData), true);
assert.equal(evaluateCondition({ path: "fund.list", operator: "not_empty" }, conditionData), false);
assert.throws(() => evaluateCondition({ path: "fund.active", operator: "unsupported", value: true }, conditionData), /Opérateur conditionnel non pris en charge/);

assert.equal(questionCatalog.some((question) => question.type === "SYSTEM"), false);
assert.throws(() => applyQuestionnaireAnswers({ seedData: {}, questionCatalog: [], answers: [{ question_id: "Q_UNKNOWN", field_values: {} }] }), /Question inconnue/);
assert.throws(() => applyQuestionnaireAnswers({
  seedData: { fund: { classification: "ORIGINAL" } },
  questionCatalog: [{ question_id: "Q_TEST", requirement_id: "REQ_TEST", canonical_fields: ["fund.legal_name"] }],
  answers: [{ question_id: "Q_TEST", field_values: { fund: { legal_name: "Injected", classification: "FORBIDDEN" } } }],
}), /n\'est pas autorisé/);

const structuredRoots = applyQuestionnaireAnswers({
  seedData: {},
  questionCatalog: [
    { question_id: "Q_TRANSACTION_FEES", requirement_id: "REQ_FEES", canonical_fields: ["fees.transaction"] },
    { question_id: "Q_HOME_STATE_ARRANGEMENTS", requirement_id: "REQ_COUNTRIES", canonical_fields: ["distribution_countries.country_code"] },
  ],
  answers: [
    { question_id: "Q_TRANSACTION_FEES", field_values: { fees: [{ label: "Test" }] } },
    { question_id: "Q_HOME_STATE_ARRANGEMENTS", field_values: { distribution_countries: [{ country_code: "CI" }] } },
  ],
});
assert.deepEqual(structuredRoots.data.fees, [{ label: "Test" }]);
assert.deepEqual(structuredRoots.data.distribution_countries, [{ country_code: "CI" }]);

const exampleResult = applyQuestionnaireAnswers({ seedData, answers, questionCatalog });
assert.equal(exampleResult.answerLog.length, answers.length);
assert.equal(answers.length, 30);

const visibilityCatalog = [
  { question_id: "Q_ALWAYS" },
  { question_id: "Q_REDEMPTION_SUSPENSION_ALLOWED" },
  { question_id: "Q_ADVISER_IMPORTANT_CLAUSES" },
  { question_id: "Q_ADVISER_OTHER_ACTIVITIES" },
];
assert.deepEqual(listApplicableQuestions(visibilityCatalog, { redemption: { allowed: false }, external_adviser: { enabled: false } }).map((q) => q.question_id), ["Q_ALWAYS"]);
assert.equal(listApplicableQuestions(visibilityCatalog, { redemption: { allowed: true }, external_adviser: { enabled: true } }).length, 4);

const baseRuleData = () => ({
  fund: { legal_name: "FCP Test" },
  manager: { legal_name: "SGO Test" },
  depositary: { legal_name: "Banque Test" },
  share_classes: [{ class_id: "MAIN", currency: "XOF", income_policy: "CAPITALIZATION", initial_nav: 100000 }],
  investment: { asset_ranges: [{ asset_class: "CASH", minimum_percent: 0, maximum_percent: 100 }] },
  valuation: { methods: [{ asset_class: "CASH", method: "Valeur nominale" }] },
  redemption: { allowed: false },
  fees: [],
  tax: { source_reference: "SOURCE_TEST" },
  economic_information: { review_status: "REVIEWED" },
});
const passed = runValidation(baseRuleData());
assert.equal(passed.status, "PASSED");
assert.equal(passed.ready_for_submission, false);
const warningData = baseRuleData();
delete warningData.tax.source_reference;
const warning = runValidation(warningData);
assert.equal(warning.status, "PASSED_WITH_WARNINGS");
assert.equal(warning.counts.BLOCKER, 0);
assert.equal(warning.ready_for_submission, false);
const failedData = baseRuleData();
failedData.fund.legal_name = "";
const failed = runValidation(failedData);
assert.equal(failed.status, "VALIDATION_FAILED");
assert.ok(failed.counts.BLOCKER > 0);
assert.equal(failed.ready_for_submission, false);
const allocationData = baseRuleData();
allocationData.investment.asset_ranges = [{ asset_class: "CASH", minimum_percent: 60, maximum_percent: 100 }, { asset_class: "EQUITIES", minimum_percent: 50, maximum_percent: 100 }];
allocationData.valuation.methods = [{ asset_class: "CASH", method: "Valeur nominale" }, { asset_class: "EQUITIES", method: "Cours de marché" }];
assert.ok(runValidation(allocationData).findings.some((f) => f.rule_id === "RULE_SUM_MINIMUMS_POSSIBLE"));
const redemptionData = baseRuleData();
redemptionData.redemption.allowed = true;
assert.ok(runValidation(redemptionData).findings.some((f) => f.rule_id === "RULE_REDEMPTION_PROCESS_COMPLETE"));
const suspensionData = baseRuleData();
suspensionData.redemption.suspension = { allowed: true };
assert.ok(runValidation(suspensionData).findings.some((f) => f.rule_id === "RULE_SUSPENSION_CIRCUMSTANCES_REQUIRED"));
const feeData = baseRuleData();
feeData.fees = [{ label: "Gestion", payer_type: "FUND", beneficiary: "MANAGER", basis: "NAV", rate_type: "PERCENTAGE" }];
assert.ok(runValidation(feeData).findings.some((f) => f.rule_id === "RULE_FEE_BASIS_BENEFICIARY_PAYER_COMPLETE"));

const validation = {
  validationId: "ENGINE_BRANCH_COVERAGE_VALIDATION_V1",
  status: "PASS",
  questionCatalogCount: questionCatalog.length,
  exampleAnswerCount: answers.length,
  checks: {
    conditionCombinatorsCovered: true,
    conditionOperatorsCovered: true,
    unsupportedConditionRejected: true,
    systemQuestionsExcludedFromInteractiveCatalog: true,
    unknownQuestionRejected: true,
    parentPathEscalationRejected: true,
    explicitStructuredRootCompatibilityPreserved: true,
    historicalExampleAnswersCompatible: true,
    visibilityHiddenAndVisibleBranchesCovered: true,
    validationPassedBranchCovered: true,
    validationWarningBranchCovered: true,
    validationFailedBranchCovered: true,
    allocationBranchCovered: true,
    redemptionBranchCovered: true,
    suspensionBranchCovered: true,
    feeBranchCovered: true,
    warningsRemainNonBlocking: true,
    readyForSubmissionRemainsFalse: true
  },
  caveat: "Preuve de couverture des branches logicielles déterministes uniquement. Elle ne constitue ni une validation réglementaire exhaustive, ni une approbation humaine, ni une autorisation de soumission."
};
const validationDir = path.join(repoRoot, "regulatory", "validation");
await mkdir(validationDir, { recursive: true });
await writeFile(path.join(validationDir, "ENGINE_BRANCH_COVERAGE_VALIDATION.json"), JSON.stringify(validation, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ validationId: validation.validationId, status: validation.status, questionCatalogCount: validation.questionCatalogCount, exampleAnswerCount: validation.exampleAnswerCount, readyForSubmission: false }, null, 2));
