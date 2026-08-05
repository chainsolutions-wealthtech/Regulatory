import {
  CATALOG_METADATA,
  KNOWN_QUESTION_IDS,
  QUESTION_GROUPS,
  QUESTIONS,
} from "./regulatory-catalog";
import {
  ASSET_RANGE_QUESTION_ID,
  COUNTRY_ARRANGEMENT_QUESTION_ID,
  EVIDENCE_COLLECTION_QUESTION_ID,
  GOVERNANCE_PARTY_QUESTION_ID,
  REMUNERATION_QUESTION_ID,
  RISK_FACTOR_QUESTION_ID,
  SERVICE_PROVIDER_QUESTION_ID,
  STRUCTURED_QUESTION_TYPES,
  TRANSACTION_FEE_QUESTION_ID,
  VALUATION_METHOD_QUESTION_ID,
  validateStructuredQuestionValue,
} from "./structured-answers";
import type {
  AssetClassRangeInput,
  CountryArrangementInput,
  EvidenceInput,
  PartyInput,
  ProjectAnswer,
  ProspectusProject,
  ProspectusQuestion,
  ProjectSummary,
  QuestionGroup,
  QuestionGroupWithQuestions,
  ValidationFinding,
  ValuationMethodInput,
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
  "risks.specific": RISK_FACTOR_QUESTION_ID,
  APP_RISK_SPECIFIC: RISK_FACTOR_QUESTION_ID,
  "nav.frequency": "Q_NAV_FREQUENCY",
  "nav.publication": "Q_PRICE_PUBLICATION",
  "subscriptions.gate": "APP_REDEMPTION_GATE_ENABLED",
  "subscriptions.gateThreshold": "APP_REDEMPTION_GATE_THRESHOLD",
  "tax.review": "APP_TAX_REVIEW_CONFIRMED",
  "distribution.countries": "Q_MARKETING_COUNTRIES",
  "performance.available": "Q_HISTORICAL_PERFORMANCE_AVAILABLE",
  "evidence.approvals": EVIDENCE_COLLECTION_QUESTION_ID,
  APP_EVIDENCE_APPROVALS: EVIDENCE_COLLECTION_QUESTION_ID,
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

  for (const questionId of Object.keys(STRUCTURED_QUESTION_TYPES)) {
    const answer = project.answers[questionId];
    if (!answer) continue;
    try {
      validateStructuredQuestionValue(questionId, answer.value);
    } catch (error) {
      findings.push({
        id: `STRUCTURED_COLLECTION_INVALID:${questionId}`,
        severity: "BLOCKER",
        title: "Collection structurée invalide",
        message: error instanceof Error ? error.message : "Une collection structurée est invalide.",
        questionIds: [questionId],
        remediation: "Corriger les lignes signalées puis enregistrer de nouveau la collection.",
      });
    }
  }

  addCrossCollectionFindings(project, findings);

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

function addCrossCollectionFindings(
  project: ProspectusProject,
  findings: ValidationFinding[],
): void {
  const ranges = arrayAnswer<AssetClassRangeInput>(project, ASSET_RANGE_QUESTION_ID);
  const methods = arrayAnswer<ValuationMethodInput>(project, VALUATION_METHOD_QUESTION_ID);
  if (ranges.length > 0 && methods.length > 0) {
    const methodAssetClasses = new Set(methods.map((item) => item.asset_class));
    const missingMethods = ranges
      .filter((item) => item.maximum_percent > 0 && !methodAssetClasses.has(item.asset_class))
      .map((item) => item.asset_class);
    if (missingMethods.length > 0) {
      findings.push({
        id: "VALUATION_METHOD_MISSING_FOR_ASSET_CLASS",
        severity: "BLOCKER",
        title: "Méthode de valorisation manquante",
        message: `Aucune méthode n’est déclarée pour : ${missingMethods.join(", ")}.`,
        questionIds: [ASSET_RANGE_QUESTION_ID, VALUATION_METHOD_QUESTION_ID],
        remediation: "Ajouter une méthode principale et une méthode de secours pour chaque classe utilisée.",
      });
    }
  }

  const parties = arrayAnswer<PartyInput>(project, SERVICE_PROVIDER_QUESTION_ID);
  const depositarySelected = hasAnswer(getAnswerValue(project, "Q_SELECT_DEPOSITARY"));
  if (parties.length > 0 && !parties.some((item) => item.role === "DEPOSITARY") && !depositarySelected) {
    findings.push({
      id: "DEPOSITARY_NOT_IDENTIFIED",
      severity: "BLOCKER",
      title: "Dépositaire absent",
      message: "Aucun dépositaire n’est identifié dans le référentiel ou la collection des intervenants.",
      questionIds: ["Q_SELECT_DEPOSITARY", SERVICE_PROVIDER_QUESTION_ID],
      remediation: "Identifier le dépositaire et joindre l’agrément ainsi que la convention.",
    });
  }

  const countries = arrayAnswer<CountryArrangementInput>(project, COUNTRY_ARRANGEMENT_QUESTION_ID);
  const marketedCountries = arrayStringAnswer(project, "Q_MARKETING_COUNTRIES");
  const arrangedCountryCodes = new Set(countries.map((item) => item.country_code));
  const missingArrangements = marketedCountries.filter((country) => !arrangedCountryCodes.has(country));
  if (missingArrangements.length > 0) {
    findings.push({
      id: "MARKETING_COUNTRY_ARRANGEMENT_MISSING",
      severity: "BLOCKER",
      title: "Dispositif local manquant",
      message: `Les dispositifs de commercialisation manquent pour : ${missingArrangements.join(", ")}.`,
      questionIds: [COUNTRY_ARRANGEMENT_QUESTION_ID, "Q_MARKETING_COUNTRIES"],
      remediation: "Ajouter un dispositif de paiement, rachat et information pour chaque État sélectionné.",
    });
  }

  const evidence = arrayAnswer<EvidenceInput>(project, EVIDENCE_COLLECTION_QUESTION_ID);
  const pendingEvidence = evidence.filter((item) => item.verification_status !== "VERIFIED");
  if (pendingEvidence.length > 0) {
    findings.push({
      id: "EVIDENCE_VERIFICATION_PENDING",
      severity: "WARNING",
      title: "Pièces justificatives à vérifier",
      message: `${pendingEvidence.length} pièce(s) restent en attente de vérification ou ont été rejetées.`,
      questionIds: [EVIDENCE_COLLECTION_QUESTION_ID],
      remediation: "Contrôler l’émetteur, la référence, l’intégrité et la validité de chaque pièce.",
    });
  }

  const unconfirmedCollections = [
    ASSET_RANGE_QUESTION_ID,
    TRANSACTION_FEE_QUESTION_ID,
    REMUNERATION_QUESTION_ID,
    VALUATION_METHOD_QUESTION_ID,
    GOVERNANCE_PARTY_QUESTION_ID,
    SERVICE_PROVIDER_QUESTION_ID,
    RISK_FACTOR_QUESTION_ID,
    COUNTRY_ARRANGEMENT_QUESTION_ID,
  ].filter((questionId) =>
    arrayAnswer<Record<string, unknown>>(project, questionId).some(
      (item) => item.review_status && item.review_status !== "CONFIRMED",
    ),
  );
  if (unconfirmedCollections.length > 0) {
    findings.push({
      id: "STRUCTURED_COLLECTIONS_PENDING_REVIEW",
      severity: "WARNING",
      title: "Collections canoniques à revoir",
      message: `${unconfirmedCollections.length} collection(s) contiennent des lignes non confirmées.`,
      questionIds: unconfirmedCollections,
      remediation: "Faire confirmer les lignes par les rôles métier, risques, conformité, juridique ou fiscal compétents.",
    });
  }
}

function arrayAnswer<T>(project: ProspectusProject, questionId: string): T[] {
  const value = getAnswerValue(project, questionId);
  return Array.isArray(value) ? (value as T[]) : [];
}

function arrayStringAnswer(project: ProspectusProject, questionId: string): string[] {
  return arrayAnswer<unknown>(project, questionId).map(String);
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
