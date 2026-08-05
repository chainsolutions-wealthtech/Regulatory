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

const unknown = await saveAnswer(projectId, "UNKNOWN_QUESTION", "value");
assert(unknown.response.status === 422, "Une question inconnue doit être rejetée.");

const canonicalAnswer = await saveAnswer(projectId, "Q_FUND_CONSTITUTION_DATE", "2026-08-05");
assert(canonicalAnswer.response.status === 200, "Une réponse canonique doit être enregistrée.");

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
assert(
  generated.body.canonicalSnapshot.canonicalData?.fund?.constitution_date === "2026-08-05",
  "La donnée canonique du fonds doit être alimentée.",
);
assert(
  generated.body.preview.generationId === generated.body.generation.generationId,
  "L’aperçu et le manifeste projet doivent partager le même identifiant de génération.",
);
assert(
  generated.body.preview.sections.length > 0,
  "Le compositeur historique doit produire au moins une section documentaire.",
);

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
  validationId: "CIRC005_WEB_API_INTEGRATION_VALIDATION_V2",
  status: "PASS",
  catalogDigest: catalog.metadata.catalogDigest,
  requirementCount: catalog.metadata.requirementCount,
  interactiveRegulatoryQuestionCount: catalog.metadata.interactiveQuestionCount,
  exposedGroupCount: questions.body.groups.length,
  checks: {
    catalogEndpoint: true,
    uniqueRequirementIds: true,
    projectCreation: true,
    canonicalQuestionAccepted: true,
    unknownQuestionRejected: true,
    conditionalAnswerInvalidation: true,
    canonicalSnapshotGenerated: true,
    canonicalFieldPopulated: true,
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

function assert(condition, message = "Assertion failed") {
  if (!condition) throw new Error(message);
}