import workflowPolicy from "../../../../policies/workflow/PROSPECTUS_REVIEW_WORKFLOW_V1.json";
import type { ProspectusRole } from "@/domain/authorization";

export type ReviewWorkflowState = keyof typeof workflowPolicy.states;
export type ReviewWorkflowTransitionId = (typeof workflowPolicy.transitions)[number]["id"];
export type ReviewDecisionStatus =
  | "REQUESTED"
  | "IN_PROGRESS"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type ReviewDecisionRecord = {
  role: ProspectusRole;
  status: ReviewDecisionStatus;
  decidedBy: string;
  decidedAt: string;
};

export type WorkflowEvaluationContext = {
  actorRoles: ProspectusRole[];
  actorUserId: string;
  blockers: number;
  generationExists: boolean;
  readyForSubmission: false;
  reviewRequests: ProspectusRole[];
  reviewDecisions: ReviewDecisionRecord[];
  unapprovedActiveClauseCount: number;
  humanInternalApprovalRoles: ProspectusRole[];
  rationale?: string;
};

export type WorkflowTransitionEvaluation = {
  allowed: boolean;
  transitionId: ReviewWorkflowTransitionId;
  from: ReviewWorkflowState;
  to: ReviewWorkflowState;
  failedConditions: string[];
  reason:
    | "ALLOWED"
    | "TRANSITION_UNKNOWN"
    | "SOURCE_STATE_MISMATCH"
    | "ROLE_NOT_ALLOWED"
    | "AUTOMATIC_TRANSITION_FORBIDDEN"
    | "CONDITION_FAILED"
    | "SEPARATION_OF_DUTIES_FAILED";
};

export function evaluateTransition(
  transitionId: ReviewWorkflowTransitionId,
  currentState: ReviewWorkflowState,
  context: WorkflowEvaluationContext,
  mode: "HUMAN" | "AUTOMATIC" = "HUMAN",
): WorkflowTransitionEvaluation {
  const transition = workflowPolicy.transitions.find((item) => item.id === transitionId);
  if (!transition) {
    return evaluation(false, transitionId, currentState, currentState, [], "TRANSITION_UNKNOWN");
  }
  if (!(transition.from as string[]).includes(currentState)) {
    return evaluation(
      false,
      transitionId,
      currentState,
      transition.to as ReviewWorkflowState,
      [],
      "SOURCE_STATE_MISMATCH",
    );
  }
  if (
    mode === "AUTOMATIC" &&
    (workflowPolicy.forbiddenAutomaticTransitions as string[]).includes(transition.to)
  ) {
    return evaluation(
      false,
      transitionId,
      currentState,
      transition.to as ReviewWorkflowState,
      [],
      "AUTOMATIC_TRANSITION_FORBIDDEN",
    );
  }
  if (!(transition.allowedRoles as string[]).some((role) => context.actorRoles.includes(role as ProspectusRole))) {
    return evaluation(
      false,
      transitionId,
      currentState,
      transition.to as ReviewWorkflowState,
      [],
      "ROLE_NOT_ALLOWED",
    );
  }

  const failedConditions = (transition.conditions ?? [])
    .filter((condition) => condition.required)
    .filter((condition) => !conditionSatisfied(condition, context))
    .map((condition) => conditionKey(condition));
  if (failedConditions.length > 0) {
    return evaluation(
      false,
      transitionId,
      currentState,
      transition.to as ReviewWorkflowState,
      failedConditions,
      "CONDITION_FAILED",
    );
  }

  if (transition.separationOfDuties) {
    const requiredRoles = transition.separationOfDuties.requiredRoles as ProspectusRole[];
    const distinct = new Set(
      context.reviewDecisions
        .filter((decision) => decision.status === "APPROVED" && requiredRoles.includes(decision.role))
        .map((decision) => decision.decidedBy),
    );
    if (distinct.size < transition.separationOfDuties.minimumDistinctApprovers) {
      return evaluation(
        false,
        transitionId,
        currentState,
        transition.to as ReviewWorkflowState,
        ["MINIMUM_DISTINCT_APPROVERS"],
        "SEPARATION_OF_DUTIES_FAILED",
      );
    }
  }

  return evaluation(
    true,
    transitionId,
    currentState,
    transition.to as ReviewWorkflowState,
    [],
    "ALLOWED",
  );
}

