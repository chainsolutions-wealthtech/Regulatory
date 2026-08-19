import "server-only";

import type { Pool, PoolClient, QueryResultRow } from "pg";
import type {
  EvidenceObjectDescriptor,
  EvidenceObjectStore,
  EvidenceReadResult,
  ReadEvidenceDescriptorInput,
  ReadEvidenceInput,
  RecordEvidenceScanInput,
  ReleaseEvidenceInput,
  StageEvidenceInput,
} from "@/server/evidence/evidence-object-store";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

/**
 * Couple un stockage binaire privé avec la table PostgreSQL gouvernée
 * regulatory.evidence_objects. PostgreSQL est la source de vérité des
 * métadonnées et le delegate reste responsable des octets.
 */
export function createPostgresTrackedEvidenceStore(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
  binaryStore: EvidenceObjectStore;
}): EvidenceObjectStore {
  return {
    provider: `POSTGRESQL_TRACKED:${input.binaryStore.provider}`,
    productionReady: input.binaryStore.productionReady,

    async stage(command: StageEvidenceInput) {
      const identity = await resolveIdentity(input.identityProvider);
      assertCallerScope(identity, command.organizationId, command.uploadedBy);
      const descriptor = await input.binaryStore.stage(command);
      try {
        return await withTenant(input.pool, identity, async (client) => {
          await client.query(
            `insert into regulatory.evidence_objects (
               id, organization_id, project_version_id,
               storage_provider, storage_object_key, storage_reference,
               original_filename, safe_filename, declared_media_type, detected_media_type,
               sha256, byte_size, encryption_algorithm, encryption_key_reference,
               state, scan_status, scan_provider, scan_engine_version, scan_signature_version,
               scan_completed_at, uploaded_by, retention_until, legal_hold
             ) values (
               $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
               $15,$16,$17,$18,$19,$20,$21,$22,$23
             )`,
            [
              descriptor.objectId,
              identity.organizationId,
              descriptor.projectVersionId,
              descriptor.storageProvider,
              descriptor.storageObjectKey,
              descriptor.storageReference,
              descriptor.originalFilename,
              descriptor.safeFilename,
              descriptor.declaredMediaType ?? null,
              descriptor.detectedMediaType ?? null,
              descriptor.sha256,
              descriptor.byteSize,
              descriptor.encryptionAlgorithm,
              descriptor.encryptionKeyReference,
              descriptor.state,
              descriptor.scanStatus,
              descriptor.scanProvider ?? null,
              descriptor.scanEngineVersion ?? null,
              descriptor.scanSignatureVersion ?? null,
              descriptor.scanCompletedAt ?? null,
              descriptor.uploadedBy,
              descriptor.retentionUntil,
              descriptor.legalHold,
            ],
          );
          return readDescriptorRow(client, descriptor.objectId);
        });
      } catch (error) {
        await input.binaryStore.requestDeletion(descriptor.objectId, identity.userId).catch(() => undefined);
        throw error;
      }
    },

    async recordScan(command: RecordEvidenceScanInput) {
      const identity = await resolveIdentity(input.identityProvider);
      const existing = await withTenant(input.pool, identity, (client) =>
        readDescriptorRow(client, command.objectId),
      );
      if (existing.sha256 !== command.expectedSha256) throw new Error("EVIDENCE_SCAN_DIGEST_MISMATCH");
      const binaryResult = await input.binaryStore.recordScan(command);
      if (binaryResult.sha256 !== existing.sha256) throw new Error("EVIDENCE_BINARY_METADATA_DIGEST_MISMATCH");
      return withTenant(input.pool, identity, async (client) => {
        const result = await client.query(
          `update regulatory.evidence_objects
              set detected_media_type = $2,
                  scan_status = $3,
                  scan_provider = $4,
                  scan_engine_version = $5,
                  scan_signature_version = $6,
                  scan_completed_at = $7,
                  scan_details = $8::jsonb,
                  state = $9
            where id = $1 and sha256 = $10`,
          [
            command.objectId,
            command.detectedMediaType,
            command.status,
            command.scanProvider,
            command.scanEngineVersion,
            command.scanSignatureVersion,
            command.scanCompletedAt,
            JSON.stringify(command.details ?? {}),
            binaryResult.state,
            command.expectedSha256,
          ],
        );
        if (result.rowCount !== 1) throw new Error("EVIDENCE_OBJECT_NOT_FOUND");
        return readDescriptorRow(client, command.objectId);
      });
    },

    async release(command: ReleaseEvidenceInput) {
      const identity = await resolveIdentity(input.identityProvider);
      if (command.releasedBy !== identity.userId) throw new Error("EVIDENCE_RELEASE_ACTOR_MISMATCH");
      const existing = await withTenant(input.pool, identity, (client) =>
        readDescriptorRow(client, command.objectId),
      );

      if (existing.state === "CLEAN" && existing.scanStatus === "CLEAN") {
        assertSameRelease(existing, command);
        await assertBinaryClean(input.binaryStore, existing, identity);
        return existing;
      }
      if (existing.state !== "QUARANTINED" || existing.scanStatus !== "CLEAN") {
        throw new Error("EVIDENCE_CLEAN_SCAN_REQUIRED_BEFORE_RELEASE");
      }

      let binaryResult: EvidenceObjectDescriptor;
      try {
        binaryResult = await input.binaryStore.release(command);
      } catch (error) {
        if (!isAlreadyReleasedBinaryError(error)) throw error;
        binaryResult = await assertBinaryClean(input.binaryStore, existing, identity);
        assertSameRelease(binaryResult, command);
      }
      if (binaryResult.sha256 !== existing.sha256) throw new Error("EVIDENCE_BINARY_METADATA_DIGEST_MISMATCH");
      if (binaryResult.state !== "CLEAN" || binaryResult.scanStatus !== "CLEAN") {
        throw new Error("EVIDENCE_BINARY_RELEASE_STATE_INVALID");
      }

      return withTenant(input.pool, identity, async (client) => {
        const result = await client.query(
          `update regulatory.evidence_objects
              set state = 'CLEAN', released_by = $2, released_at = $3
            where id = $1 and state = 'QUARANTINED' and scan_status = 'CLEAN'`,
          [command.objectId, command.releasedBy, command.releasedAt],
        );
        if (result.rowCount !== 1) {
          const concurrent = await readDescriptorRow(client, command.objectId);
          if (concurrent.state === "CLEAN" && concurrent.scanStatus === "CLEAN") {
            assertSameRelease(concurrent, command);
            return concurrent;
          }
          throw new Error("EVIDENCE_RELEASE_STATE_CONFLICT");
        }
        return readDescriptorRow(client, command.objectId);
      });
    },

    async readClean(command: ReadEvidenceInput): Promise<EvidenceReadResult> {
      const identity = await resolveIdentity(input.identityProvider);
      assertReadScope(identity, command);
      const descriptor = await withTenant(input.pool, identity, (client) =>
        readDescriptorRow(client, command.objectId),
      );
      if (descriptor.state !== "CLEAN" || descriptor.scanStatus !== "CLEAN") {
        throw new Error("EVIDENCE_OBJECT_NOT_RELEASED");
      }
      const binary = await input.binaryStore.readClean(command);
      if (binary.descriptor.sha256 !== descriptor.sha256) {
        throw new Error("EVIDENCE_BINARY_METADATA_DIGEST_MISMATCH");
      }
      return { ...binary, descriptor };
    },

    async readDescriptor(command: ReadEvidenceDescriptorInput) {
      const identity = await resolveIdentity(input.identityProvider);
      assertReadScope(identity, command);
      return withTenant(input.pool, identity, (client) => readDescriptorRow(client, command.objectId));
    },

    async setLegalHold(objectId: string, legalHold: boolean, actorId: string) {
      const identity = await resolveIdentity(input.identityProvider);
      if (actorId !== identity.userId) throw new Error("EVIDENCE_LEGAL_HOLD_ACTOR_MISMATCH");
      const binaryResult = await input.binaryStore.setLegalHold(objectId, legalHold, actorId);
      return withTenant(input.pool, identity, async (client) => {
        const result = await client.query(
          `update regulatory.evidence_objects set legal_hold = $2 where id = $1 and state <> 'DELETED'`,
          [objectId, legalHold],
        );
        if (result.rowCount !== 1) throw new Error("EVIDENCE_OBJECT_NOT_FOUND");
        const descriptor = await readDescriptorRow(client, objectId);
        if (descriptor.sha256 !== binaryResult.sha256) throw new Error("EVIDENCE_BINARY_METADATA_DIGEST_MISMATCH");
        return descriptor;
      });
    },

    async requestDeletion(objectId: string, actorId: string) {
      const identity = await resolveIdentity(input.identityProvider);
      if (actorId !== identity.userId) throw new Error("EVIDENCE_DELETION_ACTOR_MISMATCH");
      const existing = await withTenant(input.pool, identity, (client) => readDescriptorRow(client, objectId));
      if (existing.legalHold) throw new Error("EVIDENCE_LEGAL_HOLD_PREVENTS_DELETION");
      await input.binaryStore.requestDeletion(objectId, actorId);
      const now = new Date().toISOString();
      return withTenant(input.pool, identity, async (client) => {
        const result = await client.query(
          `update regulatory.evidence_objects
              set state = 'DELETED',
                  deletion_requested_at = coalesce(deletion_requested_at, $2),
                  deletion_requested_by = coalesce(deletion_requested_by, $3),
                  deleted_at = coalesce(deleted_at, $2)
            where id = $1 and legal_hold = false`,
          [objectId, now, actorId],
        );
        if (result.rowCount !== 1) throw new Error("EVIDENCE_OBJECT_NOT_FOUND");
        return readDescriptorRow(client, objectId);
      });
    },
  };
}

