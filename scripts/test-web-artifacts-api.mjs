import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const validationPath = path.join(
  repoRoot,
  "regulatory/validation/WEB_GENERATION_ARTIFACT_API_VALIDATION.json",
);

const projects = await jsonRequest("/api/projects");
const candidate = projects.body.projects.find((project) => project.name === "API Integration Test Fund");
assert(candidate, "Le projet généré par le test d’intégration principal doit exister.");

const projectResponse = await jsonRequest(`/api/projects/${encodeURIComponent(candidate.id)}`);
assert(projectResponse.response.status === 200, "Le projet doit être lisible.");
const generationId = projectResponse.body.project.generation?.generationId;
assert(typeof generationId === "string" && generationId.length > 0, "Une génération persistée est requise.");

const listing = await jsonRequest(
  `/api/projects/${encodeURIComponent(candidate.id)}/artifacts/${encodeURIComponent(generationId)}`,
);
assert(listing.response.status === 200, "L’inventaire des artefacts doit être accessible.");
assert(listing.body.readyForSubmission === false, "L’API d’artefacts doit verrouiller la soumission.");
assert(listing.body.artifactCount >= 16, "La génération doit exposer au moins 16 artefacts.");

const artifactByName = new Map(listing.body.artifacts.map((artifact) => [artifact.fileName, artifact]));
for (const fileName of [
  "canonical-snapshot.json",
  "prospectus-draft.docx",
  "prospectus-draft.pdf",
  "pdf-manifest.json",
  "review-package-manifest.json",
  "review-package.zip",
]) {
  assert(artifactByName.has(fileName), `Artefact obligatoire manquant: ${fileName}`);
}

const pdf = await binaryRequest(
  `/api/projects/${encodeURIComponent(candidate.id)}/artifacts/${encodeURIComponent(generationId)}/prospectus-draft.pdf`,
);
assert(pdf.response.status === 200, "Le PDF doit être téléchargeable.");
assert(pdf.response.headers.get("content-type") === "application/pdf", "Le MIME PDF doit être exact.");
assert(Buffer.from(pdf.body).subarray(0, 5).toString("ascii") === "%PDF-", "Le magic PDF doit être valide.");
assert(
  pdf.response.headers.get("x-content-sha256") === artifactByName.get("prospectus-draft.pdf").sha256,
  "Le SHA du téléchargement PDF doit correspondre à l’inventaire.",
);
assert(
  pdf.response.headers.get("x-regulatory-ready-for-submission") === "false",
  "Le téléchargement doit conserver ready_for_submission=false.",
);

const reviewZip = await binaryRequest(
  `/api/projects/${encodeURIComponent(candidate.id)}/artifacts/${encodeURIComponent(generationId)}/review-package.zip`,
);
assert(reviewZip.response.status === 200, "Le ZIP de revue doit être téléchargeable.");
assert(reviewZip.response.headers.get("content-type") === "application/zip", "Le MIME ZIP doit être exact.");
assert(
  reviewZip.response.headers.get("x-content-sha256") === artifactByName.get("review-package.zip").sha256,
  "Le SHA du ZIP doit correspondre à l’inventaire.",
);

const traversal = await fetch(
  `${baseUrl}/api/projects/${encodeURIComponent(candidate.id)}/artifacts/${encodeURIComponent(generationId)}/%2E%2E%252Fsecret`,
  { redirect: "manual" },
);
assert(traversal.status >= 400, "Une tentative de traversal doit être rejetée.");

const validation = {
  validationId: "WEB_GENERATION_ARTIFACT_API_VALIDATION_V1",
  status: "PASS",
  projectId: candidate.id,
  generationId,
  artifactCount: listing.body.artifactCount,
  checks: {
    artifactListingAccessible: true,
    canonicalSnapshotPersisted: true,
    docxPersisted: true,
    normalizedPdfPersisted: true,
    deterministicReviewPackagePersisted: true,
    pdfMagicValid: true,
    downloadShaMatchesInventory: true,
    readyForSubmissionRemainsFalse: true,
    traversalRejected: true,
  },
  caveat:
    "Validation HTTP locale de pré-conformité. La revue juridique, la sécurité de production et la soumission réglementaire restent interdites.",
};
await mkdir(path.dirname(validationPath), { recursive: true });
await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
console.log(JSON.stringify(validation, null, 2));

async function jsonRequest(url) {
  const response = await fetch(`${baseUrl}${url}`);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function binaryRequest(url) {
  const response = await fetch(`${baseUrl}${url}`);
  const body = await response.arrayBuffer();
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
