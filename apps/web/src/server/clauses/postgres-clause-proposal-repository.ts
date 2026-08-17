import "server-only";

import { randomUUID } from "node:crypto";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import { getClauseById, CLAUSE_CATALOG_METADATA } from "@/domain/clause-catalog";
import { assertClauseTransitionAllowed, type ClauseLifecycleEvent } from "@/domain/clause-lifecycle";
import { assertAuthorized, type ProspectusRole } from "@/domain/authorization";
import type {
  ClauseProposal,
  ClauseProposalRepository,
  ClauseProposalStatus,
  ClauseProposalVersion,
} from "@/server/clauses/clause-proposal-repository";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

type ProposalRow = QueryResultRow & {
  id: string;
  organization_id: string;
  source_clause_id: string;
  source_catalog_digest: string;
  source_wording: string;
  created_by: string;
  created_at: Date | string;
};

type VersionRow = QueryResultRow & {
  id: string;
  version_number: number;
  prior_version_id: string | null;
  wording: string;
  status: ClauseProposalStatus;
  transition_event: ClauseProposalVersion["transitionEvent"];
  actor_user_id: string;
  approved_by: string | null;
  approved_at: Date | string | null;
  created_at: Date | string;
  ready_for_submission: false;
};

export function createPostgresClauseProposalRepository(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
}): ClauseProposalRepository {
  return {
    async list() {
      return withTenantTransaction(input, true, async (client, identity) => {
        assertAction(identity, "CLAUSE_READ");
        const result = await client.query<{ id: string }>(
          `select id
             from regulatory.clause_proposals
            order by created_at desc, id`,
        );
        const proposals: ClauseProposal[] = [];
        for (const row of result.rows) {
          const proposal = await readProposal(client, row.id);
          if (proposal) proposals.push(proposal);
        }
        return proposals;
      });
    },

    async get(proposalId) {
      return withTenantTransaction(input, true, async (client, identity) => {
        assertAction(identity, "CLAUSE_READ");
        return readProposal(client, proposalId);
      });
    },

    async create({ sourceClauseId, wording }) {
      const sourceClause = getClauseById(sourceClauseId.trim());
      if (!sourceClause) throw new Error("CLAUSE_PROPOSAL_SOURCE_CLAUSE_NOT_FOUND");
      const normalizedWording = wording.trim();
      if (!normalizedWording) throw new Error("CLAUSE_PROPOSAL_WORDING_REQUIRED");

      return withTenantTransaction(input, false, async (client, identity) => {
        assertAction(identity, "CLAUSE_DRAFT");
        const now = new Date().toISOString();
        const proposalId = randomUUID();
        const versionId = randomUUID();
        await client.query(
          `insert into regulatory.clause_proposals (
             id, organization_id, source_clause_id, source_catalog_digest,
             source_wording, created_by, created_at
           ) values ($1,$2,$3,$4,$5,$6,$7)`,
          [
            proposalId,
            identity.organizationId,
            sourceClause.clauseId,
            CLAUSE_CATALOG_METADATA.catalogDigest,
            sourceClause.wording,
            identity.userId,
            now,
          ],
        );
        await client.query(
          `insert into regulatory.clause_proposal_versions (
             id, organization_id, proposal_id, version_number, prior_version_id,
             wording, status, transition_event, actor_user_id,
             approved_by, approved_at, ready_for_submission, created_at
           ) values ($1,$2,$3,1,null,$4,'DRAFT','CREATE_DRAFT',$5,null,null,false,$6)`,
          [versionId, identity.organizationId, proposalId, normalizedWording, identity.userId, now],
        );
        return requireProposal(client, proposalId);
      });
    },

    async requestLegalReview({ proposalId, expectedVersion }) {
      return transitionProposal(input, {
        proposalId,
        expectedVersion,
        event: "REQUEST_LEGAL_REVIEW",
      });
    },

    async approve({ proposalId, expectedVersion }) {
      return transitionProposal(input, {
        proposalId,
        expectedVersion,
        event: "APPROVE",
      });
    },
  };
}

async function transitionProposal(
  repositoryInput: { pool: Pool; identityProvider: VerifiedIdentityProvider },
  command: {
    proposalId: string;
    expectedVersion: number;
    event: Extract<ClauseLifecycleEvent, "REQUEST_LEGAL_REVIEW" | "APPROVE">;
  },
): Promise<ClauseProposal> {
  if (!Number.isInteger(command.expectedVersion) || command.expectedVersion < 1) {
    throw new Error("CLAUSE_PROPOSAL_EXPECTED_VERSION_REQUIRED");
  }
  return withTenantTransaction(repositoryInput, false, async (client, identity) => {
    const locked = await loadProposalForUpdate(client, command.proposalId);
    if (!locked) throw new Error("CLAUSE_PROPOSAL_NOT_FOUND");
    if (locked.version.version_number !== command.expectedVersion) {
      throw new Error(
        `CLAUSE_PROPOSAL_VERSION_CONFLICT:${command.expectedVersion}:${locked.version.version_number}`,
      );
    }

    const nextStatus = assertClauseTransitionAllowed(
      command.event,
      locked.version.status,
      {
        actor: authorizationSubject(identity),
        resource: {
          organizationId: identity.organizationId,
          createdByUserId: locked.proposal.created_by,
        },
        priorActionsBySameUser:
          identity.userId === locked.proposal.created_by ? ["CLAUSE_DRAFT"] : [],
      },
      "HUMAN",
    );

    const now = new Date().toISOString();
    const nextVersionId = randomUUID();
    const nextVersionNumber = locked.version.version_number + 1;
    const approved = command.event === "APPROVE";
    await client.query(
      `insert into regulatory.clause_proposal_versions (
         id, organization_id, proposal_id, version_number, prior_version_id,
         wording, status, transition_event, actor_user_id,
         approved_by, approved_at, ready_for_submission, created_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,$12)`,
      [
        nextVersionId,
        identity.organizationId,
        command.proposalId,
        nextVersionNumber,
        locked.version.id,
        locked.version.wording,
        nextStatus,
        command.event,
        identity.userId,
        approved ? identity.userId : null,
        approved ? now : null,
        now,
      ],
    );
    return requireProposal(client, command.proposalId);
  });
}

