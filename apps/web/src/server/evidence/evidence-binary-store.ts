import "server-only";

export type EvidenceBinaryObjectKey = {
  objectId: string;
  organizationId: string;
};

export type StageEvidenceBinaryInput = EvidenceBinaryObjectKey & {
  content: Uint8Array;
};

export type EvidenceBinaryLocation = {
  storageProvider: string;
  storageObjectKey: string;
  storageReference: string;
  encryptionAlgorithm: string;
};

export interface EvidenceBinaryStore {
  readonly provider: string;
  readonly productionReady: boolean;
  stage(input: StageEvidenceBinaryInput): Promise<EvidenceBinaryLocation>;
  readQuarantined(input: EvidenceBinaryObjectKey): Promise<Uint8Array>;
  promoteToClean(input: EvidenceBinaryObjectKey): Promise<void>;
  readClean(input: EvidenceBinaryObjectKey): Promise<Uint8Array>;
  delete(input: EvidenceBinaryObjectKey): Promise<void>;
}

type StoredBinary = {
  organizationId: string;
  content: Uint8Array;
  location: "QUARANTINE" | "CLEAN";
};

/**
 * Deterministic in-memory implementation used only to specify the binary
 * storage contract. It intentionally stores no EvidenceObjectDescriptor,
 * scan metadata, roles, KMS references or regulatory state.
 */
export function createMemoryEvidenceBinaryStore(): EvidenceBinaryStore {
  const objects = new Map<string, StoredBinary>();

  return {
    provider: "MEMORY_TEST_ONLY",
    productionReady: false,

    async stage(input) {
      assertBinaryKey(input);
      if (input.content.byteLength < 1) throw new Error("EVIDENCE_BINARY_EMPTY_CONTENT");
      if (objects.has(input.objectId)) throw new Error("EVIDENCE_BINARY_OBJECT_ALREADY_EXISTS");
      objects.set(input.objectId, {
        organizationId: input.organizationId,
        content: Uint8Array.from(input.content),
        location: "QUARANTINE",
      });
      return {
        storageProvider: "MEMORY_TEST_ONLY",
        storageObjectKey: `evidence/${input.organizationId}/${input.objectId}`,
        storageReference: `memory-private:${input.organizationId}:${input.objectId}`,
        encryptionAlgorithm: "NONE_TEST_ONLY",
      };
    },

    async readQuarantined(input) {
      const object = resolveObject(objects, input);
      if (object.location !== "QUARANTINE") {
        throw new Error("EVIDENCE_BINARY_QUARANTINE_OBJECT_NOT_FOUND");
      }
      return Uint8Array.from(object.content);
    },

    async promoteToClean(input) {
      const object = resolveObject(objects, input);
      if (object.location === "CLEAN") return;
      object.location = "CLEAN";
    },

    async readClean(input) {
      const object = resolveObject(objects, input);
      if (object.location !== "CLEAN") throw new Error("EVIDENCE_BINARY_CLEAN_OBJECT_NOT_FOUND");
      return Uint8Array.from(object.content);
    },

    async delete(input) {
      assertBinaryKey(input);
      const object = objects.get(input.objectId);
      if (!object) return;
      if (object.organizationId !== input.organizationId) throw new Error("EVIDENCE_BINARY_OBJECT_NOT_FOUND");
      objects.delete(input.objectId);
    },
  };
}

function resolveObject(
  objects: Map<string, StoredBinary>,
  input: EvidenceBinaryObjectKey,
): StoredBinary {
  assertBinaryKey(input);
  const object = objects.get(input.objectId);
  if (!object || object.organizationId !== input.organizationId) {
    throw new Error("EVIDENCE_BINARY_OBJECT_NOT_FOUND");
  }
  return object;
}

function assertBinaryKey(input: EvidenceBinaryObjectKey): void {
  if (!input.objectId.trim()) throw new Error("EVIDENCE_BINARY_OBJECT_ID_REQUIRED");
  if (!input.organizationId.trim()) throw new Error("EVIDENCE_BINARY_ORGANIZATION_REQUIRED");
}