type EvidenceRow = QueryResultRow & {
  id: string;
  organization_id: string;
  project_version_id: string;
  storage_provider: string;
  storage_object_key: string;
  storage_reference: string;
  original_filename: string;
  safe_filename: string;
  declared_media_type: string | null;
  detected_media_type: string | null;
  sha256: string;
  byte_size: string | number;
  encryption_algorithm: string;
  encryption_key_reference: string;
  state: EvidenceObjectDescriptor["state"];
  scan_status: EvidenceObjectDescriptor["scanStatus"];
  scan_provider: string | null;
  scan_engine_version: string | null;
  scan_signature_version: string | null;
  scan_completed_at: Date | string | null;
  uploaded_by: string;
  released_by: string | null;
  released_at: Date | string | null;
  retention_until: Date | string;
  legal_hold: boolean;
};

async function readDescriptorRow(client: PoolClient, objectId: string): Promise<EvidenceObjectDescriptor> {
  const result = await client.query<EvidenceRow>(
    `select id, organization_id, project_version_id,
            storage_provider, storage_object_key, storage_reference,
            original_filename, safe_filename, declared_media_type, detected_media_type,
            sha256, byte_size, encryption_algorithm, encryption_key_reference,
            state::text, scan_status::text, scan_provider, scan_engine_version,
            scan_signature_version, scan_completed_at, uploaded_by,
            released_by, released_at, retention_until, legal_hold
       from regulatory.evidence_objects
      where id = $1`,
    [objectId],
  );
  if (result.rowCount !== 1) throw new Error("EVIDENCE_OBJECT_NOT_FOUND");
  const row = result.rows[0];
  return {
    objectId: row.id,
    organizationId: row.organization_id,
    projectVersionId: row.project_version_id,
    storageProvider: row.storage_provider,
    storageObjectKey: row.storage_object_key,
    storageReference: row.storage_reference,
    originalFilename: row.original_filename,
    safeFilename: row.safe_filename,
    ...(row.declared_media_type ? { declaredMediaType: row.declared_media_type } : {}),
    ...(row.detected_media_type ? { detectedMediaType: row.detected_media_type } : {}),
    sha256: row.sha256,
    byteSize: Number(row.byte_size),
    encryptionAlgorithm: row.encryption_algorithm,
    encryptionKeyReference: row.encryption_key_reference,
    state: row.state,
    scanStatus: row.scan_status,
    ...(row.scan_provider ? { scanProvider: row.scan_provider } : {}),
    ...(row.scan_engine_version ? { scanEngineVersion: row.scan_engine_version } : {}),
    ...(row.scan_signature_version ? { scanSignatureVersion: row.scan_signature_version } : {}),
    ...(row.scan_completed_at ? { scanCompletedAt: iso(row.scan_completed_at) } : {}),
    uploadedBy: row.uploaded_by,
    ...(row.released_by ? { releasedBy: row.released_by } : {}),
    ...(row.released_at ? { releasedAt: iso(row.released_at) } : {}),
    retentionUntil: iso(row.retention_until),
    legalHold: row.legal_hold,
  };
}

