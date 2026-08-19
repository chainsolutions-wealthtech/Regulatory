import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import type { EvidenceBinaryStore } from "@/server/evidence/evidence-binary-store";
import {
  assertDetectedMediaTypeMayBeReleased,
  assertEvidenceIngestionAllowed,
  assertTrustedScanResult,
  safeEvidenceFilename,
  type EvidenceObjectDescriptor,
  type EvidenceObjectStore,
  type EvidenceReadResult,
  type ReadEvidenceDescriptorInput,
  type ReadEvidenceInput,
  type RecordEvidenceScanInput,
  type ReleaseEvidenceInput,
  type StageEvidenceInput,
} from "@/server/evidence/evidence-object-store";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

/**
 * PostgreSQL est la source de vérité de toutes les métadonnées réglementaires
 * et de cycle de vie. Le binary store ne gère que les octets privés et leur
 * localisation technique.
 */
export function createPostgresTrackedEvidenceStore(input: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
  binaryStore: EvidenceBinaryStore;
}): EvidenceObjectStore {
  return {
    provider: `POSTGRESQL_TRACKED:${input.binaryStore.provider}`,
    productionReady: input.binaryStore.productionReady,

    async stage(command: StageEvidenceInput) {
      assertEvidenceIngestionAllowed(command);
      const identity = await resolveIdentity(input.identityProvider);
      assertCallerScope(identity, command.organizationId, command.uploadedBy);

      const objectId = randomUUID();
      const content = Buffer.from(command.content);
      const sha256 = createHash("sha256").update(content).digest("hex");
      const location = await input.binaryStore.stage({
        objectId,
        organizationId: identity.organizationId,
        content,
      });
      const retentionUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString();

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
               'QUARANTINED','PENDING',null,null,null,null,$15,$16,false
             )`,
            [
              objectId,
              identity.organizationId,
              command.projectVersionId,
              location.storageProvider,
              location.storageObjectKey,
              location.storageReference,
              command.originalFilename,
              safeEvidenceFilename(command.originalFilename),
              command.declaredMediaType ?? null,
              null,
              sha256,
              content.byteLength,
              location.encryptionAlgorithm,
              command.encryptionKeyReference,
              command.uploadedBy,
              retentionUntil,
            ],
          );
          return readDescriptorRow(client, objectId);
        });
      } catch (error) {
        await input.binaryStore.delete({ objectId, organizationId: identity.organizationId }).catch(() => undefined);
        throw error;
      }
    },

    async recordScan(command: RecordEvidenceScanInput) {
      assertTrustedScanResult(command);
      const identity = await resolveIdentity(input.identityProvider);
      const existing = await withTenant(input.pool, identity, (client) =>
        readDescriptorRow(client, command.objectId),
      );
      if (existing.sha256 !== command.expectedSha256) throw new Error("EVIDENCE_SCAN_DIGEST_MISMATCH");
      if (existing.state !== "QUARANTINED" && existing.state !== "SCANNING") {
        throw new Error(`EVIDENCE_SCAN_STATE_INVALID:${existing.state}`);
      }

      const binary = await input.binaryStore.readQuarantined({
        objectId: existing.objectId,
        organizationId: identity.organizationId,
      });
      assertDigest(binary, existing.sha256, "EVIDENCE_QUARANTINE_DIGEST_MISMATCH");

      const nextState = command.status === "CLEAN"
        ? "QUARANTINED"
        : command.status === "INFECTED"
          ? "INFECTED"
          : "REJECTED";

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
            nextState,
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
      if (!command.releasedAt.trim() || Number.isNaN(Date.parse(command.releasedAt))) {
        throw new Error("EVIDENCE_RELEASE_TIMESTAMP_INVALID");
      }

      const existing = await withTenant(input.pool, identity, (client) =>
        readDescriptorRow(client, command.objectId),
      );

      if (existing.state === "CLEAN" && existing.scanStatus === "CLEAN") {
        assertSameRelease(existing, command);
        await assertBinaryClean(input.binaryStore, existing);
        return existing;
      }
      if (existing.state !== "QUARANTINED" || existing.scanStatus !== "CLEAN") {
        throw new Error("EVIDENCE_CLEAN_SCAN_REQUIRED_BEFORE_RELEASE");
      }
      if (!existing.detectedMediaType) throw new Error("EVIDENCE_DETECTED_MEDIA_TYPE_REQUIRED");
      assertDetectedMediaTypeMayBeReleased(existing.detectedMediaType);

      let alreadyPromoted = false;
      try {
        const quarantined = await input.binaryStore.readQuarantined({
          objectId: existing.objectId,
          organizationId: identity.organizationId,
        });
        assertDigest(quarantined, existing.sha256, "EVIDENCE_RELEASE_DIGEST_MISMATCH");
      } catch (error) {
        if (!isQuarantineMissing(error)) throw error;
        await assertBinaryClean(input.binaryStore, existing);
        alreadyPromoted = true;
      }

      if (!alreadyPromoted) {
        await input.binaryStore.promoteToClean({
          objectId: existing.objectId,
          organizationId: identity.organizationId,
        });
        await assertBinaryClean(input.binaryStore, existing);
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
      if (!descriptor.detectedMediaType) throw new Error("EVIDENCE_DETECTED_MEDIA_TYPE_REQUIRED");

      const content = await input.binaryStore.readClean({
        objectId: descriptor.objectId,
        organizationId: identity.organizationId,
      });
      assertDigest(content, descriptor.sha256, "EVIDENCE_READ_DIGEST_MISMATCH");
      return {
        descriptor,
        content,
        headers: {
          "content-type": descriptor.detectedMediaType,
          "content-disposition": `attachment; filename="${descriptor.safeFilename}"`,
          "cache-control": "private, no-store",
        },
      };
    },

    async readDescriptor(command: ReadEvidenceDescriptorInput) {
      const identity = await resolveIdentity(input.identityProvider);
      assertReadScope(identity, command);
      return withTenant(input.pool, identity, (client) => readDescriptorRow(client, command.objectId));
    },

    async setLegalHold(objectId: string, legalHold: boolean, actorId: string) {
      const identity = await resolveIdentity(input.identityProvider);
      if (actorId !== identity.userId) throw new Error("EVIDENCE_LEGAL_HOLD_ACTOR_MISMATCH");
      return withTenant(input.pool, identity, async (client) => {
        const result = await client.query(
          `update regulatory.evidence_objects set legal_hold = $2 where id = $1 and state <> 'DELETED'`,
          [objectId, legalHold],
        );
        if (result.rowCount !== 1) throw new Error("EVIDENCE_OBJECT_NOT_FOUND");
        return readDescriptorRow(client, objectId);
      });
    },

    async requestDeletion(objectId: string, actorId: string) {
      const identity = await resolveIdentity(input.identityProvider);
      if (actorId !== identity.userId) throw new Error("EVIDENCE_DELETION_ACTOR_MISMATCH");
      const existing = await withTenant(input.pool, identity, (client) => readDescriptorRow(client, objectId));
      if (existing.legalHold) throw new Error("EVIDENCE_LEGAL_HOLD_PREVENTS_DELETION");

      await input.binaryStore.delete({ objectId, organizationId: identity.organizationId });
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
  binaryStore: EvidenceBinaryStore,
  existing: EvidenceObjectDescriptor,
): Promise<void> {
  const content = await binaryStore.readClean({
    objectId: existing.objectId,
    organizationId: existing.organizationId,
  });
  assertDigest(content, existing.sha256, "EVIDENCE_BINARY_METADATA_DIGEST_MISMATCH");
}

function assertDigest(content: Uint8Array, expectedSha256: string, errorCode: string): void {
  const actual = createHash("sha256").update(content).digest("hex");
  if (actual !== expectedSha256) throw new Error(errorCode);
}

function assertSameRelease(descriptor: EvidenceObjectDescriptor, command: ReleaseEvidenceInput): void {
  if (descriptor.releasedBy !== command.releasedBy || descriptor.releasedAt !== command.releasedAt) {
    throw new Error("EVIDENCE_RELEASE_STATE_CONFLICT");
  }
}

function isQuarantineMissing(error: unknown): boolean {
  return error instanceof Error && (
    error.message === "EVIDENCE_BINARY_QUARANTINE_OBJECT_NOT_FOUND" ||
    error.message === "EVIDENCE_BINARY_OBJECT_NOT_FOUND"
  );
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
