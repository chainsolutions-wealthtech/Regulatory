import { createHash, randomUUID } from "node:crypto";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import {
  assertAuthorized,
  authorize,
  roleCanDecideReview,
  type AuthorizationSubject,
  type ProspectusAction,
  type ProspectusRole,
} from "@/domain/authorization";
import type {
  AddReviewCommentInput,
  DecideReviewInput,
  RecordInternalApprovalInput,
  RequestReviewInput,
  ReviewCommentRecord,
  ReviewDecisionRecordView,
  ReviewRequestRecord,
  ReviewWorkspace,
  TransitionReviewWorkflowInput,
  WorkflowTransitionRecord,
} from "@/domain/review-types";
import {
  evaluateTransition,
  type ReviewDecisionRecord,
  type ReviewWorkflowState,
} from "@/domain/review-workflow";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";
import type { ReviewRepository } from "@/server/reviews/review-repository";

export type PostgresReviewRepositoryOptions = {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
};

type ProjectContextRow = QueryResultRow & {
  project_id: string;
  organization_id: string;
  created_by: string;
  project_status: string;
  project_version_id: string;
  version_number: number;
  frozen_at: Date | string | null;
  blockers: number;
  generation_exists: boolean;
  unapproved_active_clause_count: number;
};

export function createPostgresReviewRepository(
  options: PostgresReviewRepositoryOptions,
): ReviewRepository {
  const { pool, identityProvider } = options;
  return {
    driver: "postgresql",

    async getWorkspace(projectId) {
      return withReviewTransaction(pool, identityProvider, async (client, identity, subject) => {
        const project = await loadProjectContext(client, projectId);
        assertAuthorized(subject, "PROJECT_READ", resource(project));
        return loadWorkspace(client, project);
      });
    },

    async requestReview(input) {
      return withReviewTransaction(pool, identityProvider, async (client, identity, subject) => {
        const project = await loadProjectContext(client, input.projectId, true);
        assertVersion(input.expectedVersion, project.version_number);
        assertAuthorized(subject, "REVIEW_REQUEST", resource(project));
        assertReviewRole(input.role);
        if (input.assignedTo) {
          const assignee = await client.query(
            `select 1
               from regulatory.organization_memberships
              where organization_id = $1
                and user_id = $2
                and role = $3
                and revoked_at is null
              limit 1`,
            [identity.organizationId, input.assignedTo, input.role],
          );
          if (assignee.rowCount !== 1) throw new Error("REVIEW_ASSIGNEE_ROLE_REQUIRED");
        }
        const existing = await client.query<{ id: string }>(
          `select id
             from regulatory.review_requests
            where project_version_id = $1
              and role = $2
              and status in ('REQUESTED', 'IN_PROGRESS', 'CHANGES_REQUESTED')
            order by requested_at desc
            limit 1`,
          [project.project_version_id, input.role],
        );
        if (existing.rowCount === 0) {
          await client.query(
            `insert into regulatory.review_requests (
               organization_id, project_version_id, role, status, assigned_to,
               requested_by, requested_at, due_at, scope
             ) values ($1, $2, $3, 'REQUESTED', $4, $5, now(), $6, $7::jsonb)`,
            [
              identity.organizationId,
              project.project_version_id,
              input.role,
              input.assignedTo ?? null,
              identity.userId,
              input.dueAt ?? null,
              JSON.stringify(input.scope ?? {}),
            ],
          );
        }
        await appendAudit(client, identity, project, "REVIEW_REQUESTED", {
          role: input.role,
          assignedTo: input.assignedTo ?? null,
          dueAt: input.dueAt ?? null,
        });
        return loadWorkspace(client, project);
      });
    },

    async decideReview(input) {
      return withReviewTransaction(pool, identityProvider, async (client, identity, subject) => {
        const project = await loadProjectContext(client, input.projectId, true);
        assertVersion(input.expectedVersion, project.version_number);
        const request = await client.query<{
          id: string;
          role: ProspectusRole;
          status: string;
          assigned_to: string | null;
        }>(
          `select id, role::text as role, status::text as status, assigned_to
             from regulatory.review_requests
            where id = $1 and project_version_id = $2`,
          [input.reviewRequestId, project.project_version_id],
        );
        if (request.rowCount !== 1) throw new Error("REVIEW_REQUEST_NOT_FOUND");
        const review = request.rows[0];
        const action = reviewAction(review.role);
        if (!roleCanDecideReviewForSubject(subject, review.role)) {
          throw new Error(`REVIEW_ROLE_DECISION_DENIED:${review.role}`);
        }
        assertAuthorized(subject, action, resource(project), {
          priorActionsBySameUser:
            project.created_by === identity.userId ? ["ANSWER_WRITE"] : [],
        });
        if (review.assigned_to && review.assigned_to !== identity.userId) {
          throw new Error("REVIEW_ASSIGNED_TO_ANOTHER_USER");
        }
        if (!input.rationale.trim()) throw new Error("REVIEW_DECISION_RATIONALE_REQUIRED");
        await client.query(
          `insert into regulatory.review_decisions (
             organization_id, review_request_id, decision, rationale, decided_by,
             decided_at, finding_ids, evidence_ids
           ) values ($1, $2, $3, $4, $5, now(), $6, $7)`,
          [
            identity.organizationId,
            input.reviewRequestId,
            input.decision,
            input.rationale.trim(),
            identity.userId,
            input.findingIds ?? [],
            input.evidenceIds ?? [],
          ],
        );
        await client.query(
          `update regulatory.review_requests
              set status = $1,
                  completed_at = case when $1 in ('APPROVED', 'REJECTED') then now() else null end
            where id = $2`,
          [input.decision, input.reviewRequestId],
        );
        await appendAudit(client, identity, project, "REVIEW_DECIDED", {
          reviewRequestId: input.reviewRequestId,
          role: review.role,
          decision: input.decision,
          findingIds: input.findingIds ?? [],
          evidenceIds: input.evidenceIds ?? [],
        });
        return loadWorkspace(client, project);
      });
    },

    async addComment(input) {
      return withReviewTransaction(pool, identityProvider, async (client, identity, subject) => {
        const project = await loadProjectContext(client, input.projectId, true);
        assertVersion(input.expectedVersion, project.version_number);
        assertAuthorized(subject, "REVIEW_COMMENT", resource(project));
        if (!input.body.trim()) throw new Error("REVIEW_COMMENT_BODY_REQUIRED");
        await client.query(
          `insert into regulatory.review_comments (
             organization_id, project_version_id, review_request_id, parent_comment_id,
             author_id, body, visibility, created_at
           ) values ($1, $2, $3, $4, $5, $6, $7, now())`,
          [
            identity.organizationId,
            project.project_version_id,
            input.reviewRequestId ?? null,
            input.parentCommentId ?? null,
            identity.userId,
            input.body.trim(),
            input.visibility ?? "PROJECT_REVIEWERS",
          ],
        );
        await appendAudit(client, identity, project, "REVIEW_COMMENT_ADDED", {
          reviewRequestId: input.reviewRequestId ?? null,
          visibility: input.visibility ?? "PROJECT_REVIEWERS",
        });
        return loadWorkspace(client, project);
      });
    },

    async recordInternalApproval(input) {
      return withReviewTransaction(pool, identityProvider, async (client, identity, subject) => {
        const project = await loadProjectContext(client, input.projectId, true);
        assertVersion(input.expectedVersion, project.version_number);
        if (!subject.roles.includes(input.approvalType)) {
          throw new Error(`INTERNAL_APPROVAL_ROLE_MISMATCH:${input.approvalType}`);
        }
        const action =
          input.approvalType === "PRODUCT"
            ? "REVIEW_DECIDE_PRODUCT"
            : reviewAction(input.approvalType);
        assertAuthorized(subject, action, resource(project));
        if (!input.rationale.trim()) throw new Error("INTERNAL_APPROVAL_RATIONALE_REQUIRED");
        await client.query(
          `insert into regulatory.internal_approvals (
             organization_id, project_version_id, role, approved_by, approval_type,
             rationale, approved_at
           ) values ($1, $2, $3, $4, $5, $6, now())
           on conflict (project_version_id, approval_type) where revoked_at is null
           do update set
             role = excluded.role,
             approved_by = excluded.approved_by,
             rationale = excluded.rationale,
             approved_at = excluded.approved_at`,
          [
            identity.organizationId,
            project.project_version_id,
            input.approvalType,
            identity.userId,
            input.approvalType,
            input.rationale.trim(),
          ],
        );
        await appendAudit(client, identity, project, "INTERNAL_APPROVAL_RECORDED", {
          approvalType: input.approvalType,
        });
        return loadWorkspace(client, project);
      });
    },

    async transition(input) {
      return withReviewTransaction(pool, identityProvider, async (client, identity, subject) => {
        const project = await loadProjectContext(client, input.projectId, true);
        assertVersion(input.expectedVersion, project.version_number);
        assertAuthorized(subject, "WORKFLOW_TRANSITION", resource(project));
        const workspace = await loadWorkspace(client, project);
        const evaluation = evaluateTransition(
          input.transitionId,
          workspace.currentState,
          {
            actorRoles: subject.roles,
            actorUserId: identity.userId,
            blockers: project.blockers,
            generationExists: project.generation_exists,
            readyForSubmission: false,
            reviewRequests: workspace.requests.map((request) => request.role),
            reviewDecisions: workspace.decisions.map(
              (decision): ReviewDecisionRecord => ({
                role: decision.role,
                status: decision.decision,
                decidedBy: decision.decidedBy,
                decidedAt: decision.decidedAt,
              }),
            ),
            unapprovedActiveClauseCount: project.unapproved_active_clause_count,
            humanInternalApprovalRoles: workspace.internalApprovalRoles,
            rationale: input.rationale,
          },
          "HUMAN",
        );
        if (!evaluation.allowed) {
          throw new Error(
            `WORKFLOW_TRANSITION_DENIED:${input.transitionId}:${evaluation.reason}:${evaluation.failedConditions.join(",")}`,
          );
        }
        await client.query(
          `update regulatory.projects set status = $1, updated_at = now() where id = $2`,
          [evaluation.to, project.project_id],
        );
        if (evaluation.to === "INTERNALLY_FROZEN") {
          await client.query(
            `update regulatory.project_versions
                set frozen_at = now(), frozen_by = $1
              where id = $2 and frozen_at is null`,
            [identity.userId, project.project_version_id],
          );
        }
        await client.query(
          `insert into regulatory.project_transition_events (
             organization_id, project_id, project_version_id, transition_code,
             from_status, to_status, actor_id, actor_roles, mode, rationale,
             policy_version, evaluation, occurred_at
           ) values ($1, $2, $3, $4, $5, $6, $7, $8, 'HUMAN', $9, $10, $11::jsonb, now())`,
          [
            identity.organizationId,
            project.project_id,
            project.project_version_id,
            input.transitionId,
            evaluation.from,
            evaluation.to,
            identity.userId,
            subject.roles,
            input.rationale ?? null,
            "PROSPECTUS_REVIEW_WORKFLOW_V1",
            JSON.stringify(evaluation),
          ],
        );
        await appendAudit(client, identity, project, "WORKFLOW_TRANSITION_APPLIED", {
          transitionId: input.transitionId,
          from: evaluation.from,
          to: evaluation.to,
          evaluation,
        });
        const refreshed = { ...project, project_status: evaluation.to };
        return loadWorkspace(client, refreshed);
      });
    },
  };
}

