import {
  CATALOG_METADATA,
  KNOWN_QUESTION_IDS,
  QUESTION_GROUPS,
  QUESTIONS,
} from "./regulatory-catalog";
import type {
  ProjectAnswer,
  ProspectusProject,
  ProspectusQuestion,
  ProjectSummary,
  QuestionGroup,
  QuestionGroupWithQuestions,
  ValidationFinding,
} from "./types";

const LEGACY_QUESTION_ALIASES: Record<string, string> = {
  "project.operation": "APP_PROJECT_OPERATION",
  "project.category": "APP_FUND_CATEGORY",
  "project.country": "APP_HOME_STATE",
  "manager.confirm": "APP_MANAGER_PROFILE_CONFIRMED",
  "manager.legalName": "Q_SELECT_MANAGEMENT_COMPANY",
  "manager.approval": "APP_MANAGER_APPROVAL_NUMBER",
  "fund.legalName": "Q_FUND_LEGAL_NAME",
  "fund.constitutionDate": "Q_FUND_CONSTITUTION_DATE",
  "fund.currency": "APP_FUND_CURRENCY",
  "shares.multiple": "Q_SHARE_CLASSES_COUNT",
  "shares.initialNav": "APP_INITIAL_NAV",
  "actors.depositary": "Q_SELECT_DEPOSITARY",
  "actors.auditor": "Q_ACCOUNTING_CONTROL_PERSONS",
  "actors.delegate": "Q_EXTERNAL_ADVISER_PAID_BY_FUND",
  "objective.horizon": "Q_TARGET_INVESTOR_PROFILE",
  "objective.benchmark": "APP_BENCHMARK_ENABLED",
  "objective.benchmarkName": "APP_BENCHMARK_REFERENCE",
  "risks.confirm": "APP_RISK_CONFIRMATION",
  "risks.specific": "APP_RISK_SPECIFIC",
  "nav.frequency": "Q_NAV_FREQUENCY",
  "nav.publication": "Q_PRICE_PUBLICATION",
  "subscriptions.gate": "APP_REDEMPTION_GATE_ENABLED",
  "subscriptions.gateThreshold": "APP_REDEMPTION_GATE_THRESHOLD",
  "tax.review": "APP_TAX_REVIEW_CONFIRMED",
  "distribution.countries": "Q_MARKETING_COUNTRIES",
  "performance.available": "Q_HISTORICAL_PERFORMANCE_AVAILABLE",
  "evidence.approvals": "APP_EVIDENCE_APPROVALS",
  "review.owner": "APP_REVIEW_OWNER",
};

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
  return QUESTIONS.filter(
    (question) => question.interactive !== false && isQuestionVisible(question, project.answers),
  );
}

export function getQuestionsByGroup(project: ProspectusProject): QuestionGroupWithQuestions[] {
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

  for (const question of visible.filter((item) => item.type === "PERCENTAGE")) {
    const value = toNumber(getAnswerValue(project, question.id));
    if (value !== null && (value < 0 || value > 100)) {
      findings.push({
        id: `PERCENTAGE_OUT_OF_RANGE:${question.id}`,
        severity: "BLOCKER",
        title: "Pourcentage hors limites",
        message: "Un pourcentage doit être compris entre 0 et 100.",
        questionIds: [question.id],
        remediation: "Saisir une valeur comprise entre 0 et 100.",
      });
    }
  }

  if (String(getAnswerValue(project, "APP_TAX_REVIEW_CONFIRMED")) !== "true") {
    findings.push({
      id: "TAX_REVIEW_PENDING",
      severity: "WARNING",
      title: "Revue fiscale requise",
      message: "La fiscalité ne peut pas être considérée comme validée sans revue spécialisée.",
      questionIds: ["Q_FUND_TAX_REGIME", "APP_TAX_REVIEW_CONFIRMED"],
      remediation: "Faire examiner les sources et les mentions fiscales par le rôle habilité.",
    });
  }

  if (String(getAnswerValue(project, "APP_MANAGER_PROFILE_CONFIRMED")) !== "true") {
    findings.push({
      id: "MANAGER_PROFILE_UNCONFIRMED",
      severity: "WARNING",
      title: "Profil SGO à confirmer",
      message: "Les informations institutionnelles préremplies ne sont pas encore confirmées.",
      questionIds: [
        "APP_MANAGER_PROFILE_CONFIRMED",
        "Q_SELECT_MANAGEMENT_COMPANY",
        "APP_MANAGER_APPROVAL_NUMBER",
      ],
      remediation: "Rapprocher les données du registre officiel et des pièces de la société.",
    });
  }

  const techniques = getAnswerValue(project, "Q_TECHNIQUES_INSTRUMENTS");
  if (containsDerivativeReference(techniques)) {
    findings.push({
      id: "DERIVATIVES_LEGAL_REVIEW_REQUIRED",
      severity: "WARNING",
      title: "Dérivés sous revue renforcée",
      message: "L’usage de dérivés exige le mapping complet des limites, contreparties et méthodes de calcul.",
      questionIds: ["Q_TECHNIQUES_INSTRUMENTS"],
      remediation: "Compléter le pack Instruction 66 et faire valider la stratégie par les risques et la conformité.",
    });
  }

  const unknownAnswerIds = Object.keys(project.answers).filter((questionId) => !KNOWN_QUESTION_IDS.has(questionId));
  if (unknownAnswerIds.length > 0) {
    findings.push({
      id: "LEGACY_ANSWERS_REQUIRE_REVIEW",
      severity: "INFO",
      title: "Réponses historiques conservées",
      message: `${unknownAnswerIds.length} réponse(s) issue(s) de l’ancien catalogue sont conservées sans être supprimées.`,
      questionIds: unknownAnswerIds,
      remediation: "Vérifier leur reprise dans les questions canoniques avant de les archiver.",
    });
  }

  if (project.catalog?.digest && project.catalog.digest !== CATALOG_METADATA.catalogDigest) {
    findings.push({
      id: "CATALOG_VERSION_CHANGED",
      severity: "WARNING",
      title: "Catalogue réglementaire mis à jour",
      message: "Le projet a été créé avec une autre empreinte du catalogue réglementaire.",
      questionIds: [],
      remediation: "Relancer l’analyse d’impact et confirmer les nouvelles questions applicables.",
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
    Object.entries(project.answers).filter(
      ([questionId]) => !KNOWN_QUESTION_IDS.has(questionId) || visibleIds.has(questionId),
    ),
  );
}

export function migrateProjectToCurrentCatalog(project: ProspectusProject): ProspectusProject {
  const migrated = structuredClone(project);
  for (const [legacyId, canonicalId] of Object.entries(LEGACY_QUESTION_ALIASES)) {
    const legacyAnswer = migrated.answers[legacyId];
    if (!legacyAnswer || migrated.answers[canonicalId]) continue;
    migrated.answers[canonicalId] = {
      ...legacyAnswer,
      questionId: canonicalId,
      source: legacyAnswer.source === "USER" ? "USER" : "DERIVED",
      reviewStatus: "PENDING_REVIEW",
    };
  }
  migrated.catalog ??= {
    schemaVersion: CATALOG_METADATA.schemaVersion,
    digest: CATALOG_METADATA.catalogDigest,
    requirementCount: CATALOG_METADATA.requirementCount,
    interactiveQuestionCount: CATALOG_METADATA.interactiveQuestionCount,
  };
  return migrated;
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

function containsDerivativeReference(value: unknown): boolean {
  const values = Array.isArray(value) ? value.map(String) : [String(value ?? "")];
  return values.some((item) => /DERIV|DÉRIV/i.test(item));
}
