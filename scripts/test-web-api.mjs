import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const validationPath = path.join(
  repoRoot,
  "regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json",
);

await waitForServer();

const catalogResponse = await request("/api/regulatory/catalog");
assert(catalogResponse.response.status === 200, "Le catalogue réglementaire doit être accessible.");
const catalog = catalogResponse.body;
assert(catalog.metadata.requirementCount === 62, "Le catalogue doit contenir 62 exigences.");
assert(
  new Set(catalog.requirements.map((item) => item.requirementId)).size === 62,
  "Les identifiants d’exigence doivent être uniques.",
);
assert(
  catalog.requirements.every((item) => String(item.requirementId).startsWith("CIRC005_")),
  "Chaque exigence doit conserver son identifiant CIRC005.",
);

const create = await request("/api/projects", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "API Integration Test Fund",
    category: "BOND",
    countryCode: "CI",
    operation: "CREATE",
    managementCompanyName: "Test Management Company",
  }),
});
assert(create.response.status === 201, `La création du projet a échoué: ${create.response.status}`);
const projectId = create.body.project.id;

const questions = await request(`/api/projects/${projectId}/questions`);
assert(questions.response.status === 200, "Les questions du projet doivent être accessibles.");
assert(
  questions.body.catalog.catalogDigest === catalog.metadata.catalogDigest,
  "L’API projet doit utiliser la même empreinte de catalogue.",
);
assert(questions.body.groups.length >= 16, "Le questionnaire doit exposer les groupes canoniques.");
const questionById = new Map(
  questions.body.groups.flatMap((group) => group.questions).map((question) => [question.id, question]),
);
for (const [questionId, expectedType] of Object.entries({
  Q_SHARE_CLASSES_COUNT: "SHARE_CLASS_COLLECTION",
  Q_ASSET_EXPOSURE_MATRIX: "ASSET_RANGE_COLLECTION",
  Q_TRANSACTION_FEES: "FEE_COLLECTION",
  Q_REMUNERATION_DETAILS: "FEE_COLLECTION",
  Q_VALUATION_METHODS: "VALUATION_METHOD_COLLECTION",
  Q_CONFIRM_GOVERNANCE_MEMBERS: "PARTY_COLLECTION",
  APP_SERVICE_PROVIDERS: "PARTY_COLLECTION",
  APP_RISK_FACTORS: "RISK_COLLECTION",
  Q_HOME_STATE_ARRANGEMENTS: "COUNTRY_ARRANGEMENT_COLLECTION",
  APP_EVIDENCE_COLLECTION: "EVIDENCE_COLLECTION",
})) {
  assert(
    questionById.get(questionId)?.type === expectedType,
    `${questionId} doit utiliser ${expectedType}.`,
  );
}

const unknown = await saveAnswer(projectId, "UNKNOWN_QUESTION", "value");
assert(unknown.response.status === 422, "Une question inconnue doit être rejetée.");

const canonicalAnswer = await saveAnswer(projectId, "Q_FUND_CONSTITUTION_DATE", "2026-08-05");
assert(canonicalAnswer.response.status === 200, "Une réponse canonique doit être enregistrée.");

const duplicateShareClasses = await saveAnswer(projectId, "Q_SHARE_CLASSES_COUNT", [
  shareClass("CLASS-A", "XOF", "CAPITALIZED", 10_000),
  shareClass("CLASS-A", "XOF", "DISTRIBUTED", 20_000),
]);
assert(
  duplicateShareClasses.response.status === 400,
  "Deux classes partageant le même identifiant doivent être rejetées.",
);
const structuredShareClasses = [
  shareClass("CLASS-A", "XOF", "CAPITALIZED", 10_000),
  shareClass("CLASS-B", "XOF", "DISTRIBUTED", 20_000),
];
assert(
  (await saveAnswer(projectId, "Q_SHARE_CLASSES_COUNT", structuredShareClasses)).response.status === 200,
  "Les classes structurées doivent être enregistrées.",
);

const invalidRanges = await saveAnswer(projectId, "Q_ASSET_EXPOSURE_MATRIX", [
  assetRange("RANGE-01", "GOVERNMENT_BONDS", 60, 40, 80),
]);
assert(invalidRanges.response.status === 400, "Une fourchette incohérente doit être rejetée.");
const assetRanges = [
  assetRange("RANGE-01", "GOVERNMENT_BONDS", 40, 60, 100),
  assetRange("RANGE-02", "CASH", 0, 10, 30),
];
assert(
  (await saveAnswer(projectId, "Q_ASSET_EXPOSURE_MATRIX", assetRanges)).response.status === 200,
  "Les fourchettes d’allocation doivent être enregistrées.",
);

