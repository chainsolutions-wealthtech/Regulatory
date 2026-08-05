import { deepMerge, getAtPath, normalizePath, setAtPath } from "./object-path.js";

const EXECUTABLE_FIELD_EXTENSIONS = {
  Q_REDEMPTION_ALLOWED: ["redemption.allowed"],
  Q_FINANCIAL_OBJECTIVE: ["investment.objective.summary"],
  Q_TARGET_INVESTOR_PROFILE: ["target_investor.summary"],
};

const VISIBILITY_RULES = {
  Q_REDEMPTION_SUSPENSION_ALLOWED: {
    path: "redemption.allowed",
    operator: "equals",
    value: true,
  },
  Q_ADVISER_IMPORTANT_CLAUSES: {
    path: "external_adviser.enabled",
    operator: "equals",
    value: true,
  },
  Q_ADVISER_OTHER_ACTIVITIES: {
    path: "external_adviser.enabled",
    operator: "equals",
    value: true,
  },
};

/**
 * Transforme les lignes des matrices réglementaires en catalogue de questions exécutable.
 *
 * @param {Array<Record<string, any>>} matrixRows
 */
export function buildQuestionCatalog(matrixRows) {
  return matrixRows
    .filter((row) => row.question_id && row.question_type !== "SYSTEM")
    .map((row) => ({
      question_id: row.question_id,
      requirement_id: row.requirement_id,
      type: row.question_type,
      label: row.question_label,
      canonical_fields: row.canonical_fields.map(normalizePath),
      options: row.options,
      effects: row.effects,
      controls: row.controls,
      evidence_types: row.evidence_types,
      output_section_id: row.output_section_id,
      review_roles: row.review_roles,
      implementation_status: row.status,
      source: {
        file: row.matrix_file,
        line: row.matrix_line,
      },
    }));
}

/**
 * Applique les réponses contrôlées à un snapshot canonique.
 * Une réponse ne peut renseigner que les champs autorisés par la matrice de sa question.
 *
 * @param {{seedData: Record<string, unknown>, answers: Array<any>, questionCatalog: Array<any>}} input
 */
export function applyQuestionnaireAnswers({ seedData, answers, questionCatalog }) {
  const data = deepMerge({}, seedData);
  const questionsById = new Map(questionCatalog.map((question) => [question.question_id, question]));
  const answerLog = [];

  for (const answer of answers) {
    const question = questionsById.get(answer.question_id);
    if (!question) {
      throw new Error(`Question inconnue : ${answer.question_id}`);
    }

    const fieldValues = answer.field_values ?? {};
    const allowed = new Set([
      ...question.canonical_fields,
      ...(EXECUTABLE_FIELD_EXTENSIONS[answer.question_id] ?? []),
    ]);
    for (const [fieldPath, value] of Object.entries(fieldValues)) {
      const normalized = normalizePath(fieldPath);
      if (!isAllowedPath(normalized, allowed)) {
        throw new Error(
          `Le champ ${fieldPath} n'est pas autorisé pour la question ${answer.question_id}.`,
        );
      }
      setAtPath(data, normalized, value);
    }

    answerLog.push({
      question_id: answer.question_id,
      requirement_id: question.requirement_id,
      field_paths: Object.keys(fieldValues).map(normalizePath),
      source: answer.source ?? null,
      review_status: answer.review_status ?? "PENDING_CONFIRMATION",
    });
  }

  return { data, answerLog };
}

/**
 * Retourne les questions visibles pour le snapshot courant.
 *
 * @param {Array<any>} questionCatalog
 * @param {Record<string, unknown>} data
 */
export function listApplicableQuestions(questionCatalog, data) {
  return questionCatalog.filter((question) => {
    const rule = VISIBILITY_RULES[question.question_id];
    return rule ? evaluateVisibilityCondition(rule, data) : true;
  });
}

/**
 * @param {string} path
 * @param {Set<string>} allowed
 */
function isAllowedPath(path, allowed) {
  for (const candidate of allowed) {
    if (path === candidate || path.startsWith(`${candidate}.`) || candidate.startsWith(`${path}.`)) {
      return true;
    }
  }
  return false;
}

/** @param {{path: string, operator: string, value: unknown}} condition @param {Record<string, unknown>} data */
function evaluateVisibilityCondition(condition, data) {
  const actual = getAtPath(data, condition.path);
  if (condition.operator === "equals") return actual === condition.value;
  if (condition.operator === "not_equals") return actual !== condition.value;
  throw new Error(`Opérateur de visibilité non pris en charge : ${condition.operator}`);
}
