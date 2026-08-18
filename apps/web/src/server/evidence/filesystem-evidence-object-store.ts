import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
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

/**
 * Implémentation locale réservée au développement et aux tests.
 * Elle applique la quarantaine et les invariants de cycle de vie, mais ne
 * remplace ni un stockage objet privé, ni un KMS, ni un moteur antivirus.
 */
export function createDevelopmentFilesystemEvidenceStore(rootDirectory: string): EvidenceObjectStore {
  const root = path.resolve(rootDirectory);
  const quarantineDirectory = path.join(root, "quarantine");
  const cleanDirectory = path.join(root, "clean");
  const metadataDirectory = path.join(root, "metadata");

  return {
    provider: "FILESYSTEM_DEVELOPMENT_ONLY",
    productionReady: false,

    async stage(input: StageEvidenceInput): Promise<EvidenceObjectDescriptor> {
      assertEvidenceIngestionAllowed(input);
      await ensureDirectories();
      const objectId = randomUUID();
      const content = Buffer.from(input.content);
      const sha256 = createHash("sha256").update(content).digest("hex");
      const descriptor: EvidenceObjectDescriptor = {
        objectId,
        organizationId: input.organizationId,
        projectVersionId: input.projectVersionId,
        storageProvider: "FILESYSTEM_DEVELOPMENT_ONLY",
        storageObjectKey: `evidence/${input.organizationId}/${objectId}`,
        storageReference: `filesystem-private:${objectId}`,
        originalFilename: input.originalFilename,
        safeFilename: safeEvidenceFilename(input.originalFilename),
        declaredMediaType: input.declaredMediaType,
        sha256,
        byteSize: content.byteLength,
        encryptionAlgorithm: "NONE_DEVELOPMENT_ONLY",
        encryptionKeyReference: input.encryptionKeyReference,
        state: "QUARANTINED",
        scanStatus: "PENDING",
        uploadedBy: input.uploadedBy,
        retentionUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
        legalHold: false,
      };
      await atomicWrite(binaryPath(quarantineDirectory, objectId), content);
      await writeDescriptor(descriptor);
      return descriptor;
    },

    async recordScan(input: RecordEvidenceScanInput): Promise<EvidenceObjectDescriptor> {
      assertTrustedScanResult(input);
      const descriptor = await loadDescriptor(input.objectId);
      assertMutableQuarantineState(descriptor);
      if (descriptor.sha256 !== input.expectedSha256) throw new Error("EVIDENCE_SCAN_DIGEST_MISMATCH");
      const content = await readFile(binaryPath(quarantineDirectory, descriptor.objectId));
      const actualDigest = createHash("sha256").update(content).digest("hex");
      if (actualDigest !== descriptor.sha256) throw new Error("EVIDENCE_QUARANTINE_DIGEST_MISMATCH");

      const next: EvidenceObjectDescriptor = {
        ...descriptor,
        detectedMediaType: input.detectedMediaType,
        scanStatus: input.status,
        scanProvider: input.scanProvider,
        scanEngineVersion: input.scanEngineVersion,
        scanSignatureVersion: input.scanSignatureVersion,
        scanCompletedAt: input.scanCompletedAt,
        state:
          input.status === "INFECTED"
            ? "INFECTED"
            : input.status === "CLEAN"
              ? "QUARANTINED"
              : "REJECTED",
      };
      await writeDescriptor(next);
      return next;
    },

    async release(input: ReleaseEvidenceInput): Promise<EvidenceObjectDescriptor> {
      const descriptor = await loadDescriptor(input.objectId);
      if (descriptor.state !== "QUARANTINED" || descriptor.scanStatus !== "CLEAN") {
        throw new Error("EVIDENCE_CLEAN_SCAN_REQUIRED_BEFORE_RELEASE");
      }
      if (!descriptor.detectedMediaType) throw new Error("EVIDENCE_DETECTED_MEDIA_TYPE_REQUIRED");
      assertDetectedMediaTypeMayBeReleased(descriptor.detectedMediaType);
      if (!input.releasedBy.trim()) throw new Error("EVIDENCE_RELEASER_REQUIRED");
      if (!input.releasedAt.trim()) throw new Error("EVIDENCE_RELEASE_TIMESTAMP_REQUIRED");

      await ensureDirectories();
      const source = binaryPath(quarantineDirectory, descriptor.objectId);
      const destination = binaryPath(cleanDirectory, descriptor.objectId);
      await rename(source, destination);
      const content = await readFile(destination);
      const actualDigest = createHash("sha256").update(content).digest("hex");
      if (actualDigest !== descriptor.sha256) {
        await rename(destination, source).catch(() => undefined);
        throw new Error("EVIDENCE_RELEASE_DIGEST_MISMATCH");
      }

      const released: EvidenceObjectDescriptor = {
        ...descriptor,
        state: "CLEAN",
        releasedBy: input.releasedBy,
        releasedAt: input.releasedAt,
      };
      await writeDescriptor(released);
      return released;
    },

    async readClean(input: ReadEvidenceInput): Promise<EvidenceReadResult> {
      if (!input.requestedBy.trim() || !input.authorizationDecisionId.trim()) {
        throw new Error("EVIDENCE_READ_AUTHORIZATION_REQUIRED");
      }
      const descriptor = await loadDescriptor(input.objectId);
      if (descriptor.organizationId !== input.organizationId) throw new Error("EVIDENCE_TENANT_MISMATCH");
      if (descriptor.state !== "CLEAN" || descriptor.scanStatus !== "CLEAN") {
        throw new Error("EVIDENCE_OBJECT_NOT_RELEASED");
      }
      if (!descriptor.detectedMediaType) throw new Error("EVIDENCE_DETECTED_MEDIA_TYPE_REQUIRED");
      const content = await readFile(binaryPath(cleanDirectory, descriptor.objectId));
      const actualDigest = createHash("sha256").update(content).digest("hex");
      if (actualDigest !== descriptor.sha256) throw new Error("EVIDENCE_READ_DIGEST_MISMATCH");
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

    async readDescriptor(input: ReadEvidenceDescriptorInput): Promise<EvidenceObjectDescriptor> {
      if (!input.requestedBy.trim() || !input.authorizationDecisionId.trim()) {
        throw new Error("EVIDENCE_DESCRIPTOR_AUTHORIZATION_REQUIRED");
      }
      const descriptor = await loadDescriptor(input.objectId);
      if (descriptor.organizationId !== input.organizationId) throw new Error("EVIDENCE_TENANT_MISMATCH");
      return descriptor;
    },

    async setLegalHold(objectId: string, legalHold: boolean, actorId: string) {
      if (!actorId.trim()) throw new Error("EVIDENCE_LEGAL_HOLD_ACTOR_REQUIRED");
      const descriptor = await loadDescriptor(objectId);
      if (descriptor.state === "DELETED") throw new Error("EVIDENCE_OBJECT_ALREADY_DELETED");
      const next = { ...descriptor, legalHold };
      await writeDescriptor(next);
      return next;
    },

    async requestDeletion(objectId: string, actorId: string) {
      if (!actorId.trim()) throw new Error("EVIDENCE_DELETION_ACTOR_REQUIRED");
      const descriptor = await loadDescriptor(objectId);
      if (descriptor.legalHold) throw new Error("EVIDENCE_LEGAL_HOLD_PREVENTS_DELETION");
      if (descriptor.state === "DELETED") return descriptor;
      await rm(binaryPath(quarantineDirectory, objectId), { force: true });
      await rm(binaryPath(cleanDirectory, objectId), { force: true });
      const deleted: EvidenceObjectDescriptor = { ...descriptor, state: "DELETED" };
      await writeDescriptor(deleted);
      return deleted;
    },
  };

  async function ensureDirectories(): Promise<void> {
    await Promise.all([
      mkdir(quarantineDirectory, { recursive: true, mode: 0o700 }),
      mkdir(cleanDirectory, { recursive: true, mode: 0o700 }),
      mkdir(metadataDirectory, { recursive: true, mode: 0o700 }),
    ]);
  }

  async function loadDescriptor(objectId: string): Promise<EvidenceObjectDescriptor> {
    assertObjectId(objectId);
    const raw = await readFile(path.join(metadataDirectory, `${objectId}.json`), "utf8").catch(() => {
      throw new Error("EVIDENCE_OBJECT_NOT_FOUND");
    });
    return JSON.parse(raw) as EvidenceObjectDescriptor;
  }

  async function writeDescriptor(descriptor: EvidenceObjectDescriptor): Promise<void> {
    await ensureDirectories();
    await atomicWrite(
      path.join(metadataDirectory, `${descriptor.objectId}.json`),
      Buffer.from(`${JSON.stringify(descriptor, null, 2)}\n`, "utf8"),
    );
  }
}

function assertMutableQuarantineState(descriptor: EvidenceObjectDescriptor): void {
  if (!(["QUARANTINED", "SCANNING"] as EvidenceObjectDescriptor["state"][]).includes(descriptor.state)) {
    throw new Error(`EVIDENCE_SCAN_STATE_INVALID:${descriptor.state}`);
  }
}

function binaryPath(directory: string, objectId: string): string {
  assertObjectId(objectId);
  return path.join(directory, `${objectId}.bin`);
}

function assertObjectId(objectId: string): void {
  if (!/^[0-9a-f-]{36}$/u.test(objectId)) throw new Error("EVIDENCE_OBJECT_ID_INVALID");
}

async function atomicWrite(destination: string, content: Buffer): Promise<void> {
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temporary, content, { mode: 0o600, flag: "wx" });
  await rename(temporary, destination).catch(async (error) => {
    await rm(temporary, { force: true });
    throw error;
  });
}
