import "server-only";

export type ClauseProposalStatus = "DRAFT" | "DRAFT_LEGAL_REVIEW_REQUIRED" | "APPROVED";

export type ClauseProposalVersion = {
  versionId: string;
  versionNumber: number;
  priorVersionId?: string;
  wording: string;
  status: ClauseProposalStatus;
  transitionEvent: "CREATE_DRAFT" | "REQUEST_LEGAL_REVIEW" | "APPROVE";
  actorUserId: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  readyForSubmission: false;
};

export type ClauseProposal = {
  proposalId: string;
  organizationId: string;
  sourceClauseId: string;
  sourceCatalogDigest: string;
  sourceWording: string;
  createdBy: string;
  createdAt: string;
  currentVersion: number;
  status: ClauseProposalStatus;
  wording: string;
  approvedBy?: string;
  approvedAt?: string;
  versions: ClauseProposalVersion[];
  readyForSubmission: false;
};

export interface ClauseProposalRepository {
  list(): Promise<ClauseProposal[]>;
  get(proposalId: string): Promise<ClauseProposal | null>;
  create(input: { sourceClauseId: string; wording: string }): Promise<ClauseProposal>;
  requestLegalReview(input: { proposalId: string; expectedVersion: number }): Promise<ClauseProposal>;
  approve(input: { proposalId: string; expectedVersion: number }): Promise<ClauseProposal>;
}
