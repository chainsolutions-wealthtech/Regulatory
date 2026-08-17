import {
  authorize,
  rolesForAction,
  type AuthorizationDecision,
  type AuthorizationResource,
  type AuthorizationSubject,
  type ProspectusAction,
} from "@/domain/authorization";

export type ClauseLifecycleStatus =
  | "DRAFT"
  | "DRAFT_LEGAL_REVIEW_REQUIRED"
  | "APPROVED"
  | "ACTIVE"
  | "RETIRED";

export type ClauseLifecycleEvent = "REQUEST_LEGAL_REVIEW" | "APPROVE" | "ACTIVATE";
export type ClauseTransitionMode = "HUMAN" | "AUTOMATIC";

export type ClauseLifecycleContext = {
  actor: AuthorizationSubject;
  resource: AuthorizationResource;
  priorActionsBySameUser?: ProspectusAction[];
};

export type ClauseTransitionDecision = {
  allowed: boolean;
  event: ClauseLifecycleEvent;
  currentStatus: ClauseLifecycleStatus;
  nextStatus: ClauseLifecycleStatus;
  reason:
    | AuthorizationDecision["reason"]
    | "DENIED_AUTOMATIC_TRANSITION"
    | "DENIED_INVALID_STATUS";
  requiredAction: ProspectusAction;
  readyForSubmission: false;
};

export const CLAUSE_LIFECYCLE_STATUSES: readonly ClauseLifecycleStatus[] = [
  "DRAFT",
  "DRAFT_LEGAL_REVIEW_REQUIRED",
  "APPROVED",
  "ACTIVE",
  "RETIRED",
] as const;

export const CLAUSE_LIFECYCLE_TRANSITIONS: Readonly<
  Record<
    ClauseLifecycleEvent,
    {
      from: ClauseLifecycleStatus;
      to: ClauseLifecycleStatus;
      action: ProspectusAction;
    }
  >
> = {
  REQUEST_LEGAL_REVIEW: {
    from: "DRAFT",
    to: "DRAFT_LEGAL_REVIEW_REQUIRED",
    action: "CLAUSE_DRAFT",
  },
  APPROVE: {
    from: "DRAFT_LEGAL_REVIEW_REQUIRED",
    to: "APPROVED",
    action: "CLAUSE_APPROVE",
  },
  ACTIVATE: {
    from: "APPROVED",
    to: "ACTIVE",
    action: "CLAUSE_ACTIVATE",
  },
};

/**
 * Évalue une transition de clause sans persistance.
 *
 * Toute transition est humaine dans la baseline V1. L'activation est décrite
 * dans le modèle mais reste effectivement fermée tant que la politique RBAC ne
 * donne CLAUSE_ACTIVATE à aucun rôle. Le moteur ne modifie jamais le flag de
 * soumission réglementaire.
 */
export function evaluateClauseTransition(
  event: ClauseLifecycleEvent,
  currentStatus: ClauseLifecycleStatus,
  context: ClauseLifecycleContext,
  mode: ClauseTransitionMode = "HUMAN",
): ClauseTransitionDecision {
  const transition = CLAUSE_LIFECYCLE_TRANSITIONS[event];

  if (mode !== "HUMAN") {
    return denied(
      event,
      currentStatus,
      currentStatus,
      transition.action,
      "DENIED_AUTOMATIC_TRANSITION",
    );
  }

  if (currentStatus !== transition.from) {
    return denied(
      event,
      currentStatus,
      currentStatus,
      transition.action,
      "DENIED_INVALID_STATUS",
    );
  }

  const authorization = authorize(context.actor, transition.action, context.resource, {
    priorActionsBySameUser: context.priorActionsBySameUser ?? [],
  });
  if (!authorization.allowed) {
    return denied(
      event,
      currentStatus,
      currentStatus,
      transition.action,
      authorization.reason,
    );
  }

  return {
    allowed: true,
    event,
    currentStatus,
    nextStatus: transition.to,
    reason: "ALLOWED_BY_ROLE",
    requiredAction: transition.action,
    readyForSubmission: false,
  };
}

export function assertClauseTransitionAllowed(
  event: ClauseLifecycleEvent,
  currentStatus: ClauseLifecycleStatus,
  context: ClauseLifecycleContext,
  mode: ClauseTransitionMode = "HUMAN",
): ClauseLifecycleStatus {
  const decision = evaluateClauseTransition(event, currentStatus, context, mode);
  if (!decision.allowed) {
    throw new Error(`CLAUSE_TRANSITION_DENIED:${event}:${currentStatus}:${decision.reason}`);
  }
  return decision.nextStatus;
}

export function clauseLifecyclePublicMetadata() {
  const activationRoles = rolesForAction("CLAUSE_ACTIVATE");
  return {
    statuses: [...CLAUSE_LIFECYCLE_STATUSES],
    transitions: Object.fromEntries(
      Object.entries(CLAUSE_LIFECYCLE_TRANSITIONS).map(([event, transition]) => [
        event,
        {
          from: transition.from,
          to: transition.to,
          requiredAction: transition.action,
        },
      ]),
    ),
    humanOnly: true,
    automaticTransitionsAllowed: false,
    activationAllowed: activationRoles.length > 0,
    activationGrantCount: activationRoles.length,
    activationRoles,
    readyForSubmission: false,
  };
}

function denied(
  event: ClauseLifecycleEvent,
  currentStatus: ClauseLifecycleStatus,
  nextStatus: ClauseLifecycleStatus,
  requiredAction: ProspectusAction,
  reason: ClauseTransitionDecision["reason"],
): ClauseTransitionDecision {
  return {
    allowed: false,
    event,
    currentStatus,
    nextStatus,
    reason,
    requiredAction,
    readyForSubmission: false,
  };
}