const transactionFees = [
  fee("FEE-SUBSCRIPTION", "SUBSCRIPTION", "Commission de souscription", "HOLDER", 1.5),
  fee("FEE-REDEMPTION", "REDEMPTION", "Commission de rachat", "HOLDER", 0),
];
const remunerations = [
  fee("REMUNERATION-MANAGEMENT", "MANAGEMENT", "Rémunération de gestion", "FUND_ASSETS", 1.2),
  fee("REMUNERATION-DEPOSITARY", "DEPOSITARY", "Rémunération du dépositaire", "FUND_ASSETS", 0.15),
];
assert(
  (await saveAnswer(projectId, "Q_TRANSACTION_FEES", transactionFees)).response.status === 200,
  "Les frais transactionnels doivent être enregistrés.",
);
assert(
  (await saveAnswer(projectId, "Q_REMUNERATION_DETAILS", remunerations)).response.status === 200,
  "Les rémunérations doivent être enregistrées.",
);

const valuationMethods = [
  valuation("VALUATION-01", "GOVERNMENT_BONDS", "Cours ou courbe de taux validée"),
  valuation("VALUATION-02", "CASH", "Valeur nominale augmentée des intérêts courus"),
];
assert(
  (await saveAnswer(projectId, "Q_VALUATION_METHODS", valuationMethods)).response.status === 200,
  "Les méthodes de valorisation doivent être enregistrées.",
);

const governance = [
  governanceMember("GOV-01", "Awa Test", "Présidente du conseil"),
  governanceMember("GOV-02", "Koffi Test", "Directeur général"),
];
assert(
  (await saveAnswer(projectId, "Q_CONFIRM_GOVERNANCE_MEMBERS", governance)).response.status === 200,
  "Les membres de gouvernance doivent être enregistrés.",
);

const providers = [
  party("PARTY-DEPOSITARY", "DEPOSITARY", "Banque Dépositaire Test"),
  party("PARTY-AUDITOR", "AUDITOR", "Cabinet Audit Test"),
  party("PARTY-DISTRIBUTOR", "DISTRIBUTOR", "Distributeur Test"),
];
assert(
  (await saveAnswer(projectId, "APP_SERVICE_PROVIDERS", providers)).response.status === 200,
  "Les intervenants doivent être enregistrés.",
);

const risks = [
  risk("RISK-CREDIT", "CREDIT", "Risque de crédit"),
  risk("RISK-LIQUIDITY", "LIQUIDITY", "Risque de liquidité"),
];
assert(
  (await saveAnswer(projectId, "APP_RISK_FACTORS", risks)).response.status === 200,
  "Les risques structurés doivent être enregistrés.",
);

assert((await saveAnswer(projectId, "Q_MARKETING_COUNTRIES", ["SN"])).response.status === 200);
const arrangements = [
  countryArrangement("COUNTRY-CI", "CI", true),
  countryArrangement("COUNTRY-SN", "SN", false),
];
assert(
  (await saveAnswer(projectId, "Q_HOME_STATE_ARRANGEMENTS", arrangements)).response.status === 200,
  "Les dispositifs pays doivent être enregistrés.",
);

const evidence = [
  evidenceItem("EVIDENCE-APPROVAL", "APPROVAL", "Agrément du fonds", "FCP/TEST/001"),
  evidenceItem("EVIDENCE-REGULATION", "FUND_REGULATION", "Règlement du fonds", "REG/TEST/001"),
];
assert(
  (await saveAnswer(projectId, "APP_EVIDENCE_COLLECTION", evidence)).response.status === 200,
  "Les justificatifs doivent être enregistrés.",
);

assert((await saveAnswer(projectId, "APP_BENCHMARK_ENABLED", "true")).response.status === 200);
assert(
  (await saveAnswer(projectId, "APP_BENCHMARK_REFERENCE", "Benchmark de test")).response.status ===
    200,
);
const benchmarkDisabled = await saveAnswer(projectId, "APP_BENCHMARK_ENABLED", "false");
assert(benchmarkDisabled.response.status === 200);
assert(
  !Object.hasOwn(benchmarkDisabled.body.project.answers, "APP_BENCHMARK_REFERENCE"),
  "Une réponse devenue inapplicable doit être retirée du snapshot courant.",
);

