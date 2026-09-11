import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCondition } from "../src/core/condition-engine.js";

const data = {
  fund: { legal_name: "FCP Test", active: true, score: 7, empty: "", tags: ["BOND", "XOF"], list: [] },
};

test("les combinateurs de conditions couvrent all, any et not", () => {
  assert.equal(evaluateCondition(null, data), true);
  assert.equal(evaluateCondition({ all: [
    { path: "fund.active", operator: "equals", value: true },
    { path: "fund.score", operator: "greater_than", value: 3 },
  ] }, data), true);
  assert.equal(evaluateCondition({ all: [
    { path: "fund.active", operator: "equals", value: true },
    { path: "fund.score", operator: "greater_than", value: 10 },
  ] }, data), false);
  assert.equal(evaluateCondition({ any: [
    { path: "fund.active", operator: "equals", value: false },
    { path: "fund.tags", operator: "includes", value: "XOF" },
  ] }, data), true);
  assert.equal(evaluateCondition({ any: [
    { path: "fund.active", operator: "equals", value: false },
    { path: "fund.tags", operator: "includes", value: "EQUITY" },
  ] }, data), false);
  assert.equal(evaluateCondition({ not: { path: "fund.active", operator: "equals", value: false } }, data), true);
});

test("tous les opérateurs conditionnels déterministes sont exercés", () => {
  assert.equal(evaluateCondition({ path: "fund.legal_name", operator: "equals", value: "FCP Test" }, data), true);
  assert.equal(evaluateCondition({ path: "fund.legal_name", operator: "not_equals", value: "Autre" }, data), true);
  assert.equal(evaluateCondition({ path: "fund.legal_name", operator: "exists" }, data), true);
  assert.equal(evaluateCondition({ path: "fund.missing", operator: "exists" }, data), false);
  assert.equal(evaluateCondition({ path: "fund.empty", operator: "exists" }, data), false);
  assert.equal(evaluateCondition({ path: "fund.tags", operator: "not_empty" }, data), true);
  assert.equal(evaluateCondition({ path: "fund.list", operator: "not_empty" }, data), false);
  assert.equal(evaluateCondition({ path: "fund.tags", operator: "includes", value: "BOND" }, data), true);
  assert.equal(evaluateCondition({ path: "fund.legal_name", operator: "includes", value: "FCP" }, data), false);
  assert.equal(evaluateCondition({ path: "fund.score", operator: "greater_than", value: 6 }, data), true);
  assert.equal(evaluateCondition({ path: "fund.legal_name", operator: "greater_than", value: 1 }, data), false);
});

test("un opérateur inconnu échoue explicitement", () => {
  assert.throws(
    () => evaluateCondition({ path: "fund.active", operator: "unsupported", value: true }, data),
    /Opérateur conditionnel non pris en charge/,
  );
});
