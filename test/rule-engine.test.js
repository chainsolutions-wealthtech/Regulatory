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
