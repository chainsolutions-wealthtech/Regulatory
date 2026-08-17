import "server-only";

import { createPostgresClauseProposalRepository } from "@/server/clauses/postgres-clause-proposal-repository";
import type { ClauseProposalRepository } from "@/server/clauses/clause-proposal-repository";
import { unavailableClauseProposalRepository } from "@/server/clauses/unavailable-clause-proposal-repository";
import {
  getRuntimeIdentityProvider,
  getRuntimePostgresPool,
  regulatoryStorageDriver,
} from "@/server/storage";

export function getClauseProposalRepository(): ClauseProposalRepository {
  if (regulatoryStorageDriver !== "postgresql") return unavailableClauseProposalRepository;
  return createPostgresClauseProposalRepository({
    pool: getRuntimePostgresPool(),
    identityProvider: getRuntimeIdentityProvider(),
  });
}

export const clauseProposalRepository = getClauseProposalRepository();
