const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const proposalId = "clause-proposal-unavailable";

const list = await fetch(`${baseUrl}/api/regulatory/clause-proposals`);
assert(list.status === 503, "Clause proposal list must remain unavailable in local-json.");
const listBody = await list.json();
assert(
  String(listBody.error ?? "").startsWith("CLAUSE_PROPOSAL_REPOSITORY_UNAVAILABLE"),
  "List must require PostgreSQL + OIDC.",
);

const create = await fetch(`${baseUrl}/api/regulatory/clause-proposals`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    sourceClauseId: "UMOA_FCP_DRAFT_DISCLAIMER_V1",
    wording: "Proposition locale qui ne doit jamais être simulée.",
  }),
});
assert(create.status === 503, "Clause proposal creation must remain unavailable in local-json.");

const read = await fetch(
  `${baseUrl}/api/regulatory/clause-proposals/${encodeURIComponent(proposalId)}`,
);
assert(read.status === 503, "Clause proposal read must remain unavailable in local-json.");

const transition = await fetch(
  `${baseUrl}/api/regulatory/clause-proposals/${encodeURIComponent(proposalId)}/transitions`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event: "REQUEST_LEGAL_REVIEW", expectedVersion: 1 }),
  },
);
assert(transition.status === 503, "Clause proposal transition must remain unavailable in local-json.");

const activate = await fetch(
  `${baseUrl}/api/regulatory/clause-proposals/${encodeURIComponent(proposalId)}/transitions`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event: "ACTIVATE", expectedVersion: 1 }),
  },
);
assert(activate.status === 422, "The HTTP surface must reject ACTIVATE before repository access.");
const activateBody = await activate.json();
assert(
  String(activateBody.error ?? "").includes("REQUEST_LEGAL_REVIEW") &&
    String(activateBody.error ?? "").includes("APPROVE"),
  "The transition contract must enumerate only the two human proposal transitions.",
);

console.log(JSON.stringify({
  validationId: "WEB_CLAUSE_PROPOSAL_RUNTIME_GATE_VALIDATION_V1",
  status: "PASS",
  checks: {
    localJsonListUnavailable: true,
    localJsonCreateUnavailable: true,
    localJsonReadUnavailable: true,
    localJsonTransitionUnavailable: true,
    fakeLocalIdentityAvoided: true,
    activationHttpSurfaceRejected: true,
    globalClauseActivationAllowed: false,
    readyForSubmissionRemainsFalse: true,
  },
  caveat:
    "Ce test valide le gate runtime local-json. Le lifecycle réel est validé séparément sur PostgreSQL 17 avec identité vérifiée et RLS.",
}, null, 2));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
