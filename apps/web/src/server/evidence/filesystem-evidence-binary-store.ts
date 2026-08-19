import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  EvidenceBinaryLocation,
  EvidenceBinaryObjectKey,
  EvidenceBinaryStore,
  StageEvidenceBinaryInput,
} from "@/server/evidence/evidence-binary-store";

/**
 * Binary-only filesystem implementation for development and CI.
 * It never persists EvidenceObjectDescriptor or scan/review metadata.
 */
export function createDevelopmentFilesystemEvidenceBinaryStore(rootDirectory: string): EvidenceBinaryStore {
  const root = path.resolve(rootDirectory);
  const quarantineRoot = path.join(root, "quarantine-binary");
  const cleanRoot = path.join(root, "clean-binary");

  return {
    provider: "FILESYSTEM_DEVELOPMENT_ONLY",
    productionReady: false,

    async stage(input: StageEvidenceBinaryInput) {
      assertBinaryKey(input);
      if (input.content.byteLength < 1) throw new Error("EVIDENCE_BINARY_EMPTY_CONTENT");
      const quarantinePath = binaryPath(quarantineRoot, input);
      const cleanPath = binaryPath(cleanRoot, input);
      if (await exists(quarantinePath) || await exists(cleanPath)) {
        throw new Error("EVIDENCE_BINARY_OBJECT_ALREADY_EXISTS");
      }
      await mkdir(path.dirname(quarantinePath), { recursive: true, mode: 0o700 });
      await atomicWrite(quarantinePath, Buffer.from(input.content));
      return filesystemLocation(input, "QUARANTINE");
    },

    async readQuarantined(input: EvidenceBinaryObjectKey) {
      assertBinaryKey(input);
      const quarantinePath = binaryPath(quarantineRoot, input);
      if (await exists(quarantinePath)) return Uint8Array.from(await readFile(quarantinePath));
      const cleanPath = binaryPath(cleanRoot, input);
      if (await exists(cleanPath)) throw new Error("EVIDENCE_BINARY_QUARANTINE_OBJECT_NOT_FOUND");
      throw new Error("EVIDENCE_BINARY_OBJECT_NOT_FOUND");
    },

    async promoteToClean(input: EvidenceBinaryObjectKey) {
      assertBinaryKey(input);
      const quarantinePath = binaryPath(quarantineRoot, input);
      const cleanPath = binaryPath(cleanRoot, input);
      if (await exists(cleanPath)) return filesystemLocation(input, "CLEAN");
      if (!(await exists(quarantinePath))) throw new Error("EVIDENCE_BINARY_OBJECT_NOT_FOUND");
      await mkdir(path.dirname(cleanPath), { recursive: true, mode: 0o700 });
      await rename(quarantinePath, cleanPath);
      return filesystemLocation(input, "CLEAN");
    },

    async readClean(input: EvidenceBinaryObjectKey) {
      assertBinaryKey(input);
      const cleanPath = binaryPath(cleanRoot, input);
      if (await exists(cleanPath)) return Uint8Array.from(await readFile(cleanPath));
      const quarantinePath = binaryPath(quarantineRoot, input);
      if (await exists(quarantinePath)) throw new Error("EVIDENCE_BINARY_CLEAN_OBJECT_NOT_FOUND");
      throw new Error("EVIDENCE_BINARY_OBJECT_NOT_FOUND");
    },

    async delete(input: EvidenceBinaryObjectKey) {
      assertBinaryKey(input);
      await Promise.all([
        rm(binaryPath(quarantineRoot, input), { force: true }),
        rm(binaryPath(cleanRoot, input), { force: true }),
      ]);
    },
  };
}

function filesystemLocation(
  input: EvidenceBinaryObjectKey,
  location: "QUARANTINE" | "CLEAN",
): EvidenceBinaryLocation {
  const segment = location === "QUARANTINE" ? "quarantine" : "clean";
  return {
    storageProvider: "FILESYSTEM_DEVELOPMENT_ONLY",
    storageObjectKey: `${segment}/${input.organizationId}/${input.objectId}`,
    storageReference: `filesystem-private:${segment}:${input.organizationId}:${input.objectId}`,
    encryptionAlgorithm: "NONE_DEVELOPMENT_ONLY",
  };
}

function binaryPath(root: string, input: EvidenceBinaryObjectKey): string {
  return path.join(root, input.organizationId, `${input.objectId}.bin`);
}

function assertBinaryKey(input: EvidenceBinaryObjectKey): void {
  if (!/^[0-9a-f-]{36}$/u.test(input.objectId)) throw new Error("EVIDENCE_BINARY_OBJECT_ID_INVALID");
  if (!/^[0-9a-f-]{36}$/u.test(input.organizationId)) throw new Error("EVIDENCE_BINARY_ORGANIZATION_ID_INVALID");
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ENOENT");
}

async function atomicWrite(destination: string, content: Buffer): Promise<void> {
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temporary, content, { mode: 0o600, flag: "wx" });
  await rename(temporary, destination).catch(async (error) => {
    await rm(temporary, { force: true });
    throw error;
  });
}
