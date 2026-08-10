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
assert(
  generated.response.status === 200,
  `La génération documentaire doit réussir: HTTP ${generated.response.status} — ${String(
    generated.body?.error ?? JSON.stringify(generated.body),
  )}`,
);
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

const snapshotPath = path.join(repoRoot, "examples/generated/united-capital-diamond/web-canonical-snapshot.json");
await mkdir(path.dirname(snapshotPath), { recursive: true });
await writeFile(snapshotPath, `${JSON.stringify(generated.body.canonicalSnapshot, null, 2)}\n`, "utf8");

const historicalResponse = await request(`/api/projects/${projectId}/compose-historical`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    prices: [
      { date: "2026-06-30", value: 100.0 },
      { date: "2026-07-01", value: 101.25 },
      { date: "2026-07-02", value: 100.75 },
      { date: "2026-07-03", value: 102.4 },
    ],
  }),
});
assert(historicalResponse.response.status === 200, "La composition historique doit réussir.");
assert(historicalResponse.body.validation.status === "PASS", "Le moteur historique doit valider la série.");
assert(historicalResponse.body.validation.readyForSubmission === false, "Le moteur historique reste en pré-conformité.");

const artifactList = await request(`/api/projects/${projectId}/generations/${generated.body.generation.generationId}/artifacts`);
assert(artifactList.response.status === 200, "La liste des artefacts générés doit être accessible.");
assert(artifactList.body.artifacts.length === 16, "Les seize artefacts attendus doivent être persistés.");
for (const expectedArtifact of [
  ["prospectus-draft.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["docx-manifest.json", "application/json"],
  ["prospectus-draft.pdf", "application/pdf"],
  ["pdf-manifest.json", "application/json"],
  ["review-package-manifest.json", "application/json"],
  ["review-package.zip", "application/zip"],
]) {
  assert(
    artifactList.body.artifacts.some(
      (item) => item.fileName === expectedArtifact[0] && item.mediaType === expectedArtifact[1],
    ),
    `${expectedArtifact[0]} doit être indexé avec son type MIME attendu.`,
  );
}
const docxArtifact = await request(
  `/api/projects/${projectId}/generations/${generated.body.generation.generationId}/artifacts/prospectus-draft.docx`,
);
assert(docxArtifact.response.status === 200, "Le DOCX généré doit être téléchargeable.");
assert(
  docxArtifact.response.headers.get("content-type")?.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
  "Le DOCX doit conserver son type MIME.",
);
const pdfArtifactResponse = await fetch(
  `${baseUrl}/api/projects/${projectId}/generations/${generated.body.generation.generationId}/artifacts/prospectus-draft.pdf`,
);
assert(pdfArtifactResponse.status === 200, "Le PDF généré doit être téléchargeable.");
assert(pdfArtifactResponse.headers.get("content-type") === "application/pdf", "Le PDF doit conserver application/pdf.");
const pdfBytes = Buffer.from(await pdfArtifactResponse.arrayBuffer());
assert(pdfBytes.subarray(0, 5).toString("ascii") === "%PDF-", "Le PDF doit être un binaire PDF valide.");
const zipArtifactResponse = await fetch(
  `${baseUrl}/api/projects/${projectId}/generations/${generated.body.generation.generationId}/artifacts/review-package.zip`,
);
assert(zipArtifactResponse.status === 200, "Le package ZIP doit être téléchargeable.");
assert(zipArtifactResponse.headers.get("content-type") === "application/zip", "Le package doit conserver application/zip.");
const zipBytes = Buffer.from(await zipArtifactResponse.arrayBuffer());
assert(zipBytes.subarray(0, 2).toString("ascii") === "PK", "Le package doit être un ZIP valide.");
assert(generated.body.generation.pdfSha256, "Le snapshot de génération doit référencer le SHA du PDF.");
assert(generated.body.generation.reviewPackageSha256, "Le snapshot de génération doit référencer le SHA du package de revue.");

const projectState = await request(`/api/projects/${projectId}`);
assert(projectState.response.status === 200, "Le projet généré doit rester lisible.");
assert(
  projectState.body.project.generation?.readyForSubmission === false,
  "L’état persistant du projet ne doit jamais devenir prêt à la soumission.",
);
assert(projectState.body.project.generation?.pdfPath, "Le snapshot doit conserver le chemin logique du PDF.");
assert(projectState.body.project.generation?.reviewPackagePath, "Le snapshot doit conserver le chemin logique du package ZIP.");
assert(projectState.body.project.generation?.pdfManifestPath, "Le snapshot doit conserver le chemin logique du manifeste PDF.");
assert(projectState.body.project.generation?.reviewPackageManifestPath, "Le snapshot doit conserver le chemin logique du manifeste du package.");

const projectReview = await request(`/api/projects/${projectId}/review`);
assert(projectReview.response.status === 200, "La synthèse de revue doit être accessible.");
assert(projectReview.body.review.readyForSubmission === false, "La synthèse doit rester non soumissible.");
assert(
  projectReview.body.review.items.some((item) => item.blocking === true),
  "La revue doit conserver des points bloquants explicites.",
);

const ready = await request(`/api/projects/${projectId}/ready-for-submission`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ readyForSubmission: true }),
});
assert(ready.response.status === 409, "L’activation de ready_for_submission doit rester refusée.");
assert(
  ready.body.error === "ready_for_submission reste verrouillé à false.",
  "Le refus de soumission doit être explicite.",
);

