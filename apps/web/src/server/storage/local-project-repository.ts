import "server-only";

import {
  createProject,
  getProject,
  listProjects,
  persistGenerationArtifacts,
  saveAnswer,
} from "@/server/project-store";
import type { ProjectRepository } from "@/server/storage/project-repository";

export const localProjectRepository: ProjectRepository = {
  driver: "local-json",
  listProjects,
  getProject,
  createProject,
  saveAnswer,
  persistGenerationArtifacts,
};
