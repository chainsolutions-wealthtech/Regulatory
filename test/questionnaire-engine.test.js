import test from "node:test";
import assert from "node:assert/strict";
import { applyQuestionnaireAnswers } from "../src/core/questionnaire-engine.js";

test("une réponse ne peut écrire qu'un champ autorisé", () => {
  const questionCatalog = [{
    question_id: "Q_TEST",
    requirement_id: "REQ_TEST",
    canonical_fields: ["fund.legal_name"],
  }];

  assert.throws(
    () => applyQuestionnaireAnswers({
      seedData: {},
      questionCatalog,
      answers: [{
        question_id: "Q_TEST",
        field_values: { "manager.legal_name": "Interdit" },
      }],
    }),
    /n'est pas autorisé/,
  );
});

test("une réponse autorisée alimente le modèle canonique", () => {
  const result = applyQuestionnaireAnswers({
    seedData: {},
    questionCatalog: [{
      question_id: "Q_TEST",
      requirement_id: "REQ_TEST",
      canonical_fields: ["fund.legal_name"],
    }],
    answers: [{
      question_id: "Q_TEST",
      field_values: { "fund.legal_name": "FCP Test" },
    }],
  });

  assert.equal(result.data.fund.legal_name, "FCP Test");
  assert.equal(result.answerLog[0].requirement_id, "REQ_TEST");
});
