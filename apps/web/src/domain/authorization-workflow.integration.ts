import {
  actionsForRoles,
  authorize,
  roleCanDecideReview,
  type AuthorizationSubject,
  type ProspectusRole,
} from "@/domain/authorization";
import {
  assertTransitionAllowed,
  evaluateTransition,
  workflowSubmissionEnabled,
  type ReviewDecisionRecord,
  type WorkflowEvaluationContext,
} from "@/domain/review-workflow";

const organizationId = "71000000-0000-0000-0000-000000000001";
const projectOwner = "72000000-0000-0000-0000-000000000001";
const complianceUser = "72000000-0000-0000-0000-000000000002";

const product: AuthorizationSubject = {
  userId: projectOwner,
  organizationId,
  roles: ["PRODUCT"],
};
const compliance: AuthorizationSubject = {
  userId: complianceUser,
  organizationId,
  roles: ["COMPLIANCE"],
};
const security: AuthorizationSubject = {
  userId: "72000000-0000-0000-0000-000000000008",
  organizationId,
  roles: ["SECURITY"],
};
const reader: AuthorizationSubject = {
  userId: "72000000-0000-0000-0000-000000000003",
  organizationId,
  roles: ["READER"],
};

assert(authorize(product, "ANSWER_WRITE", { organizationId }).allowed, "Product must write answers.");
assert(!authorize(reader, "ANSWER_WRITE", { organizationId }).allowed, "Reader must not write answers.");
assert(
  !authorize(product, "PROJECT_READ", { organizationId: "other-tenant" }).allowed,
  "Cross-tenant access must be denied.",
);
assert(
  !authorize(compliance, "SUBMISSION_SEND", { organizationId }).allowed,
  "Submission must remain disabled for all roles.",
);
assert(
  authorize(security, "EVIDENCE_SCAN", { organizationId }).allowed,
  "Security service identity must be allowed to run trusted evidence scanning.",
);
assert(
  !authorize(security, "EVIDENCE_VERIFY", { organizationId }).allowed,
  "Security scanning must not grant human evidence release authority.",
);
assert(
  authorize(compliance, "EVIDENCE_VERIFY", { organizationId }).allowed,
  "Compliance must retain human evidence verification authority.",
);
assert(
  !authorize(compliance, "EVIDENCE_SCAN", { organizationId }).allowed,
  "Compliance verification must not implicitly become a scanner service privilege.",
);
assert(
  !authorize(product, "EVIDENCE_SCAN", { organizationId }).allowed,
  "Product must not run trusted evidence scanning.",
);
assert(
  !authorize(
    compliance,
    "REVIEW_DECIDE_COMPLIANCE",
    { organizationId, ownerUserId: complianceUser },
    { priorActionsBySameUser: ["ANSWER_WRITE"] },
  ).allowed,
  "Compliance self-approval after editing must be denied.",
);
assert(roleCanDecideReview("LEGAL", "LEGAL"), "Legal must decide legal review.");
assert(!roleCanDecideReview("PRODUCT", "LEGAL"), "Product must not decide legal review.");
assert(actionsForRoles(["READER"]).includes("PROJECT_READ"), "Reader must inherit project read.");

const baseContext: WorkflowEvaluationContext = {
  actorRoles: ["PRODUCT"],
  actorUserId: projectOwner,
  blockers: 0,
  generationExists: true,
  readyForSubmission: false,
  reviewRequests: ["RISK", "OPERATIONS", "COMPLIANCE", "LEGAL", "TAX"],
  reviewDecisions: [],
  unapprovedActiveClauseCount: 0,
  humanInternalApprovalRoles: [],
};

