import { QUESTION_GROUPS, QUESTIONS } from "./question-catalog";
import type {
  ProjectAnswer,
  ProspectusProject,
  ProspectusQuestion,
  ProjectSummary,
  QuestionGroup,
  ValidationFinding,
} from "./types";

export function getAnswerValue(project: ProspectusProject, questionId: string): unknown {
  return project.answers[questionId]?.value;
}

export function isQuestionVisible(
  question: ProspectusQuestion,
  answers: Record<string, ProjectAnswer>,
): boolean {
  const condition = question.displayCondition;
  if (!condition) return true;
  const actual = answers[condition.questionId]?.value;
  if (condition.operator === "EQUALS") return String(actual) === String(condition.value);
  if (condition.operator === "NOT_EQUALS") return String(actual) !== String(condition.value);
  if (condition.operator === "INCLUDES") {
    return Array.isArray(actual) && actual.map(String).includes(String(condition.value));
  }
  return false;
}

export function getVisibleQuestions(project: ProspectusProject): ProspectusQuestion[] {
  return QUESTIONS.filter((question) => isQuestionVisible(question, project.answers));
}

export function getQuestionsByGroup(
  project: ProspectusProject,
): Array<QuestionGroup & { questions: ProspectusQuestion[] }> {
  const visible = getVisibleQuestions(project);
  return QUESTION_GROUPS.map((group) => ({
    ...group,
    questions: visible
      .filter((question) => question.groupId === group.id)
      .toSorted((left, right) => left.sequence - right.sequence),
  })).filter((group) => group.questions.length > 0);
}

export function calculateProgress(project: ProspectusProject): number {
  const visible = getVisibleQuestions(project).filter((question) => question.required);
  if (visible.length === 0) return 0;
  const completed = visible.filter((question) => hasAnswer(project.answers[question.id]?.value)).length;
  return Math.round((completed / visible.length) * 100);
}

export function validateProject(project: ProspectusProject): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const visible = getVisibleQuestions(project);
  const unanswered = visible.filter(
    (question) => question.required && !hasAnswer(project.answers[question.id]?.value),
  );

  if (unanswered.length > 0) {
    findings.push({
      id: "REQUIRED_ANSWERS_MISSING",
      severity: "BLOCKER",
      title: "Réponses obligatoires manquantes",
      message: `${unanswered.length} réponse(s) obligatoire(s) doivent encore être renseignées.`,
      questionIds: unanswered.map((question) => question.id),
      remediation: "Compléter les questions obligatoires visibles dans le parcours.",
    });
  }

  const debtMin = toNumber(getAnswerValue(project, "portfolio.debtMin"));
  const debtMax = toNumber(getAnswerValue(project, "portfolio.debtMax"));
  if (debtMin !== null && debtMax !== null && debtMin > debtMax) {
    findings.push({
      id: "DEBT_RANGE_INCONSISTENT",
      severity: "BLOCKER",
      title: "Fourchette obligataire incohérente",
      message: "L’exposition minimale aux titres de créance dépasse l’exposition maximale.",
      questionIds: ["portfolio.debtMin", "portfolio.debtMax"],
      remediation: "Corriger la fourchette afin que le minimum soit inférieur ou égal au maximum.",
    });
  }

  for (const questionId of [
    "portfolio.equityMax",
    "portfolio.debtMin",
    "portfolio.debtMax",
    "subscriptions.gateThreshold",
    "fees.subscription",
    "fees.management",
  ]) {
    const value = toNumber(getAnswerValue(project, questionId));
    if (value !== null && (value < 0 || value > 100)) {
      findings.push({
        id: `PERCENTAGE_OUT_OF_RANGE:${questionId}`,
        severity: "BLOCKER",
        title: "Pourcentage hors limites",
        message: "Un pourcentage doit être compris entre 0 et 100.",
        questionIds: [questionId],
        remediation: "Saisir une valeur comprise entre 0 et 100.",
      });
    }
  }

  if (String(getAnswerValue(project, "tax.review")) !== "true") {
    findings.push({
      id: "TAX_REVIEW_PENDING",
      severity: "WARNING",
      title: "Revue fiscale requise",
      message: "La fiscalité ne peut pas être considérée comme validée sans revue spécialisée.",
      questionIds: ["tax.source", "tax.review"],
      remediation: "Faire examiner les sources et les mentions fiscales par le rôle habilité.",
    });
  }

  if (String(getAnswerValue(project, "manager.confirm")) !== "true") {
    findings.push({
      id: "MANAGER_PROFILE_UNCONFIRMED",
      severity: "WARNING",
      title: "Profil SGO à confirmer",
      message: "Les informations institutionnelles préremplies ne sont pas encore confirmées.",
      questionIds: ["manager.confirm", "manager.legalName", "manager.approval"],
      remediation: "Rapprocher les données du registre officiel et des pièces de la société.",
    });
  }

  if (String(getAnswerValue(project, "portfolio.derivatives")) === "true") {
    findings.push({
      id: "DERIVATIVES_LEGAL_REVIEW_REQUIRED",
      severity: "WARNING",
      title: "Dérivés sous revue renforcée",
      message: "L’usage de dérivés exige le mapping complet des limites, contreparties et méthodes de calcul.",
      questionIds: ["portfolio.derivatives", "portfolio.derivativePurpose"],
      remediation: "Compléter le pack Instruction 66 et faire valider la stratégie par les risques et la conformité.",
    });
  }

  return findings;
}

export function toProjectSummary(project: ProspectusProject): ProjectSummary {
  const findings = validateProject(project);
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    updatedAt: project.updatedAt,
    category: project.category,
    coverage: project.coverage,
    progress: calculateProgress(project),
    blockers: findings.filter((finding) => finding.severity === "BLOCKER").length,
    warnings: findings.filter((finding) => finding.severity === "WARNING").length,
  };
}

export function getNextIncompleteGroup(project: ProspectusProject): QuestionGroup | null {
  const groups = getQuestionsByGroup(project);
  for (const group of groups) {
    const incomplete = group.questions.some(
      (question) => question.required && !hasAnswer(project.answers[question.id]?.value),
    );
    if (incomplete) return group;
  }
  return null;
}

export function sanitizeAnswersAfterChange(
  project: ProspectusProject,
): Record<string, ProjectAnswer> {
  const visibleIds = new Set(getVisibleQuestions(project).map((question) => question.id));
  return Object.fromEntries(
    Object.entries(project.answers).filter(([questionId]) => visibleIds.has(questionId)),
  );
}

function hasAnswer(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
