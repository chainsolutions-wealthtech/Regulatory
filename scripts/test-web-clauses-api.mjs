import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const validationPath = path.join(
  repoRoot,
  "regulatory/validation/WEB_CLAUSE_LIFECYCLE_API_VALIDATION.json",
);

const response = await fetch(`${baseUrl}/api/regulatory/clauses`);
assert(response.status === 200, "Le catalogue de clauses doit être accessible.");
const body = await response.json();

assert(body.readOnly === true, "Le catalogue réglementaire doit rester en lecture seule.");
assert(body.readyForSubmission === false, "Le catalogue ne doit jamais déverrouiller la soumission.");
assert(body.approvalAllowed === false, "L'API publique de catalogue ne doit pas approuver une clause.");
assert(body.automaticActivationAllowed === false, "L'activation automatique doit rester interdite.");
assert(body.lifecycle?.humanOnly === true, "Les transitions de clause doivent être humaines uniquement.");
assert(body.lifecycle?.activationAllowed === false, "Aucun rôle ne doit pouvoir activer une clause en V1.");
assert(body.lifecycle?.activationGrantCount === 0, "Le nombre de grants CLAUSE_ACTIVATE doit rester nul.");
assert(
  JSON.stringify(body.lifecycle?.statuses) ===
    JSON.stringify(["DRAFT", "DRAFT_LEGAL_REVIEW_REQUIRED", "APPROVED", "ACTIVE", "RETIRED"]),
  "L'API doit exposer les statuts persistés du cycle de vie.",
);
assert(
  body.lifecycle?.transitions?.REQUEST_LEGAL_REVIEW?.from === "DRAFT" &&
    body.lifecycle?.transitions?.REQUEST_LEGAL_REVIEW?.to === "DRAFT_LEGAL_REVIEW_REQUIRED",
  "La demande de revue juridique doit être exposée.",
);
assert(
  body.lifecycle?.transitions?.APPROVE?.from === "DRAFT_LEGAL_REVIEW_REQUIRED" &&
    body.lifecycle?.transitions?.APPROVE?.to === "APPROVED",
  "La transition d'approbation doit être exposée.",
);
assert(
  body.lifecycle?.transitions?.ACTIVATE?.from === "APPROVED" &&
    body.lifecycle?.transitions?.ACTIVATE?.to === "ACTIVE",
  "La transition théorique d'activation doit être exposée sans être autorisée.",
);

const validation = {
  validationId: "WEB_CLAUSE_LIFECYCLE_API_VALIDATION_V1",
  status: "PASS",
  clauseCount: body.clauseCount,
  checks: {
    catalogReadOnly: true,
    approvalEndpointDisabled: true,
    automaticActivationDisabled: true,
    lifecycleHumanOnly: true,
    activationGrantCountZero: true,
    persistedStatusesExposed: true,
    governedTransitionsExposed: true,
    readyForSubmissionRemainsFalse: true,
  },
  caveat:
    "Validation HTTP de la surface read-only. Elle n'accorde aucune approbation, aucune activation et aucune valeur juridique nouvelle.",
};
await mkdir(path.dirname(validationPath), { recursive: true });
await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
console.log(JSON.stringify(validation, null, 2));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
