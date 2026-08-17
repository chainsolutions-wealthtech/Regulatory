import "server-only";

import type { ClauseProposalRepository } from "@/server/clauses/clause-proposal-repository";

const unavailable = async (): Promise<never> => {
  throw new Error(
    "CLAUSE_PROPOSAL_REPOSITORY_UNAVAILABLE: configure PostgreSQL and a verified OIDC identity before using tenant clause proposals.",
  );
};

export const unavailableClauseProposalRepository: ClauseProposalRepository = {
  list: unavailable,
  get: unavailable,
  create: unavailable,
  requestLegalReview: unavailable,
  approve: unavailable,
};
