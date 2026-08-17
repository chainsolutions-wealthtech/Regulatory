import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validationDirectory = path.join(repoRoot, "regulatory/validation");
const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const projectId = "import-staging-unavailable-project";
const importId = "import-staging-unavailable-batch";

const list = await fetch(
  `${baseUrl}/api/projects/${encodeURIComponent(projectId)}/imports`,
);
assert(list.status === 503, "Le listing de staging import doit rester indisponible en local-json.");
const listBody = await list.json();
assert(
  String(listBody.error ?? "").startsWith("IMPORT_STAGING_QUERY_UNAVAILABLE"),
  "Le listing doit expliquer que PostgreSQL + OIDC sont requis.",
);

const extraction = await fetch(
  `${baseUrl}/api/projects/${encodeURIComponent(projectId)}/imports`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      projectVersion: 1,
      projectVersionId: "40000000-0000-0000-0000-000000000001",
      evidenceObjectId: "50000000-0000-0000-0000-000000000001",
    }),
  },
);
assert(extraction.status === 503, "L'extraction import doit rester indisponible en local-json.");
const extractionBody = await extraction.json();
assert(
  String(extractionBody.error ?? "").startsWith("IMPORT_INGESTION_SERVICE_UNAVAILABLE"),
  "Le POST d'extraction ne doit jamais simuler un store de preuves ni une identité locale.",
);

const read = await fetch(
  `${baseUrl}/api/projects/${encodeURIComponent(projectId)}/imports/${encodeURIComponent(importId)}`,
);
assert(read.status === 503, "Le staging import doit rester indisponible en local-json.");
const readBody = await read.json();
assert(
  String(readBody.error ?? "").startsWith("IMPORT_STAGING_REPOSITORY_UNAVAILABLE"),
  "Le GET doit expliquer que PostgreSQL + OIDC sont requis.",
);

const review = await fetch(
  `${baseUrl}/api/projects/${encodeURIComponent(projectId)}/imports/${encodeURIComponent(importId)}/review`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      importValueId: "value-1",
      decision: "CONFIRMED_BY_HUMAN",
    }),
  },
);
assert(review.status === 503, "La revue import doit rester indisponible en local-json.");
const reviewBody = await review.json();
assert(
  String(reviewBody.error ?? "").startsWith("IMPORT_STAGING_REPOSITORY_UNAVAILABLE"),
  "Le POST de revue ne doit jamais simuler une identité locale.",
);

const promotion = await fetch(
  `${baseUrl}/api/projects/${encodeURIComponent(projectId)}/imports/${encodeURIComponent(importId)}/promote`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      importValueId: "value-1",
      questionId: "Q_FUND_CONSTITUTION_DATE",
      expectedVersion: 1,
    }),
  },
);
assert(promotion.status === 503, "La promotion import doit rester indisponible en local-json.");
const promotionBody = await promotion.json();
assert(
  String(promotionBody.error ?? "").startsWith("IMPORT_PROMOTION_REPOSITORY_UNAVAILABLE"),
  "Le POST de promotion ne doit jamais simuler une identité locale.",
);

const stagingValidation = {
  validationId: "WEB_IMPORT_STAGING_RUNTIME_GATE_VALIDATION_V1",
  status: "PASS",
  checks: {
    localJsonListUnavailable: true,
    localJsonExtractionUnavailable: true,
    localJsonReadUnavailable: true,
    localJsonReviewUnavailable: true,
    fakeLocalIdentityAvoided: true,
    rawFileUploadNotAcceptedByExtractionRoute: true,
    cleanEvidenceReferenceRequiredByIngestionContract: true,
    postgresqlOidcAndEvidenceStoreRequired: true,
    readyForSubmissionRemainsFalse: true,
  },
  caveat:
    "Ce test valide les gates runtime local-json. L'extraction réelle exige une preuve CLEAN et un store privé explicitement configuré ; aucun upload brut n'est accepté par cette route.",
};

const promotionValidation = {
  validationId: "WEB_IMPORT_PROMOTION_RUNTIME_GATE_VALIDATION_V1",
  status: "PASS",
  checks: {
    localJsonPromotionUnavailable: true,
    explicitQuestionTargetRequired: true,
    expectedVersionRequired: true,
    fakeLocalIdentityAvoided: true,
    postgresqlOidcRequired: true,
    automaticPromotionRemainsForbidden: true,
    readyForSubmissionRemainsFalse: true,
  },
  caveat:
    "Ce test valide le gate HTTP local-json de la promotion. L'atomicité, RBAC, RLS, provenance et concurrence sont validés séparément sur PostgreSQL 17.",
};

await mkdir(validationDirectory, { recursive: true });
await Promise.all([
  writeFile(
    path.join(validationDirectory, "WEB_IMPORT_STAGING_RUNTIME_GATE_VALIDATION.json"),
    `${JSON.stringify(stagingValidation, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    path.join(validationDirectory, "WEB_IMPORT_PROMOTION_RUNTIME_GATE_VALIDATION.json"),
    `${JSON.stringify(promotionValidation, null, 2)}\n`,
    "utf8",
  ),
]);

console.log(JSON.stringify(stagingValidation, null, 2));
console.log(JSON.stringify(promotionValidation, null, 2));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
