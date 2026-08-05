import type { ProspectusRole } from "@/domain/authorization";
import type {
  ReviewDecisionStatus,
  ReviewWorkflowState,
  ReviewWorkflowTransitionId,
} from "@/domain/review-workflow";

export type ReviewRequestRecord = {
  id: string;
  projectId: string;
  projectVersion: number;
  role: ProspectusRole;
  status: ReviewDecisionStatus;
  assignedTo?: string;
  requestedBy: string;
  requestedAt: string;
  dueAt?: string;
  scope: Record<string, unknown>;
};

export type ReviewDecisionRecordView = {
  id: string;
  reviewRequestId: string;
  role: ProspectusRole;
  decision: ReviewDecisionStatus;
  rationale: string;
  decidedBy: string;
  decidedAt: string;
  findingIds: string[];
  evidenceIds: string[];
};

export type ReviewCommentRecord = {
  id: string;
  projectId: string;
  projectVersion: number;
  reviewRequestId?: string;
  parentCommentId?: string;
  authorId: string;
  body: string;
  visibility: "PROJECT_REVIEWERS" | "ROLE_ONLY" | "AUDIT_ONLY";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

export type WorkflowTransitionRecord = {
  id: string;
  projectId: string;
  projectVersion: number;
  transitionId: ReviewWorkflowTransitionId;
  from: ReviewWorkflowState;
  to: ReviewWorkflowState;
  actorId: string;
  actorRoles: ProspectusRole[];
  mode: "HUMAN" | "AUTOMATIC";
  rationale?: string;
  policyVersion: string;
  evaluation: Record<string, unknown>;
  occurredAt: string;
};

export type ReviewWorkspace = {
  projectId: string;
  projectVersion: number;
  currentState: ReviewWorkflowState;
  requests: ReviewRequestRecord[];
  decisions: ReviewDecisionRecordView[];
  comments: ReviewCommentRecord[];
  transitions: WorkflowTransitionRecord[];
  internalApprovalRoles: ProspectusRole[];
  readyForSubmission: false;
};

export type RequestReviewInput = {
  projectId: string;
  expectedVersion: number;
  role: ProspectusRole;
  assignedTo?: string;
  dueAt?: string;
  scope?: Record<string, unknown>;
};

export type DecideReviewInput = {
  projectId: string;
  expectedVersion: number;
  reviewRequestId: string;
  decision: Extract<ReviewDecisionStatus, "APPROVED" | "CHANGES_REQUESTED" | "REJECTED">;
  rationale: string;
  findingIds?: string[];
  evidenceIds?: string[];
};

export type AddReviewCommentInput = {
  projectId: string;
  expectedVersion: number;
  reviewRequestId?: string;
  parentCommentId?: string;
  body: string;
  visibility?: ReviewCommentRecord["visibility"];
};

export type TransitionReviewWorkflowInput = {
  projectId: string;
  expectedVersion: number;
  transitionId: ReviewWorkflowTransitionId;
  rationale?: string;
};
