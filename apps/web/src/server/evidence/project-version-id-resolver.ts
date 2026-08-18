import "server-only";

import type { Pool } from "pg";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

export interface ProjectVersionIdResolver {
  resolve(projectId: string, version: number): Promise<string>;
}

export function createPostgresProjectVersionIdResolver(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
}): ProjectVersionIdResolver {
  return {
    async resolve(projectId: string, version: number) {
      if (!projectId.trim() || !Number.isInteger(version) || version < 1) {
        throw new Error("PROJECT_VERSION_RESOLUTION_INPUT_INVALID");
      }
      const identity = assertVerifiedIdentity(await input.identityProvider.getVerifiedIdentity());
      const client = await input.pool.connect();
      try {
        await client.query("begin read only");
        await client.query("select set_config('app.current_organization_id', $1, true)", [identity.organizationId]);
        const membership = await client.query(
          `select 1 from regulatory.organization_memberships
            where organization_id = $1 and user_id = $2 and revoked_at is null
            limit 1`,
          [identity.organizationId, identity.userId],
        );
        if (membership.rowCount !== 1) throw new Error("IDENTITY_ORGANIZATION_MEMBERSHIP_REQUIRED");
        const result = await client.query<{ id: string }>(
          `select v.id
             from regulatory.project_versions v
             join regulatory.projects p on p.id = v.project_id
            where v.project_id = $1
              and v.version_number = $2
              and p.archived_at is null
            limit 1`,
          [projectId, version],
        );
        if (result.rowCount !== 1) throw new Error("PROJECT_VERSION_NOT_FOUND");
        await client.query("commit");
        return result.rows[0].id;
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