async function withTenant<T>(
  pool: Pool,
  identity: VerifiedIdentityContext,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.current_organization_id', $1, true)", [identity.organizationId]);
    const membership = await client.query(
      `select 1 from regulatory.organization_memberships
        where organization_id = $1 and user_id = $2 and revoked_at is null
        limit 1`,
      [identity.organizationId, identity.userId],
    );
    if (membership.rowCount !== 1) throw new Error("ORGANIZATION_MEMBERSHIP_REQUIRED");
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function assertBinaryClean(
  binaryStore: EvidenceObjectStore,
  existing: EvidenceObjectDescriptor,
  identity: VerifiedIdentityContext,
): Promise<EvidenceObjectDescriptor> {
  const read = await binaryStore.readClean({
    objectId: existing.objectId,
    organizationId: identity.organizationId,
    requestedBy: identity.userId,
    authorizationDecisionId: `EVIDENCE_RELEASE_RECOVERY:${identity.userId}:${existing.objectId}`,
  });
  if (read.descriptor.sha256 !== existing.sha256) {
    throw new Error("EVIDENCE_BINARY_METADATA_DIGEST_MISMATCH");
  }
  if (read.descriptor.state !== "CLEAN" || read.descriptor.scanStatus !== "CLEAN") {
    throw new Error("EVIDENCE_BINARY_RELEASE_STATE_INVALID");
  }
  return read.descriptor;
}

function assertSameRelease(descriptor: EvidenceObjectDescriptor, command: ReleaseEvidenceInput): void {
  if (descriptor.releasedBy !== command.releasedBy || descriptor.releasedAt !== command.releasedAt) {
    throw new Error("EVIDENCE_RELEASE_STATE_CONFLICT");
  }
}

function isAlreadyReleasedBinaryError(error: unknown): boolean {
  return error instanceof Error && error.message === "EVIDENCE_CLEAN_SCAN_REQUIRED_BEFORE_RELEASE";
}

async function resolveIdentity(provider: VerifiedIdentityProvider): Promise<VerifiedIdentityContext> {
  return assertVerifiedIdentity(await provider.getVerifiedIdentity());
}

function assertCallerScope(identity: VerifiedIdentityContext, organizationId: string, actorId: string) {
  if (organizationId !== identity.organizationId) throw new Error("EVIDENCE_TENANT_MISMATCH");
  if (actorId !== identity.userId) throw new Error("EVIDENCE_ACTOR_MISMATCH");
}

function assertReadScope(identity: VerifiedIdentityContext, command: ReadEvidenceInput) {
  if (command.organizationId !== identity.organizationId) throw new Error("EVIDENCE_TENANT_MISMATCH");
  if (command.requestedBy !== identity.userId) throw new Error("EVIDENCE_READ_ACTOR_MISMATCH");
  if (!command.authorizationDecisionId.trim()) throw new Error("EVIDENCE_READ_AUTHORIZATION_REQUIRED");
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
