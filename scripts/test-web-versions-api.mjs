import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const validationPath = path.join(
  repoRoot,
  "regulatory/validation/WEB_PROJECT_VERSION_HISTORY_VALIDATION.json",
);

const projects = await jsonRequest("/api/projects");
const candidate = projects.body.projects.find((project) => project.name === "API Integration Test Fund");
assert(candidate, "Le projet généré par le test d’intégration principal doit exister.");

const history = await jsonRequest(`/api/projects/${encodeURIComponent(candidate.id)}/versions`);
assert(history.response.status === 200, "L’historique des versions doit être accessible.");
assert(Array.isArray(history.body.versions), "La réponse doit exposer versions[].");
assert(history.body.versions.length >= 2, "Le projet de test doit posséder au moins deux versions.");
assert(
  history.body.versions.every((item, index, rows) =>
    index === 0 || rows[index - 1].version > item.version,
  ),
  "Les versions doivent être triées de la plus récente à la plus ancienne.",
);

const newest = history.body.versions[0].version;
const oldest = history.body.versions.at(-1).version;
const versionResponse = await jsonRequest(
  `/api/projects/${encodeURIComponent(candidate.id)}/versions/${encodeURIComponent(String(oldest))}`,
);
assert(versionResponse.response.status === 200, "Une version historique doit être lisible.");
assert(versionResponse.body.project.version === oldest, "La version demandée doit être respectée.");

const diff = await jsonRequest(
  `/api/projects/${encodeURIComponent(candidate.id)}/versions/diff?from=${encodeURIComponent(String(oldest))}&to=${encodeURIComponent(String(newest))}`,
);
assert(diff.response.status === 200, "Le diff de versions doit être accessible.");
assert(diff.body.fromVersion === oldest, "Le diff doit exposer la version source.");
assert(diff.body.toVersion === newest, "Le diff doit exposer la version cible.");
assert(Array.isArray(diff.body.changedAnswerIds), "Le diff doit exposer changedAnswerIds[].");
assert(Array.isArray(diff.body.addedAnswerIds), "Le diff doit exposer addedAnswerIds[].");
assert(Array.isArray(diff.body.removedAnswerIds), "Le diff doit exposer removedAnswerIds[].");
assert(
  [...diff.body.changedAnswerIds, ...diff.body.addedAnswerIds, ...diff.body.removedAnswerIds].length > 0,
  "Deux versions distinctes du projet de test doivent produire au moins une différence de réponse.",
);
assert(diff.body.readyForSubmission === false, "Le diff doit conserver ready_for_submission=false.");

const missing = await jsonRequest(
  `/api/projects/${encodeURIComponent(candidate.id)}/versions/999999`,
);
assert(missing.response.status === 404, "Une version inexistante doit retourner 404.");

const validation = {
  validationId: "WEB_PROJECT_VERSION_HISTORY_VALIDATION_V1",
  status: "PASS",
  projectId: candidate.id,
  versionsObserved: history.body.versions.length,
  fromVersion: oldest,
  toVersion: newest,
  checks: {
    historyAccessible: true,
    historySortedDescending: true,
    historicalSnapshotReadable: true,
    deterministicReadOnlyDiffAccessible: true,
    missingVersionRejected: true,
    readyForSubmissionRemainsFalse: true,
  },
  caveat:
    "Historique et diff en lecture seule. Ils ne restaurent, n'activent et n'approuvent automatiquement aucune version réglementaire.",
};

await mkdir(path.dirname(validationPath), { recursive: true });
await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
console.log(JSON.stringify(validation, null, 2));

async function jsonRequest(url) {
  const response = await fetch(`${baseUrl}${url}`);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
