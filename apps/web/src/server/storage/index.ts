import "server-only";

import { localProjectRepository } from "@/server/storage/local-project-repository";
import type { ProjectRepository } from "@/server/storage/project-repository";

const driver = process.env.REGULATORY_STORAGE_DRIVER ?? "local-json";

/**
 * Le stockage PostgreSQL n'est activé qu'après injection explicite de son
 * implémentation, des secrets et des contrôles d'identité. Aucun repli
 * silencieux vers le JSON local n'est autorisé lorsqu'un autre driver est demandé.
 */
export function getProjectRepository(): ProjectRepository {
  if (driver === "local-json") return localProjectRepository;
  if (driver === "postgresql") {
    throw new Error(
      "POSTGRESQL_REPOSITORY_NOT_ACTIVATED: apply migrations, configure identity and inject the PostgreSQL repository before selecting this driver.",
    );
  }
  throw new Error(`UNSUPPORTED_STORAGE_DRIVER:${driver}`);
}

export const projectRepository = getProjectRepository();