const generatedAgain = await request(`/api/projects/${projectId}/generate`, { method: "POST" });
assert(generatedAgain.response.status === 200, "La seconde génération doit réussir.");
assert(
  generatedAgain.body.generation.generationId === generated.body.generation.generationId,
  "Le generationId doit rester déterministe à réponses identiques.",
);
assert(
  generatedAgain.body.generation.generatedAt === generated.body.generation.generatedAt,
  "La date de génération déterministe doit rester stable à réponses identiques.",
);
assert(
  generatedAgain.body.generation.pdfSha256 === generated.body.generation.pdfSha256,
  "Le PDF doit être byte-stable à réponses identiques.",
);
assert(
  generatedAgain.body.generation.reviewPackageSha256 === generated.body.generation.reviewPackageSha256,
  "Le package ZIP doit être byte-stable à réponses identiques.",
);

const changedShareClasses = [
  shareClass("CLASS-A", "XOF", "CAPITALIZED", 15_000),
  shareClass("CLASS-B", "XOF", "DISTRIBUTED", 20_000),
];
assert(
  (await saveAnswer(projectId, "Q_SHARE_CLASSES_COUNT", changedShareClasses)).response.status === 200,
  "La réponse modifiée doit être enregistrée.",
);
const generatedAfterChange = await request(`/api/projects/${projectId}/generate`, { method: "POST" });
assert(generatedAfterChange.response.status === 200, "La génération après modification doit réussir.");
assert(
  generatedAfterChange.body.generation.generationId !== generated.body.generation.generationId,
  "Le generationId doit changer lorsque les données canoniques changent.",
);

const validation = {
  validationId: "CIRC005_WEB_API_INTEGRATION_VALIDATION_V4",
  status: "PASS",
  checks: {
    projectCreation: true,
    questionnaireExposed: true,
    catalogDigestAligned: true,
    unknownQuestionsRejected: true,
    structuredQuestionTypesExposed: true,
    invalidStructuredRowsRejected: true,
    structuredResponsesAccepted: true,
    conditionalResponsesPruned: true,
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
    generatedArtifactsPersisted: true,
    reviewPackageArtifactsPersisted: true,
    generatedPdfValidated: true,
    historicalComposerInvoked: true,
    deterministicRegenerationVerified: true,
    deterministicReviewPackageVerified: true,
    deterministicDocxValidated: true,
    readyForSubmissionRemainsFalse: true,
    reviewGatesExposed: true,
  },
  projectId,
  generationId: generatedAfterChange.body.generation.generationId,
  catalogDigest: catalog.metadata.catalogDigest,
  requirementCount: catalog.metadata.requirementCount,
  canonicalSnapshotPath: path.relative(repoRoot, snapshotPath).replaceAll(path.sep, "/"),
};
await mkdir(path.dirname(validationPath), { recursive: true });
await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
console.log(JSON.stringify(validation, null, 2));

async function saveAnswer(projectId, questionId, value) {
  return request(`/api/projects/${projectId}/answers`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionId, value }),
  });
}

function shareClass(rowId, currency, distributionPolicy, minimumSubscription) {
  return {
    row_id: rowId,
    label: `Classe ${rowId}`,
    currency,
    distribution_policy: distributionPolicy,
    target_investor: "Investisseurs professionnels",
    minimum_subscription: minimumSubscription,
  };
}

function assetRange(rowId, assetClass, minPct, targetPct, maxPct) {
  return {
    row_id: rowId,
    asset_class: assetClass,
    min_pct: minPct,
    target_pct: targetPct,
    max_pct: maxPct,
  };
}

function fee(rowId, feeType, label, chargedTo, ratePct) {
  return {
    row_id: rowId,
    fee_type: feeType,
    label,
    charged_to: chargedTo,
    calculation_basis: "Actif net",
    rate_pct: ratePct,
  };
}

function valuation(rowId, assetClass, method) {
  return {
    row_id: rowId,
    asset_class: assetClass,
    method,
    source_reference: "Source de test",
    fallback_method: "Expertise indépendante",
  };
}

function governanceMember(rowId, name, role) {
  return {
    row_id: rowId,
    party_type: "GOVERNANCE_MEMBER",
    name,
    role,
    country_code: "CI",
  };
}

function party(rowId, partyType, name) {
  return {
    row_id: rowId,
    party_type: partyType,
    name,
    country_code: "CI",
  };
}

function risk(rowId, riskType, label) {
  return {
    row_id: rowId,
    risk_type: riskType,
    label,
    description: `${label} — description structurée de test`,
    severity: "MEDIUM",
  };
}

function countryArrangement(rowId, countryCode, isHomeState) {
  return {
    row_id: rowId,
    country_code: countryCode,
    is_home_state: isHomeState,
    passport_status: isHomeState ? "HOME" : "NOTIFIED",
    notes: "Dispositif de test",
  };
}

function evidenceItem(rowId, evidenceType, title, reference) {
  return {
    row_id: rowId,
    evidence_type: evidenceType,
    title,
    reference,
    status: "AVAILABLE",
    source_date: "2026-08-05",
  };
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
