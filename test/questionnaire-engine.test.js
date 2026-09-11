import test from "node:test";
import assert from "node:assert/strict";
import {
  applyQuestionnaireAnswers,
  buildQuestionCatalog,
  listApplicableQuestions,
} from "../src/core/questionnaire-engine.js";

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


test("le catalogue ignore les lignes SYSTEM et normalise les chemins", () => {
  const catalog = buildQuestionCatalog([
    {
      question_id: "Q_VISIBLE",
      requirement_id: "REQ_VISIBLE",
      question_type: "TEXT",
      question_label: "Nom",
      canonical_fields: ["fund.legal_name[]"],
      options: [],
      effects: ["UPDATE"],
      controls: ["REQUIRED"],
      evidence_types: [],
      output_section_id: "SECTION_1",
      review_roles: ["PRODUCT"],
      status: "IMPLEMENTED",
      matrix_file: "fixture.csv",
      matrix_line: 2,
    },
    {
      question_id: "Q_SYSTEM",
      requirement_id: "REQ_SYSTEM",
      question_type: "SYSTEM",
      question_label: "Système",
      canonical_fields: ["system.value"],
      options: [],
      effects: [],
      controls: [],
      evidence_types: [],
      output_section_id: "SECTION_1",
      review_roles: [],
      status: "IMPLEMENTED",
      matrix_file: "fixture.csv",
      matrix_line: 3,
    },
  ]);

  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].question_id, "Q_VISIBLE");
  assert.deepEqual(catalog[0].canonical_fields, ["fund.legal_name"]);
  assert.deepEqual(catalog[0].source, { file: "fixture.csv", line: 2 });
});

test("une question inconnue est rejetée explicitement", () => {
  assert.throws(
    () => applyQuestionnaireAnswers({
      seedData: {},
      questionCatalog: [],
      answers: [{ question_id: "Q_UNKNOWN", field_values: {} }],
    }),
    /Question inconnue/,
  );
});

test("un champ parent ne peut pas contourner une autorisation limitée à un enfant", () => {
  assert.throws(
    () => applyQuestionnaireAnswers({
      seedData: { fund: { classification: "ORIGINAL" } },
      questionCatalog: [{
        question_id: "Q_TEST",
        requirement_id: "REQ_TEST",
        canonical_fields: ["fund.legal_name"],
      }],
      answers: [{
        question_id: "Q_TEST",
        field_values: {
          fund: { legal_name: "Injecté", classification: "ECRASEMENT_INTERDIT" },
        },
      }],
    }),
    /n'est pas autorisé/,
  );
});

test("un descendant reste autorisé lorsqu'un objet canonique parent est explicitement permis", () => {
  const result = applyQuestionnaireAnswers({
    seedData: {},
    questionCatalog: [{
      question_id: "Q_TEST",
      requirement_id: "REQ_TEST",
      canonical_fields: ["fund"],
    }],
    answers: [{
      question_id: "Q_TEST",
      field_values: { "fund.legal_name": "FCP Descendant" },
    }],
  });
  assert.equal(result.data.fund.legal_name, "FCP Descendant");
});

test("les extensions exécutables restent strictement limitées à leurs champs déclarés", () => {
  const result = applyQuestionnaireAnswers({
    seedData: {},
    questionCatalog: [{
      question_id: "Q_REDEMPTION_ALLOWED",
      requirement_id: "REQ_REDEMPTION",
      canonical_fields: [],
    }],
    answers: [{
      question_id: "Q_REDEMPTION_ALLOWED",
      field_values: { "redemption.allowed": false },
      source: { type: "TEST" },
      review_status: "CONFIRMED",
    }],
  });
  assert.equal(result.data.redemption.allowed, false);
  assert.equal(result.answerLog[0].review_status, "CONFIRMED");
  assert.deepEqual(result.answerLog[0].source, { type: "TEST" });
});

test("les règles de visibilité rachats et conseiller couvrent états masqué et visible", () => {
  const catalog = [
    { question_id: "Q_ALWAYS" },
    { question_id: "Q_REDEMPTION_SUSPENSION_ALLOWED" },
    { question_id: "Q_ADVISER_IMPORTANT_CLAUSES" },
    { question_id: "Q_ADVISER_OTHER_ACTIVITIES" },
  ];

  assert.deepEqual(
    listApplicableQuestions(catalog, {
      redemption: { allowed: false },
      external_adviser: { enabled: false },
    }).map((q) => q.question_id),
    ["Q_ALWAYS"],
  );

  assert.deepEqual(
    listApplicableQuestions(catalog, {
      redemption: { allowed: true },
      external_adviser: { enabled: true },
    }).map((q) => q.question_id),
    [
      "Q_ALWAYS",
      "Q_REDEMPTION_SUSPENSION_ALLOWED",
      "Q_ADVISER_IMPORTANT_CLAUSES",
      "Q_ADVISER_OTHER_ACTIVITIES",
    ],
  );
});


test("les racines structurées historiques sont autorisées uniquement par extension explicite", () => {
  const result = applyQuestionnaireAnswers({
    seedData: {},
    questionCatalog: [
      {
        question_id: "Q_TRANSACTION_FEES",
        requirement_id: "REQ_FEES",
        canonical_fields: ["fees.transaction"],
      },
      {
        question_id: "Q_HOME_STATE_ARRANGEMENTS",
        requirement_id: "REQ_COUNTRIES",
        canonical_fields: ["distribution_countries.country_code"],
      },
    ],
    answers: [
      {
        question_id: "Q_TRANSACTION_FEES",
        field_values: { fees: [{ label: "Frais test" }] },
      },
      {
        question_id: "Q_HOME_STATE_ARRANGEMENTS",
        field_values: { distribution_countries: [{ country_code: "CI" }] },
      },
    ],
  });

  assert.deepEqual(result.data.fees, [{ label: "Frais test" }]);
  assert.deepEqual(result.data.distribution_countries, [{ country_code: "CI" }]);
});
