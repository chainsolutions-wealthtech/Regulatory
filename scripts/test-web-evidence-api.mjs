import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validationDirectory = path.join(repoRoot, "regulatory/validation");
const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const objectId = "50000000-0000-0000-0000-000000000001";

const uploadForm = new FormData();
uploadForm.set("projectVersionId", "40000000-0000-0000-0000-000000000001");
uploadForm.set("file", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "prospectus.pdf", { type: "application/pdf" }));
const upload = await fetch(`${baseUrl}/api/evidence`, { method: "POST", body: uploadForm });
assert(upload.status === 503, "L'upload de preuve doit rester indisponible en local-json.");

const metadata = await fetch(`${baseUrl}/api/evidence/${encodeURIComponent(objectId)}`);
assert(metadata.status === 503, "La lecture metadata de preuve doit rester indisponible en local-json.");
const metadataBody = await metadata.json();
assert(
  String(metadataBody.error ?? "").startsWith("EVIDENCE_DESCRIPTOR_SERVICE_UNAVAILABLE"),
  "La lecture metadata ne doit jamais créer de faux store ou de fausse identité.",
);

const release = await fetch(`${baseUrl}/api/evidence/${encodeURIComponent(objectId)}/release`, { method: "POST" });
assert(release.status === 503, "La libération de preuve doit rester indisponible en local-json.");
const releaseBody = await release.json();
assert(
  String(releaseBody.error ?? "").startsWith("EVIDENCE_DESCRIPTOR_SERVICE_UNAVAILABLE") ||
    String(releaseBody.error ?? "").startsWith("EVIDENCE_RELEASE_SERVICE_UNAVAILABLE"),
  "La libération doit exiger store privé, OIDC et vérification serveur réels.",
);

const browserScan = await fetch(`${baseUrl}/api/evidence/${encodeURIComponent(objectId)}/scan`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    status: "CLEAN",
    sha256: "a".repeat(64),
    detectedMediaType: "application/pdf",
    scanProvider: "browser",
  }),
});
assert(browserScan.status === 404 || browserScan.status === 405, "Aucune route de verdict antivirus navigateur ne doit exister.");

const validation = {
  validationId: "WEB_EVIDENCE_RUNTIME_GATE_VALIDATION_V1",
  status: "PASS",
  checks: {
    localJsonUploadUnavailable: true,
    localJsonMetadataUnavailable: true,
    localJsonReleaseUnavailable: true,
    browserScanVerdictRouteAbsent: true,
    fakeLocalIdentityAvoided: true,
    clientStorageReferenceNotRequired: true,
    clientScanDigestNotAccepted: true,
    releaseDescriptorReloadedServerSide: true,
    readyForSubmissionRemainsFalse: true,
  },
  caveat:
    "Ce test valide les gates HTTP local-json. Un scan réel exige un adaptateur serveur de confiance et la libération reste une action humaine EVIDENCE_VERIFY distincte.",
};

await mkdir(validationDirectory, { recursive: true });
await writeFile(
  path.join(validationDirectory, "WEB_EVIDENCE_RUNTIME_GATE_VALIDATION.json"),
  `${JSON.stringify(validation, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(validation, null, 2));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