export function assertTransitionAllowed(
  transitionId: ReviewWorkflowTransitionId,
  currentState: ReviewWorkflowState,
  context: WorkflowEvaluationContext,
  mode: "HUMAN" | "AUTOMATIC" = "HUMAN",
): ReviewWorkflowState {
  const result = evaluateTransition(transitionId, currentState, context, mode);
  if (!result.allowed) {
    throw new Error(
      `WORKFLOW_TRANSITION_DENIED:${transitionId}:${result.reason}:${result.failedConditions.join(",")}`,
    );
  }
  return result.to;
}

export function availableTransitions(
  currentState: ReviewWorkflowState,
  context: WorkflowEvaluationContext,
): WorkflowTransitionEvaluation[] {
  return workflowPolicy.transitions
    .filter((transition) => (transition.from as string[]).includes(currentState))
    .map((transition) =>
      evaluateTransition(
        transition.id as ReviewWorkflowTransitionId,
        currentState,
        context,
        "HUMAN",
      ),
    );
}

export function workflowStateLabel(state: ReviewWorkflowState): string {
  return workflowPolicy.states[state].label;
}

export function workflowSubmissionEnabled(): boolean {
  return workflowPolicy.submission.enabled;
}

function conditionSatisfied(
  condition: Record<string, unknown>,
  context: WorkflowEvaluationContext,
): boolean {
  switch (condition.kind) {
    case "NO_BLOCKER":
      return context.blockers === 0;
    case "GENERATION_EXISTS":
      return context.generationExists;
    case "READY_FOR_SUBMISSION_FALSE":
      return context.readyForSubmission === false;
    case "REVIEW_REQUEST_EXISTS":
      return context.reviewRequests.includes(condition.role as ProspectusRole);
    case "REVIEW_APPROVED":
      return context.reviewDecisions.some(
        (decision) => decision.role === condition.role && decision.status === "APPROVED",
      );
    case "ALL_REQUIRED_REVIEWS_APPROVED":
      return (condition.roles as ProspectusRole[]).every((role) =>
        context.reviewDecisions.some(
          (decision) => decision.role === role && decision.status === "APPROVED",
        ),
      );
    case "NO_UNAPPROVED_ACTIVE_CLAUSE":
      return context.unapprovedActiveClauseCount === 0;
    case "CHANGES_REQUESTED_DECISION_EXISTS":
      return context.reviewDecisions.some((decision) => decision.status === "CHANGES_REQUESTED");
    case "HUMAN_INTERNAL_APPROVAL_RECORDED":
      return ["PRODUCT", "COMPLIANCE", "LEGAL"].every((role) =>
        context.humanInternalApprovalRoles.includes(role as ProspectusRole),
      );
    case "REOPEN_RATIONALE_REQUIRED":
    case "ARCHIVE_RATIONALE_REQUIRED":
      return Boolean(context.rationale?.trim());
    default:
      return false;
  }
}

function conditionKey(condition: Record<string, unknown>): string {
  const role = condition.role ? `:${condition.role}` : "";
  return `${String(condition.kind)}${role}`;
}

function evaluation(
  allowed: boolean,
  transitionId: ReviewWorkflowTransitionId,
  from: ReviewWorkflowState,
  to: ReviewWorkflowState,
  failedConditions: string[],
  reason: WorkflowTransitionEvaluation["reason"],
): WorkflowTransitionEvaluation {
  return { allowed, transitionId, from, to, failedConditions, reason };
}
