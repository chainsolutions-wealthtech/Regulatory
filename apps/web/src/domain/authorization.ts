import rbacPolicy from "../../../../policies/rbac/PROSPECTUS_RBAC_V1.json";

export type ProspectusRole = keyof typeof rbacPolicy.roles;
export type ProspectusAction = keyof typeof rbacPolicy.actions;

type ActionPolicy = {
  resource: string;
  sensitive: boolean;
  disabled?: boolean;
};

const actionPolicies = rbacPolicy.actions as Record<ProspectusAction, ActionPolicy>;

export type AuthorizationSubject = {
  userId: string;
  organizationId: string;
  roles: ProspectusRole[];
};

export type AuthorizationResource = {
  organizationId: string;
  ownerUserId?: string;
  createdByUserId?: string;
  assignedUserId?: string;
  status?: string;
};

export type AuthorizationDecision = {
  allowed: boolean;
  action: ProspectusAction;
  matchedRoles: ProspectusRole[];
  reason:
    | "ALLOWED_BY_ROLE"
    | "DENIED_ACTION_DISABLED"
    | "DENIED_TENANT_MISMATCH"
    | "DENIED_NO_GRANT"
    | "DENIED_SEPARATION_OF_DUTIES";
  policyVersion: string;
};

const allRoles = Object.keys(rbacPolicy.roles) as ProspectusRole[];
const allActions = Object.keys(rbacPolicy.actions) as ProspectusAction[];

export function authorize(
  subject: AuthorizationSubject,
  action: ProspectusAction,
  resource: AuthorizationResource,
  context: {
    priorActionsBySameUser?: ProspectusAction[];
    targetUserId?: string;
  } = {},
): AuthorizationDecision {
  validateSubject(subject);
  if (!allActions.includes(action)) throw new Error(`RBAC_ACTION_UNKNOWN:${action}`);
  if (subject.organizationId !== resource.organizationId) {
    return decision(false, action, [], "DENIED_TENANT_MISMATCH");
  }
  if (actionPolicies[action].disabled === true) {
    return decision(false, action, [], "DENIED_ACTION_DISABLED");
  }

  const expandedRoles = expandRoles(subject.roles);
  const matchedRoles = expandedRoles.filter((role) =>
    (rbacPolicy.grants[role] as readonly string[]).includes(action),
  );
  if (matchedRoles.length === 0) {
    return decision(false, action, [], "DENIED_NO_GRANT");
  }

  if (
    violatesSeparationOfDuties(subject, action, resource, {
      priorActionsBySameUser: context.priorActionsBySameUser ?? [],
      targetUserId: context.targetUserId,
    })
  ) {
    return decision(false, action, matchedRoles, "DENIED_SEPARATION_OF_DUTIES");
  }
  return decision(true, action, matchedRoles, "ALLOWED_BY_ROLE");
}

export function assertAuthorized(
  subject: AuthorizationSubject,
  action: ProspectusAction,
  resource: AuthorizationResource,
  context?: Parameters<typeof authorize>[3],
): void {
  const result = authorize(subject, action, resource, context);
  if (!result.allowed) {
    throw new Error(`AUTHORIZATION_DENIED:${action}:${result.reason}`);
  }
}

export function expandRoles(roles: ProspectusRole[]): ProspectusRole[] {
  const expanded = new Set<ProspectusRole>();
  const visit = (role: ProspectusRole) => {
    if (expanded.has(role)) return;
    if (!allRoles.includes(role)) throw new Error(`RBAC_ROLE_UNKNOWN:${role}`);
    expanded.add(role);
    for (const inherited of rbacPolicy.roles[role].inherits as ProspectusRole[]) visit(inherited);
  };
  for (const role of roles) visit(role);
  return [...expanded];
}

export function actionsForRoles(roles: ProspectusRole[]): ProspectusAction[] {
  const actions = new Set<ProspectusAction>();
  for (const role of expandRoles(roles)) {
    for (const action of rbacPolicy.grants[role] as ProspectusAction[]) {
      if (actionPolicies[action].disabled !== true) actions.add(action);
    }
  }
  return [...actions].toSorted();
}

/**
 * Retourne uniquement les rôles explicitement capables d'exécuter une action
 * avec la politique courante. Les actions désactivées retournent toujours une
 * liste vide. Cette fonction permet aux surfaces read-only de publier l'état
 * réel d'un gate RBAC sans dupliquer les grants dans l'API ou la documentation.
 */
export function rolesForAction(action: ProspectusAction): ProspectusRole[] {
  if (!allActions.includes(action)) throw new Error(`RBAC_ACTION_UNKNOWN:${action}`);
  if (actionPolicies[action].disabled === true) return [];
  return allRoles
    .filter((role) => actionsForRoles([role]).includes(action))
    .toSorted();
}

export function roleCanDecideReview(role: ProspectusRole, reviewRole: ProspectusRole): boolean {
  const action = `REVIEW_DECIDE_${reviewRole}` as ProspectusAction;
  return allActions.includes(action) && actionsForRoles([role]).includes(action);
}

function violatesSeparationOfDuties(
  subject: AuthorizationSubject,
  action: ProspectusAction,
  resource: AuthorizationResource,
  context: { priorActionsBySameUser: ProspectusAction[]; targetUserId?: string },
): boolean {
  if (
    action === "CLAUSE_APPROVE" &&
    resource.createdByUserId === subject.userId &&
    context.priorActionsBySameUser.includes("CLAUSE_DRAFT")
  ) {
    return true;
  }
  if (
    action === "REVIEW_DECIDE_COMPLIANCE" &&
    resource.ownerUserId === subject.userId &&
    context.priorActionsBySameUser.includes("ANSWER_WRITE")
  ) {
    return true;
  }
  if (action === "REVIEW_ASSIGN" && context.targetUserId === subject.userId) {
    return false;
  }
  return false;
}

function validateSubject(subject: AuthorizationSubject): void {
  if (!subject.userId.trim()) throw new Error("AUTHORIZATION_USER_REQUIRED");
  if (!subject.organizationId.trim()) throw new Error("AUTHORIZATION_ORGANIZATION_REQUIRED");
  if (!Array.isArray(subject.roles) || subject.roles.length === 0) {
    throw new Error("AUTHORIZATION_ROLE_REQUIRED");
  }
  for (const role of subject.roles) {
    if (!allRoles.includes(role)) throw new Error(`RBAC_ROLE_UNKNOWN:${role}`);
  }
}

function decision(
  allowed: boolean,
  action: ProspectusAction,
  matchedRoles: ProspectusRole[],
  reason: AuthorizationDecision["reason"],
): AuthorizationDecision {
  return {
    allowed,
    action,
    matchedRoles,
    reason,
    policyVersion: rbacPolicy.schemaVersion,
  };
}
