import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GeneratedProspectusArtifact } from "@/server/generation-adapter";

export type StoredArtifact = {
  fileName: string;
  documentType: string;
  mediaType: string;
  storageReference: string;
  sha256: string;
  byteSize: number;
};

export type StagedArtifactBatch = {
  artifacts: StoredArtifact[];
  commit(): Promise<void>;
  rollback(): Promise<void>;
};

export interface ArtifactStore {
  stage(input: {
    organizationId: string;
    projectId: string;
    generationId: string;
    artifacts: GeneratedProspectusArtifact[];
  }): Promise<StagedArtifactBatch>;
  read(storageReference: string): Promise<Buffer>;
}

/**
 * Store filesystem destiné au développement et aux tests isolés.
 * Il ne remplace pas un stockage objet sécurisé, versionné et analysé.
 */
export function createFileSystemArtifactStore(rootDirectory: string): ArtifactStore {
  const resolvedRoot = path.resolve(rootDirectory);
  return {
    async stage(input) {
      const organizationId = safeSegment(input.organizationId);
      const projectId = safeSegment(input.projectId);
      const generationId = safeSegment(input.generationId);
      const stageId = randomUUID();
      const stagingDirectory = path.join(
        resolvedRoot,
        ".staging",
        organizationId,
        projectId,
        generationId,
        stageId,
      );
      const finalDirectory = path.join(
        resolvedRoot,
        organizationId,
        projectId,
        generationId,
      );
      await mkdir(stagingDirectory, { recursive: true });

      const stored: StoredArtifact[] = [];
      try {
        for (const artifact of input.artifacts) {
          const fileName = safeFileName(artifact.fileName);
          const stagedPath = path.join(stagingDirectory, fileName);
          await writeFile(stagedPath, artifact.content);
          stored.push({
            fileName,
            documentType: documentType(fileName),
            mediaType: mediaType(fileName),
            storageReference: path
              .relative(resolvedRoot, path.join(finalDirectory, fileName))
              .split(path.sep)
              .join("/"),
            sha256: createHash("sha256").update(artifact.content).digest("hex"),
            byteSize: artifact.content.byteLength,
          });
        }
      } catch (error) {
        await rm(stagingDirectory, { recursive: true, force: true });
        throw error;
      }

      let committed = false;
      return {
        artifacts: stored,
        async commit() {
          if (committed) return;
          await mkdir(path.dirname(finalDirectory), { recursive: true });
          await rm(finalDirectory, { recursive: true, force: true });
          await mkdir(finalDirectory, { recursive: true });
          for (const artifact of input.artifacts) {
            const fileName = safeFileName(artifact.fileName);
            await writeFile(path.join(finalDirectory, fileName), artifact.content);
          }
          await rm(stagingDirectory, { recursive: true, force: true });
          committed = true;
        },
        async rollback() {
          if (committed) return;
          await rm(stagingDirectory, { recursive: true, force: true });
        },
      };
    },
    async read(storageReference) {
      const filePath = resolveStorageReference(resolvedRoot, storageReference);
      return readFile(filePath);
    },
  };
}

function resolveStorageReference(rootDirectory: string, value: string): string {
  if (!value || value.startsWith("/") || value.includes("\\")) {
    throw new Error("INVALID_ARTIFACT_STORAGE_REFERENCE");
  }
  const segments = value.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("INVALID_ARTIFACT_STORAGE_REFERENCE");
  }
  const resolved = path.resolve(rootDirectory, ...segments);
  const relative = path.relative(rootDirectory, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("ARTIFACT_STORAGE_REFERENCE_OUTSIDE_ROOT");
  }
  return resolved;
}

function safeSegment(value: string): string {
  if (!/^[a-z0-9][a-z0-9_-]{0,95}$/i.test(value)) {
    throw new Error(`INVALID_ARTIFACT_PATH_SEGMENT:${value}`);
  }
  return value;
}

function safeFileName(value: string): string {
  if (!/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(value) || value.includes("..")) {
    throw new Error(`INVALID_ARTIFACT_FILE_NAME:${value}`);
  }
  return value;
}

function mediaType(fileName: string): string {
  if (fileName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (fileName.endsWith(".json")) return "application/json";
  if (fileName.endsWith(".md")) return "text/markdown";
  if (fileName.endsWith(".csv")) return "text/csv";
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

function documentType(fileName: string): string {
  return fileName.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toUpperCase();
}
