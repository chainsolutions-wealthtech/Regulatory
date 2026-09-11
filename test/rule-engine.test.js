import test from "node:test";
import assert from "node:assert/strict";
import { runValidation } from "../src/core/rule-engine.js";

function validBase() {
  return {
    fund: { legal_name: "FCP Test" },
    manager: { legal_name: "SGO Test" },
    depositary: { legal_name: "Banque Test" },
    share_classes: [{ class_id: "MAIN", currency: "XOF", income_policy: "CAPITALIZATION", initial_nav: 100000 }],
    investment: {
      asset_ranges: [{ asset_class: "CASH", minimum_percent: 0, maximum_percent: 100 }],
    },
    valuation: {
      methods: [{ asset_class: "CASH", method: "Valeur nominale" }],
    },
    redemption: { allowed: false },
    fees: [],
    tax: { source_reference: "SOURCE_TEST" },
    economic_information: { review_status: "REVIEWED" },
  };
}

test("une fourchette invalide crée un blocage", () => {
  const data = validBase();
  data.investment.asset_ranges[0] = { asset_class: "CASH", minimum_percent: 90, maximum_percent: 20 };
  const result = runValidation(data);
  assert.equal(result.status, "VALIDATION_FAILED");
  assert.ok(result.findings.some((finding) => finding.rule_id === "RULE_ASSET_RANGE_VALIDITY"));
});

test("un cas minimal cohérent ne crée aucun blocage", () => {
  const result = runValidation(validBase());
  assert.equal(result.counts.BLOCKER, 0);
  assert.equal(result.ready_for_compliance_review, true);
  assert.equal(result.ready_for_submission, false);
});


function assertFinding(data, ruleId) {
  const result = runValidation(data);
  assert.ok(result.findings.some((finding) => finding.rule_id === ruleId), `Finding attendu : ${ruleId}`);
  assert.equal(result.ready_for_submission, false);
  return result;
}

test("les trois statuts de validation restent distincts", () => {
  const passed = runValidation(validBase());
  assert.equal(passed.status, "PASSED");

  const warningData = validBase();
  delete warningData.tax.source_reference;
  const warning = runValidation(warningData);
  assert.equal(warning.status, "PASSED_WITH_WARNINGS");
  assert.equal(warning.counts.BLOCKER, 0);
  assert.ok(warning.counts.WARNING > 0);
  assert.equal(warning.ready_for_compliance_review, true);
  assert.equal(warning.ready_for_submission, false);

  const failedData = validBase();
  failedData.fund.legal_name = "";
  const failed = runValidation(failedData);
  assert.equal(failed.status, "VALIDATION_FAILED");
  assert.ok(failed.counts.BLOCKER > 0);
  assert.equal(failed.ready_for_compliance_review, false);
  assert.equal(failed.ready_for_submission, false);
});

test("les identités et classes obligatoires déclenchent leurs bloqueurs", () => {
  for (const [mutate, ruleId] of [
    [(data) => { data.fund.legal_name = ""; }, "RULE_FUND_NAME_REQUIRED"],
    [(data) => { data.manager.legal_name = ""; }, "RULE_MANAGER_REQUIRED"],
    [(data) => { data.depositary.legal_name = ""; }, "RULE_DEPOSITARY_REQUIRED"],
    [(data) => { data.share_classes = []; }, "RULE_AT_LEAST_ONE_SHARE_CLASS"],
    [(data) => { data.share_classes[0].currency = ""; }, "RULE_SHARE_CLASS_CORE_FIELDS"],
  ]) {
    const data = validBase();
    mutate(data);
    assertFinding(data, ruleId);
  }
});

test("les branches d'allocation et de valorisation sont contrôlées", () => {
  const missingRanges = validBase();
  delete missingRanges.investment.asset_ranges;
  assertFinding(missingRanges, "RULE_ASSET_RANGE_VALIDITY");

  const invalidRange = validBase();
  invalidRange.investment.asset_ranges[0].minimum_percent = -1;
  assertFinding(invalidRange, "RULE_ASSET_RANGE_VALIDITY");

  const impossibleMinimums = validBase();
  impossibleMinimums.investment.asset_ranges = [
    { asset_class: "CASH", minimum_percent: 60, maximum_percent: 100 },
    { asset_class: "EQUITIES", minimum_percent: 50, maximum_percent: 100 },
  ];
  impossibleMinimums.valuation.methods = [
    { asset_class: "CASH", method: "Valeur nominale" },
    { asset_class: "EQUITIES", method: "Cours de marché" },
  ];
  assertFinding(impossibleMinimums, "RULE_SUM_MINIMUMS_POSSIBLE");

  const missingValuation = validBase();
  missingValuation.investment.asset_ranges = [
    { asset_class: "EQUITIES", minimum_percent: 0, maximum_percent: 100 },
  ];
  assertFinding(missingValuation, "RULE_VALUATION_METHOD_PER_USED_ASSET");
});

test("les branches rachat et suspension exigent les détails uniquement lorsqu'elles sont activées", () => {
  const redemption = validBase();
  redemption.redemption.allowed = true;
  assertFinding(redemption, "RULE_REDEMPTION_PROCESS_COMPLETE");

  redemption.redemption.cutoff = { display: "12:00" };
  redemption.redemption.execution_nav = { description: "Prochaine VL" };
  redemption.redemption.settlement_days = { standard_business_days: 3 };
  assert.equal(
    runValidation(redemption).findings.some((finding) => finding.rule_id === "RULE_REDEMPTION_PROCESS_COMPLETE"),
    false,
  );

  const suspension = validBase();
  suspension.redemption.suspension = { allowed: true };
  assertFinding(suspension, "RULE_SUSPENSION_CIRCUMSTANCES_REQUIRED");

  suspension.redemption.suspension = {
    allowed: true,
    circumstances: "Cas exceptionnels",
    notification: "Avis aux porteurs",
  };
  assert.equal(
    runValidation(suspension).findings.some((finding) => finding.rule_id === "RULE_SUSPENSION_CIRCUMSTANCES_REQUIRED"),
    false,
  );
});

test("les frais couvrent champs obligatoires et taux conditionnels", () => {
  const incomplete = validBase();
  incomplete.fees = [{}];
  assertFinding(incomplete, "RULE_FEE_BASIS_BENEFICIARY_PAYER_COMPLETE");

  const percentage = validBase();
  percentage.fees = [{
    label: "Gestion",
    payer_type: "FUND",
    beneficiary: "MANAGER",
    basis: "NAV",
    rate_type: "PERCENTAGE",
  }];
  assertFinding(percentage, "RULE_FEE_BASIS_BENEFICIARY_PAYER_COMPLETE");

  const perMille = validBase();
  perMille.fees = [{
    label: "Dépositaire",
    payer_type: "FUND",
    beneficiary: "DEPOSITARY",
    basis: "NAV",
    rate_type: "PER_MILLE",
  }];
  assertFinding(perMille, "RULE_FEE_BASIS_BENEFICIARY_PAYER_COMPLETE");
});

test("les avertissements fiscal et juridique restent non bloquants", () => {
  const tax = validBase();
  delete tax.tax.source_reference;
  const taxResult = assertFinding(tax, "RULE_TAX_SOURCE_REQUIRED");
  assert.equal(taxResult.counts.BLOCKER, 0);

  const economic = validBase();
  economic.economic_information.review_status = "LEGAL_REVIEW_REQUIRED";
  const economicResult = assertFinding(economic, "RULE_ECONOMIC_INFORMATION_REVIEW");
  assert.equal(economicResult.counts.BLOCKER, 0);
});
