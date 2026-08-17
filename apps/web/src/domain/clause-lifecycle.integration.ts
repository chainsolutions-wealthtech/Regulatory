import type { AuthorizationSubject } from "@/domain/authorization";
import { evaluateClauseTransition } from "@/domain/clause-lifecycle";

const organizationId = "71000000-0000-0000-0000-000000000001";
const authorId = "72000000-0000-0000-0000-000000000010";
const reviewerId = "72000000-0000-0000-0000-000000000011";

const author: AuthorizationSubject = {
  userId: authorId,
  organizationId,
  roles: ["LEGAL"],
};
const reviewer: AuthorizationSubject = {
  userId: reviewerId,
  organizationId,
  roles: ["LEGAL"],
};
const product: AuthorizationSubject = {
  userId: "72000000-0000-0000-0000-000000000012",
  organizationId,
  roles: ["PRODUCT"],
};

const resource = {
  organizationId,
  createdByUserId: authorId,
};

const requestReview = evaluateClauseTransition("REQUEST_LEGAL_REVIEW", "DRAFT", {
  actor: author,
  resource,
});
assert(requestReview.allowed, "Legal author must be able to request legal review.");
assert(
  requestReview.nextStatus === "DRAFT_LEGAL_REVIEW_REQUIRED",
  "Requesting review must move the draft to DRAFT_LEGAL_REVIEW_REQUIRED.",
);

assert(
  !evaluateClauseTransition("REQUEST_LEGAL_REVIEW", "DRAFT", {
    actor: product,
    resource,
  }).allowed,
  "Product must not draft or submit a legal clause for legal review.",
);

assert(
  !evaluateClauseTransition("APPROVE", "DRAFT", {
    actor: reviewer,
    resource,
  }).allowed,
  "A clause must not skip the legal-review-required state.",
);

const selfApproval = evaluateClauseTransition("APPROVE", "DRAFT_LEGAL_REVIEW_REQUIRED", {
  actor: author,
  resource,
  priorActionsBySameUser: ["CLAUSE_DRAFT"],
});
assert(!selfApproval.allowed, "The clause author must not solely approve their own clause.");
assert(
  selfApproval.reason === "DENIED_SEPARATION_OF_DUTIES",
  "Self approval must fail specifically on separation of duties.",
);

const approval = evaluateClauseTransition("APPROVE", "DRAFT_LEGAL_REVIEW_REQUIRED", {
  actor: reviewer,
  resource,
});
assert(approval.allowed, "A distinct Legal reviewer must be able to approve the reviewed draft.");
assert(approval.nextStatus === "APPROVED", "Approved legal review must produce APPROVED status.");

assert(
  !evaluateClauseTransition(
    "APPROVE",
    "DRAFT_LEGAL_REVIEW_REQUIRED",
    { actor: reviewer, resource },
    "AUTOMATIC",
  ).allowed,
  "Clause approval must never be automatic.",
);

const activation = evaluateClauseTransition("ACTIVATE", "APPROVED", {
  actor: reviewer,
  resource,
});
assert(!activation.allowed, "No role currently grants CLAUSE_ACTIVATE; activation must remain closed.");
assert(
  activation.reason === "DENIED_NO_GRANT",
  "Activation must be denied by the current RBAC grant surface.",
);
assert(activation.readyForSubmission === false, "Clause lifecycle must never unlock submission.");

const validation = {
  validationId: "CLAUSE_LIFECYCLE_VALIDATION_V1",
  status: "PASS",
  checks: {
    legalDraftReviewRequestAllowed: true,
    productClauseDraftDenied: true,
    directDraftApprovalDenied: true,
    authorSelfApprovalDenied: true,
    distinctLegalApprovalAllowed: true,
    automaticApprovalDenied: true,
    activationDeniedWithoutGrant: true,
    readyForSubmissionRemainsFalse: true,
  },
  caveat:
    "Validation du moteur de cycle de vie seulement. Aucun texte juridique n'est activé et aucune approbation humaine réelle n'est simulée.",
};

console.log(JSON.stringify(validation, null, 2));

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