async function withReviewTransaction<T>(
  pool: Pool,
  identityProvider: VerifiedIdentityProvider,
  operation: (
    client: PoolClient,
    identity: VerifiedIdentityContext,
    subject: AuthorizationSubject,
  ) => Promise<T>,
): Promise<T> {
  const identity = assertVerifiedIdentity(await identityProvider.getVerifiedIdentity());
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.current_organization_id', $1, true)", [
      identity.organizationId,
    ]);
    const memberships = await client.query<{ role: ProspectusRole; is_administrator: boolean }>(
      `select role::text as role, is_administrator
         from regulatory.organization_memberships
        where organization_id = $1
          and user_id = $2
          and revoked_at is null`,
      [identity.organizationId, identity.userId],
    );
    if (memberships.rowCount === 0) throw new Error("IDENTITY_ORGANIZATION_MEMBERSHIP_REQUIRED");
    const databaseRoles = memberships.rows.map((row) => row.role);
    if (memberships.rows.some((row) => row.is_administrator)) databaseRoles.push("ADMIN");
    const tokenRoles = new Set(identity.roles as ProspectusRole[]);
    const roles = [...new Set(databaseRoles.filter((role) => tokenRoles.has(role)))];
    if (memberships.rows.some((row) => row.is_administrator) && tokenRoles.has("ADMIN")) {
      roles.push("ADMIN");
    }
    if (roles.length === 0) throw new Error("IDENTITY_ROLE_MEMBERSHIP_INTERSECTION_EMPTY");
    const subject: AuthorizationSubject = {
      userId: identity.userId,
      organizationId: identity.organizationId,
      roles: [...new Set(roles)],
    };
    const result = await operation(client, identity, subject);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function loadProjectContext(
  client: PoolClient,
  projectId: string,
  forUpdate = false,
): Promise<ProjectContextRow> {
  const lock = forUpdate ? "for update of p" : "";
  const result = await client.query<ProjectContextRow>(
    `select
       p.id as project_id,
       p.organization_id,
       p.created_by,
       p.status::text as project_status,
       pv.id as project_version_id,
       pv.version_number,
       pv.frozen_at,
       coalesce(jsonb_array_length(cs.findings) filter (where cs.findings is not null), 0)::int as blockers,
       exists(select 1 from regulatory.generated_documents gd where gd.project_version_id = pv.id) as generation_exists,
       (select count(*)::int
          from regulatory.clause_versions cv
         where cv.status = 'ACTIVE'
           and (cv.approved_by is null or cv.approved_at is null)) as unapproved_active_clause_count
      from regulatory.projects p
      join lateral (
        select * from regulatory.project_versions
         where project_id = p.id
         order by version_number desc
         limit 1
      ) pv on true
      left join lateral (
        select findings
          from regulatory.canonical_snapshots
         where project_version_id = pv.id
         order by created_at desc
         limit 1
      ) cs on true
     where p.id = $1 and p.archived_at is null
     ${lock}`,
    [projectId],
  );
  if (result.rowCount !== 1) throw new Error("PROJECT_NOT_FOUND");
  const project = result.rows[0];
  const findings = await client.query<{ blockers: string }>(
    `select count(*)::text as blockers
       from jsonb_array_elements(
         coalesce((select findings from regulatory.canonical_snapshots
                   where project_version_id = $1 order by created_at desc limit 1), '[]'::jsonb)
       ) finding
      where finding->>'severity' = 'BLOCKER'`,
    [project.project_version_id],
  );
  project.blockers = Number(findings.rows[0]?.blockers ?? 0);
  return project;
}