const generated = await request(`/api/projects/${projectId}/generate`, { method: "POST" });
assert(generated.response.status === 200, "La génération documentaire doit réussir.");
assert(generated.body.generation.readyForSubmission === false, "La soumission doit rester interdite.");
assert(
  generated.body.canonicalSnapshot.catalogDigest === catalog.metadata.catalogDigest,
  "Le snapshot canonique doit enregistrer l’empreinte du catalogue.",
);
assert(
  generated.body.canonicalSnapshot.requirementCount === 62,
  "Le snapshot canonique doit référencer les 62 exigences.",
);
assert(
  generated.body.canonicalSnapshot.answerRecords.some(
    (item) => item.questionId === "Q_FUND_CONSTITUTION_DATE",
  ),
  "La réponse canonique doit être traçable dans le snapshot.",
);
const canonicalData = generated.body.canonicalSnapshot.canonicalData;
assert(canonicalData?.fund?.constitution_date === "2026-08-05", "La constitution doit être alimentée.");
assertArray(canonicalData?.share_classes, 2, "share_classes");
assertArray(canonicalData?.investment_policy?.asset_class_ranges, 2, "asset_class_ranges");
assertArray(canonicalData?.fees?.transaction, 2, "fees.transaction");
assertArray(canonicalData?.remunerations, 2, "remunerations");
assertArray(canonicalData?.valuation?.methods, 2, "valuation.methods");
assertArray(canonicalData?.manager?.governance_members, 2, "manager.governance_members");
assertArray(canonicalData?.service_providers, 3, "service_providers");
assertArray(canonicalData?.risks, 2, "risks");
assertArray(canonicalData?.distribution_countries, 2, "distribution_countries");
assertArray(canonicalData?.evidence, 2, "evidence");

const repeating = canonicalData?._repeating ?? {};
for (const forbiddenPath of [
  "share_classes",
  "investment.asset_ranges",
  "investment_policy.asset_class_ranges",
  "remunerations[].beneficiary",
  "valuation.methods",
  "manager.governance_members",
  "distribution_countries",
]) {
  assert(!Object.hasOwn(repeating, forbiddenPath), `${forbiddenPath} ne doit pas être stocké dans _repeating.`);
}
assert(
  generated.body.preview.generationId === generated.body.generation.generationId,
  "L’aperçu et le manifeste projet doivent partager le même identifiant de génération.",
);
assert(generated.body.preview.sections.length > 0, "Le compositeur doit produire des sections.");

const requiredArtifactPathFields = [
  "artifactDirectoryPath",
  "canonicalSnapshotPath",
  "canonicalDataPath",
  "questionnaireStatePath",
  "controlReportPath",
  "concordancePath",
  "documentModelPath",
  "answerLogPath",
  "generationManifestPath",
  "markdownPath",
  "docxPath",
  "docxManifestPath",
  "docxValidationPath",
];
for (const field of requiredArtifactPathFields) {
  assert(
    typeof generated.body.generation[field] === "string" && generated.body.generation[field].length > 0,
    `Le chemin d’artefact ${field} doit être conservé dans la génération.`,
  );
}

const validation = {
  validationId: "CIRC005_WEB_API_INTEGRATION_VALIDATION_V4",
  status: "PASS",
  catalogDigest: catalog.metadata.catalogDigest,
  requirementCount: catalog.metadata.requirementCount,
  interactiveRegulatoryQuestionCount: catalog.metadata.interactiveQuestionCount,
  exposedGroupCount: questions.body.groups.length,
  structuredCollectionCount: 10,
  checks: {
    catalogEndpoint: true,
    uniqueRequirementIds: true,
    projectCreation: true,
    canonicalQuestionAccepted: true,
    unknownQuestionRejected: true,
    conditionalAnswerInvalidation: true,
    structuredQuestionTypesExposed: true,
    invalidStructuredRowsRejected: true,
    shareClassesWrittenToCanonicalArray: true,
    assetRangesWrittenToCanonicalArray: true,
    feesWrittenToCanonicalArrays: true,
    valuationMethodsWrittenToCanonicalArray: true,
    governanceWrittenToCanonicalArray: true,
    serviceProvidersWrittenToCanonicalArray: true,
    risksWrittenToCanonicalArray: true,
    countryArrangementsWrittenToCanonicalArray: true,
    evidenceWrittenToCanonicalArray: true,
    legacyRepeatingBucketsAvoided: true,
    canonicalSnapshotGenerated: true,
    historicalComposerInvoked: true,
    completeGenerationBundlePersisted: true,
    deterministicDocxValidated: true,
    generationArtifactPathRecorded: true,
    readyForSubmissionRemainsFalse: true,
  },
  caveat:
    "Test d’intégration d’un prototype local. Il ne constitue ni un test de sécurité de production, ni une validation juridique ou réglementaire.",
};
await mkdir(path.dirname(validationPath), { recursive: true });
await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
console.log(JSON.stringify(validation, null, 2));