assert(
  assertTransitionAllowed("START_QUESTIONNAIRE", "DRAFT", baseContext) ===
    "QUESTIONNAIRE_IN_PROGRESS",
  "Product must start the questionnaire.",
);
assert(
  assertTransitionAllowed("GENERATE_PRE_COMPLIANCE", "QUESTIONNAIRE_IN_PROGRESS", baseContext) ===
    "PRE_COMPLIANCE_REVIEW",
  "Generation with no blocker must reach pre-compliance.",
);
assert(
  !evaluateTransition(
    "GENERATE_PRE_COMPLIANCE",
    "QUESTIONNAIRE_IN_PROGRESS",
    { ...baseContext, blockers: 1 },
  ).allowed,
  "Generation transition must fail with blockers.",
);
assert(
  !evaluateTransition(
    "FREEZE_INTERNAL_VERSION",
    "READY_FOR_INTERNAL_APPROVAL",
    {
      ...baseContext,
      actorRoles: ["LEGAL"],
      reviewDecisions: approvedReviews(true),
      humanInternalApprovalRoles: ["PRODUCT", "COMPLIANCE", "LEGAL"],
    },
    "AUTOMATIC",
  ).allowed,
  "Internal freezing must never be automatic.",
);
assert(
  evaluateTransition(
    "FREEZE_INTERNAL_VERSION",
    "READY_FOR_INTERNAL_APPROVAL",
    {
      ...baseContext,
      actorRoles: ["LEGAL"],
      reviewDecisions: approvedReviews(true),
      humanInternalApprovalRoles: ["PRODUCT", "COMPLIANCE", "LEGAL"],
    },
    "HUMAN",
  ).allowed,
  "Three distinct approvers must permit a human internal freeze.",
);
assert(
  !evaluateTransition(
    "FREEZE_INTERNAL_VERSION",
    "READY_FOR_INTERNAL_APPROVAL",
    {
      ...baseContext,
      actorRoles: ["LEGAL"],
      reviewDecisions: approvedReviews(false),
      humanInternalApprovalRoles: ["PRODUCT", "COMPLIANCE", "LEGAL"],
    },
  ).allowed,
  "A single person must not satisfy separation of duties.",
);
assert(workflowSubmissionEnabled() === false, "Submission must be disabled in workflow V1.");

const validation = {
  validationId: "RBAC_WORKFLOW_VALIDATION_V1",
  status: "PASS",
  checks: {
    defaultDeny: true,
    readerCannotWrite: true,
    tenantMismatchDenied: true,
    submissionDisabled: true,
    scannerPrivilegeSeparatedFromHumanVerification: true,
    complianceSelfApprovalDenied: true,
    roleSpecificReviewDecision: true,
    blockerStopsPreCompliance: true,
    automaticInternalFreezeDenied: true,
    distinctApproversRequired: true,
    humanInternalFreezeAllowedWithThreeApprovers: true,
  },
  caveat:
    "Validation des politiques et du moteur. Elle ne configure aucun fournisseur d’identité, aucune signature ni aucune soumission réglementaire.",
};
console.log(JSON.stringify(validation, null, 2));

function approvedReviews(distinctApprovers: boolean): ReviewDecisionRecord[] {
  const common = "72000000-0000-0000-0000-000000000009";
  const approvals: Array<{ role: ProspectusRole; decidedBy: string }> = [
    { role: "RISK", decidedBy: "72000000-0000-0000-0000-000000000004" },
    { role: "OPERATIONS", decidedBy: "72000000-0000-0000-0000-000000000005" },
    { role: "COMPLIANCE", decidedBy: distinctApprovers ? complianceUser : common },
    { role: "LEGAL", decidedBy: distinctApprovers ? "72000000-0000-0000-0000-000000000006" : common },
    { role: "TAX", decidedBy: distinctApprovers ? "72000000-0000-0000-0000-000000000007" : common },
    { role: "PRODUCT", decidedBy: distinctApprovers ? projectOwner : common },
  ];
  return approvals.map((item) => ({
    ...item,
    status: "APPROVED",
    decidedAt: "2026-08-05T10:00:00.000Z",
  }));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
