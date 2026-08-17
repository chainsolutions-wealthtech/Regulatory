import "server-only";

import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { assertAuthorized } from "@/domain/authorization";
import type { ImportPromotionReceipt, ImportPromotionRepository } from "@/server/import/import-promotion-repository";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";
import type { ArtifactStore } from "@/server/storage/artifact-store";
import { createPostgresProjectRepository } from "@/server/storage/postgres-project-repository";

export function createPostgresImportPromotionRepository(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
}): ImportPromotionRepository {
  return {
    async promoteConfirmedValue(command) {
      if (!command.questionId.trim()) throw new Error("IMPORT_PROMOTION_QUESTION_ID_REQUIRED");
      if (!Number.isInteger(command.expectedVersion) || command.expectedVersion < 1) {
        throw new Error("IMPORT_PROMOTION_EXPECTED_VERSION_REQUIRED");
      }

      const identity = assertVerifiedIdentity(await input.identityProvider.getVerifiedIdentity());
      const client = await input.pool.connect();
      try {
        await client.query("begin");
        await establishTenantContext(client, identity);
        assertAuthorized(identity, "ANSWER_WRITE", { organizationId: identity.organizationId });

        const staged = await client.query<{
          project_id: string;
          evidence_object_id: string;
          evidence_sha256: string;
          canonical_write_allowed: boolean;
          ready_for_submission: boolean;
          extracted_value: unknown;
          review_status: string;
          reviewed_by: string | null;
        }>(
          `select b.project_id, b.evidence_object_id, b.evidence_sha256,
                  b.canonical_write_allowed, b.ready_for_submission,
                  v.extracted_value, v.review_status, v.reviewed_by
             from regulatory.prospectus_import_batches b
             join regulatory.prospectus_import_values v
               on v.import_batch_id = b.id
            where b.id = $1
              and v.id = $2
              and b.project_id = $3
            for update of b, v`,
          [command.importId, command.importValueId, command.projectId],
        );
        if (staged.rowCount !== 1) throw new Error("IMPORT_PROMOTION_SCOPE_MISMATCH");
        const source = staged.rows[0];
        if (source.canonical_write_allowed !== false || source.ready_for_submission !== false) {
          throw new Error("IMPORT_PROMOTION_STAGING_GATES_INVALID");
        }
        if (source.review_status !== "CONFIRMED_BY_HUMAN" || !source.reviewed_by) {
          throw new Error("IMPORT_VALUE_NOT_HUMAN_CONFIRMED");
        }

        const duplicate = await client.query(
          `select 1
             from regulatory.import_value_promotions
            where import_value_id = $1
            limit 1`,
          [command.importValueId],
        );
        if (duplicate.rowCount === 1) throw new Error("IMPORT_VALUE_ALREADY_PROMOTED");

        const transactionalProjectRepository = createPostgresProjectRepository({
          pool: createSavepointPool(client),
          identityProvider: fixedIdentityProvider(identity),
          artifactStore: forbiddenArtifactStore,
        });
        const project = await transactionalProjectRepository.saveAnswer({
          projectId: command.projectId,
          questionId: command.questionId.trim(),
          value: source.extracted_value,
          expectedVersion: command.expectedVersion,
          updatedBy: identity.userId,
        });

        const version = await client.query<{ id: string }>(
          `select id
             from regulatory.project_versions
            where project_id = $1 and version_number = $2`,
          [command.projectId, project.version],
        );
        if (version.rowCount !== 1) throw new Error("IMPORT_PROMOTION_PROJECT_VERSION_NOT_FOUND");

        const promotionId = randomUUID();
        const promotedAt = new Date().toISOString();
        await client.query(
          `insert into regulatory.import_value_promotions (
             id, organization_id, project_id, project_version_id,
             import_batch_id, import_value_id, question_id,
             source_evidence_object_id, source_sha256, promoted_value,
             reviewed_by_user_id, promoted_by_user_id, promoted_at, ready_for_submission
           ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,false)`,
          [
            promotionId,
            identity.organizationId,
            command.projectId,
            version.rows[0].id,
            command.importId,
            command.importValueId,
            command.questionId.trim(),
            source.evidence_object_id,
            source.evidence_sha256,
            JSON.stringify(source.extracted_value),
            source.reviewed_by,
            identity.userId,
            promotedAt,
          ],
        );

        const receipt: ImportPromotionReceipt = {
          promotionId,
          projectId: command.projectId,
          projectVersion: project.version,
          importId: command.importId,
          importValueId: command.importValueId,
          questionId: command.questionId.trim(),
          sourceSha256: source.evidence_sha256,
          reviewedByUserId: source.reviewed_by,
          promotedByUserId: identity.userId,
          promotedAt,
          readyForSubmission: false,
        };
        await client.query("commit");
        return receipt;
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

async function establishTenantContext(
  client: PoolClient,
  identity: VerifiedIdentityContext,
): Promise<void> {
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
}

function fixedIdentityProvider(identity: VerifiedIdentityContext): VerifiedIdentityProvider {
  return {
    async getVerifiedIdentity() {
      return identity;
    },
  };
}

/**
 * Reuses the existing project repository inside the outer promotion transaction.
 * Its transaction boundary becomes a PostgreSQL savepoint: answer versioning,
 * canonical snapshot persistence and project audit stay exactly on the proven
 * code path, while the promotion receipt is still committed atomically with it.
 */
function createSavepointPool(client: PoolClient): Pool {
  const savepoint = "import_promotion_answer_write";
  const nestedClient = new Proxy(client, {
    get(target, property, receiver) {
      if (property === "release") return () => undefined;
      if (property !== "query") return Reflect.get(target, property, receiver);
      return async (query: unknown, ...args: unknown[]) => {
        if (typeof query === "string") {
          const normalized = query.trim().toLowerCase();
          if (normalized === "begin") return target.query(`savepoint ${savepoint}`);
          if (normalized === "commit") return target.query(`release savepoint ${savepoint}`);
          if (normalized === "rollback") {
            return target.query(`rollback to savepoint ${savepoint}`);
          }
        }
        return (target.query as (...queryArgs: unknown[]) => Promise<unknown>)(query, ...args);
      };
    },
  });
  return {
    async connect() {
      return nestedClient;
    },
  } as unknown as Pool;
}

const forbiddenArtifactStore: ArtifactStore = {
  async stage() {
    throw new Error("IMPORT_PROMOTION_ARTIFACT_STAGE_FORBIDDEN");
  },
  async read() {
    throw new Error("IMPORT_PROMOTION_ARTIFACT_READ_FORBIDDEN");
  },
};
