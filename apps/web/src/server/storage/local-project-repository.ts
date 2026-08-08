import "server-only";

import {
  createProject,
  getProject,
  listGenerationArtifacts,
  listProjects,
  persistGenerationArtifacts,
  readGenerationArtifact,
  saveAnswer,
} from "@/server/project-store";
import type { ProjectRepository } from "@/server/storage/project-repository";

export const localProjectRepository: ProjectRepository = {
  driver: "local-json",
  listProjects,
  getProject,
  createProject,
  async saveAnswer(input) {
    const current = await getProject(input.projectId);
    if (!current) throw new Error("PROJECT_NOT_FOUND");
    assertExpectedVersion(input.expectedVersion, current.version);
    return saveAnswer(input);
  },
  async persistGenerationArtifacts(input) {
    const current = await getProject(input.projectId);
    if (!current) throw new Error("PROJECT_NOT_FOUND");
    assertExpectedVersion(input.expectedVersion, current.version);
    return persistGenerationArtifacts(input);
  },
  listGenerationArtifacts,
  readGenerationArtifact,
};

function assertExpectedVersion(expected: number | undefined, actual: number): void {
  if (expected !== undefined && expected !== actual) {
    throw new Error(`PROJECT_VERSION_CONFLICT:${expected}:${actual}`);
  }
}