async function loadProposalForUpdate(
  client: PoolClient,
  proposalId: string,
): Promise<{ proposal: ProposalRow; version: VersionRow } | null> {
  const proposal = await client.query<ProposalRow>(
    `select * from regulatory.clause_proposals where id = $1 for update`,
    [proposalId],
  );
  if (proposal.rowCount !== 1) return null;
  const version = await client.query<VersionRow>(
    `select *
       from regulatory.clause_proposal_versions
      where proposal_id = $1
      order by version_number desc
      limit 1
      for update`,
    [proposalId],
  );
  if (version.rowCount !== 1) throw new Error("CLAUSE_PROPOSAL_VERSION_NOT_FOUND");
  return { proposal: proposal.rows[0], version: version.rows[0] };
}

async function requireProposal(client: PoolClient, proposalId: string): Promise<ClauseProposal> {
  const proposal = await readProposal(client, proposalId);
  if (!proposal) throw new Error("CLAUSE_PROPOSAL_NOT_FOUND");
  return proposal;
}

async function readProposal(client: PoolClient, proposalId: string): Promise<ClauseProposal | null> {
  const proposalResult = await client.query<ProposalRow>(
    `select * from regulatory.clause_proposals where id = $1`,
    [proposalId],
  );
  if (proposalResult.rowCount !== 1) return null;
  const versionResult = await client.query<VersionRow>(
    `select *
       from regulatory.clause_proposal_versions
      where proposal_id = $1
      order by version_number`,
    [proposalId],
  );
  if ((versionResult.rowCount ?? 0) < 1) throw new Error("CLAUSE_PROPOSAL_VERSION_NOT_FOUND");

  const proposal = proposalResult.rows[0];
  const versions: ClauseProposalVersion[] = versionResult.rows.map((version) => ({
    versionId: version.id,
    versionNumber: Number(version.version_number),
    ...(version.prior_version_id ? { priorVersionId: version.prior_version_id } : {}),
    wording: version.wording,
    status: version.status,
    transitionEvent: version.transition_event,
    actorUserId: version.actor_user_id,
    ...(version.approved_by ? { approvedBy: version.approved_by } : {}),
    ...(version.approved_at ? { approvedAt: toIso(version.approved_at) } : {}),
    createdAt: toIso(version.created_at),
    readyForSubmission: false,
  }));
  const current = versions.at(-1)!;
  return {
    proposalId: proposal.id,
    organizationId: proposal.organization_id,
    sourceClauseId: proposal.source_clause_id,
    sourceCatalogDigest: proposal.source_catalog_digest,
    sourceWording: proposal.source_wording,
    createdBy: proposal.created_by,
    createdAt: toIso(proposal.created_at),
    currentVersion: current.versionNumber,
    status: current.status,
    wording: current.wording,
    ...(current.approvedBy ? { approvedBy: current.approvedBy } : {}),
    ...(current.approvedAt ? { approvedAt: current.approvedAt } : {}),
    versions,
    readyForSubmission: false,
  };
}

async function withTenantTransaction<T>(
  repositoryInput: { pool: Pool; identityProvider: VerifiedIdentityProvider },
  readOnly: boolean,
  work: (client: PoolClient, identity: VerifiedIdentityContext) => Promise<T>,
): Promise<T> {
  const identity = assertVerifiedIdentity(await repositoryInput.identityProvider.getVerifiedIdentity());
  const client = await repositoryInput.pool.connect();
  try {
    await client.query(readOnly ? "begin read only" : "begin");
    await client.query("select set_config('app.current_organization_id', $1, true)", [
      identity.organizationId,
    ]);
    const membership = await client.query(
      `select 1
         from regulatory.organization_memberships
        where organization_id = $1
          and user_id = $2
          and revoked_at is null
        limit 1`,
      [identity.organizationId, identity.userId],
    );
    if (membership.rowCount !== 1) throw new Error("ORGANIZATION_MEMBERSHIP_REQUIRED");
    const result = await work(client, identity);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function assertAction(identity: VerifiedIdentityContext, action: "CLAUSE_READ" | "CLAUSE_DRAFT"): void {
  assertAuthorized(authorizationSubject(identity), action, {
    organizationId: identity.organizationId,
  });
}

function authorizationSubject(identity: VerifiedIdentityContext) {
  return {
    userId: identity.userId,
    organizationId: identity.organizationId,
    roles: identity.roles as ProspectusRole[],
  };
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
