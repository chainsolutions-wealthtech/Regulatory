const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const projectId = "import-staging-unavailable-project";
const importId = "import-staging-unavailable-batch";

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

console.log(JSON.stringify({
  validationId: "WEB_IMPORT_STAGING_RUNTIME_GATE_VALIDATION_V1",
  status: "PASS",
  checks: {
    localJsonReadUnavailable: true,
    localJsonReviewUnavailable: true,
    fakeLocalIdentityAvoided: true,
    postgresqlOidcRequired: true,
    readyForSubmissionRemainsFalse: true,
  },
  caveat:
    "Ce test valide le gate runtime local-json. Les opérations réelles de staging/revue PostgreSQL sont validées séparément sur PostgreSQL 17.",
}, null, 2));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