async function loadWorkspace(
  client: PoolClient,
  project: ProjectContextRow,
): Promise<ReviewWorkspace> {
  const [requestsResult, decisionsResult, commentsResult, transitionsResult, approvalsResult] =
    await Promise.all([
      client.query<{
        id: string;
        role: ProspectusRole;
        status: ReviewRequestRecord["status"];
        assigned_to: string | null;
        requested_by: string;
        requested_at: Date | string;
        due_at: Date | string | null;
        scope: Record<string, unknown>;
      }>(
        `select id, role::text as role, status::text as status, assigned_to,
                requested_by, requested_at, due_at, scope
           from regulatory.review_requests
          where project_version_id = $1
          order by requested_at, id`,
        [project.project_version_id],
      ),
      client.query<{
        id: string;
        review_request_id: string;
        role: ProspectusRole;
        decision: ReviewDecisionRecordView["decision"];
        rationale: string;
        decided_by: string;
        decided_at: Date | string;
        finding_ids: string[];
        evidence_ids: string[];
      }>(
        `select d.id, d.review_request_id, r.role::text as role,
                d.decision::text as decision, d.rationale, d.decided_by,
                d.decided_at, d.finding_ids, d.evidence_ids
           from regulatory.review_decisions d
           join regulatory.review_requests r on r.id = d.review_request_id
          where r.project_version_id = $1
          order by d.decided_at, d.id`,
        [project.project_version_id],
      ),
      client.query<{
        id: string;
        review_request_id: string | null;
        parent_comment_id: string | null;
        author_id: string;
        body: string;
        visibility: ReviewCommentRecord["visibility"];
        created_at: Date | string;
        resolved_at: Date | string | null;
        resolved_by: string | null;
      }>(
        `select id, review_request_id, parent_comment_id, author_id, body,
                visibility, created_at, resolved_at, resolved_by
           from regulatory.review_comments
          where project_version_id = $1
          order by created_at, id`,
        [project.project_version_id],
      ),
      client.query<{
        id: string;
        transition_code: WorkflowTransitionRecord["transitionId"];
        from_status: ReviewWorkflowState;
        to_status: ReviewWorkflowState;
        actor_id: string;
        actor_roles: ProspectusRole[];
        mode: WorkflowTransitionRecord["mode"];
        rationale: string | null;
        policy_version: string;
        evaluation: Record<string, unknown>;
        occurred_at: Date | string;
      }>(
        `select id, transition_code, from_status::text as from_status,
                to_status::text as to_status, actor_id, actor_roles::text[] as actor_roles,
                mode, rationale, policy_version, evaluation, occurred_at
           from regulatory.project_transition_events
          where project_version_id = $1
          order by occurred_at, id`,
        [project.project_version_id],
      ),
      client.query<{ role: ProspectusRole }>(
        `select distinct approval_type::text as role
           from regulatory.internal_approvals
          where project_version_id = $1 and revoked_at is null`,
        [project.project_version_id],
      ),
    ]);

  const transitions: WorkflowTransitionRecord[] = transitionsResult.rows.map((row) => ({
    id: row.id,
    projectId: project.project_id,
    projectVersion: project.version_number,
    transitionId: row.transition_code,
    from: row.from_status,
    to: row.to_status,
    actorId: row.actor_id,
    actorRoles: row.actor_roles,
    mode: row.mode,
    rationale: row.rationale ?? undefined,
    policyVersion: row.policy_version,
    evaluation: row.evaluation,
    occurredAt: iso(row.occurred_at),
  }));

  return {
    projectId: project.project_id,
    projectVersion: project.version_number,
    currentState:
      transitions.at(-1)?.to ?? normalizeWorkflowState(project.project_status),
    requests: requestsResult.rows.map((row) => ({
      id: row.id,
      projectId: project.project_id,
      projectVersion: project.version_number,
      role: row.role,
      status: row.status,
      assignedTo: row.assigned_to ?? undefined,
      requestedBy: row.requested_by,
      requestedAt: iso(row.requested_at),
      dueAt: row.due_at ? iso(row.due_at) : undefined,
      scope: row.scope,
    })),
    decisions: decisionsResult.rows.map((row) => ({
      id: row.id,
      reviewRequestId: row.review_request_id,
      role: row.role,
      decision: row.decision,
      rationale: row.rationale,
      decidedBy: row.decided_by,
      decidedAt: iso(row.decided_at),
      findingIds: row.finding_ids,
      evidenceIds: row.evidence_ids,
    })),
    comments: commentsResult.rows.map((row) => ({
      id: row.id,
      projectId: project.project_id,
      projectVersion: project.version_number,
      reviewRequestId: row.review_request_id ?? undefined,
      parentCommentId: row.parent_comment_id ?? undefined,
      authorId: row.author_id,
      body: row.body,
      visibility: row.visibility,
      createdAt: iso(row.created_at),
      resolvedAt: row.resolved_at ? iso(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by ?? undefined,
    })),
    transitions,
    internalApprovalRoles: approvalsResult.rows.map((row) => row.role),
    readyForSubmission: false,
  };
}

function roleCanDecideReviewForSubject(
  subject: AuthorizationSubject,
  reviewRole: ProspectusRole,
): boolean {
  return subject.roles.some((role) => roleCanDecideReview(role, reviewRole));
}

function reviewAction(role: ProspectusRole): ProspectusAction {
  const action = `REVIEW_DECIDE_${role}` as ProspectusAction;
  if (!authorizeActionKnown(action)) throw new Error(`REVIEW_ACTION_UNDEFINED:${role}`);
  return action;
}

function authorizeActionKnown(action: string): action is ProspectusAction {
  return [
    "REVIEW_DECIDE_PRODUCT",
    "REVIEW_DECIDE_RISK",
    "REVIEW_DECIDE_COMPLIANCE",
    "REVIEW_DECIDE_LEGAL",
    "REVIEW_DECIDE_TAX",
    "REVIEW_DECIDE_OPERATIONS",
    "REVIEW_DECIDE_SECURITY",
  ].includes(action);
}

function assertReviewRole(role: ProspectusRole): void {
  if (!["RISK", "OPERATIONS", "COMPLIANCE", "LEGAL", "TAX", "SECURITY"].includes(role)) {
    throw new Error(`REVIEW_ROLE_NOT_REQUESTABLE:${role}`);
  }
}

function resource(project: ProjectContextRow) {
  return {
    organizationId: project.organization_id,
    ownerUserId: project.created_by,
    createdByUserId: project.created_by,
    status: project.project_status,
  };
}

function assertVersion(expected: number, actual: number): void {
  if (!Number.isInteger(expected) || expected <= 0) throw new Error("EXPECTED_VERSION_INVALID");
  if (expected !== actual) throw new Error(`PROJECT_VERSION_CONFLICT:${expected}:${actual}`);
}

function normalizeWorkflowState(value: string): ReviewWorkflowState {
  const states: ReviewWorkflowState[] = [
    "DRAFT",
    "QUESTIONNAIRE_IN_PROGRESS",
    "PRE_COMPLIANCE_REVIEW",
    "RISK_REVIEW",
    "OPERATIONS_REVIEW",
    "COMPLIANCE_REVIEW",
    "LEGAL_REVIEW",
    "TAX_REVIEW",
    "READY_FOR_INTERNAL_APPROVAL",
    "CHANGES_REQUESTED",
    "INTERNALLY_FROZEN",
    "ARCHIVED",
  ];
  return states.includes(value as ReviewWorkflowState)
    ? (value as ReviewWorkflowState)
    : "DRAFT";
}

async function appendAudit(
  client: PoolClient,
  identity: VerifiedIdentityContext,
  project: ProjectContextRow,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const previous = await client.query<{ event_hash: string }>(
    `select event_hash
       from regulatory.audit_events
      where organization_id = $1
      order by occurred_at desc, id desc
      limit 1`,
    [identity.organizationId],
  );
  const previousHash = previous.rows[0]?.event_hash ?? null;
  const id = randomUUID();
  const occurredAt = new Date().toISOString();
  const eventHash = createHash("sha256")
    .update(
      JSON.stringify({
        id,
        organizationId: identity.organizationId,
        projectId: project.project_id,
        versionId: project.project_version_id,
        actorId: identity.userId,
        eventType,
        payload,
        previousHash,
        occurredAt,
      }),
    )
    .digest("hex");
  await client.query(
    `insert into regulatory.audit_events (
       id, organization_id, project_id, project_version_id, actor_id,
       event_type, entity_type, entity_id, occurred_at, payload,
       previous_hash, event_hash
     ) values ($1, $2, $3, $4, $5, $6, 'review_workflow', $7, $8, $9::jsonb, $10, $11)`,
    [
      id,
      identity.organizationId,
      project.project_id,
      project.project_version_id,
      identity.userId,
      eventType,
      project.project_id,
      occurredAt,
      JSON.stringify(payload),
      previousHash,
      eventHash,
    ],
  );
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