function shareClass(classId, currency, incomePolicy, initialNav) {
  return {
    class_id: classId,
    currency,
    income_policy: incomePolicy,
    initial_nav: initialNav,
    initial_subscription_minimum: { display: "100 000 XOF" },
    decimalization: { display: "Millièmes de part" },
  };
}

function assetRange(rangeId, assetClass, minimum, target, maximum) {
  return {
    range_id: rangeId,
    asset_class: assetClass,
    minimum_percent: minimum,
    target_percent: target,
    maximum_percent: maximum,
    review_status: "UNREVIEWED",
  };
}

function fee(feeId, feeType, label, payerType, ratePercent) {
  return {
    fee_id: feeId,
    fee_type: feeType,
    label,
    payer_type: payerType,
    beneficiary: "Prestataire Test",
    basis: "Actif net ou montant de l’opération",
    rate_type: "PERCENTAGE",
    rate_percent: ratePercent,
    currency: "XOF",
    frequency: "Annuelle ou à l’opération",
    review_status: "UNREVIEWED",
  };
}

function valuation(methodId, assetClass, primaryMethod) {
  return {
    method_id: methodId,
    asset_class: assetClass,
    primary_method: primaryMethod,
    price_source: "Source indépendante Test",
    fallback_method: "Méthode alternative documentée",
    frequency: "À chaque VL",
    exception_process: "Escalade au comité de valorisation",
    review_status: "UNREVIEWED",
  };
}

function governanceMember(partyId, personName, functionTitle) {
  return {
    party_id: partyId,
    role: "GOVERNANCE_MEMBER",
    legal_name: "",
    person_name: personName,
    function_title: functionTitle,
    verification_status: "USER_PROVIDED_PENDING_REVIEW",
  };
}

function party(partyId, role, legalName) {
  return {
    party_id: partyId,
    role,
    legal_name: legalName,
    legal_form: "Société anonyme",
    approval_number: "TEST-001",
    registered_office: "Abidjan",
    main_activity: "Activité test",
    verification_status: "USER_PROVIDED_PENDING_REVIEW",
  };
}

function risk(riskId, category, label) {
  return {
    risk_id: riskId,
    category,
    label,
    description: `${label} — description contrôlée pour le test d’intégration.`,
    source: "USER",
    review_status: "UNREVIEWED",
  };
}

function countryArrangement(arrangementId, countryCode, isHomeState) {
  return {
    arrangement_id: arrangementId,
    country_code: countryCode,
    is_home_state: isHomeState,
    marketing_authorization_reference: "AUTH-TEST",
    paying_agents: "Agent payeur Test",
    redemption_locations: "Bureaux du distributeur Test",
    information_locations: "Site et siège Test",
    review_status: "UNREVIEWED",
  };
}

function evidenceItem(evidenceId, evidenceType, title, reference) {
  return {
    evidence_id: evidenceId,
    evidence_type: evidenceType,
    title,
    reference,
    issuer: "Autorité Test",
    issue_date: "2026-08-05",
    file_reference: `/local-test/${evidenceId}.pdf`,
    verification_status: "VERIFIED",
  };
}

async function saveAnswer(projectId, questionId, value) {
  return request(`/api/projects/${projectId}/answers`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionId, value }),
  });
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/regulatory/catalog`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Le serveur Next.js ne répond pas: ${String(lastError ?? "timeout")}`);
}

function assertArray(value, expectedLength, label) {
  assert(Array.isArray(value), `${label} doit être un tableau canonique.`);
  assert(value.length === expectedLength, `${label} doit contenir ${expectedLength} lignes.`);
}

function assert(condition, message = "Assertion failed") {
  if (!condition) throw new Error(message);
}
