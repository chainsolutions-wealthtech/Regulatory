import "server-only";

import {
  assertAuthorized,
  type ProspectusAction,
  type ProspectusRole,
} from "@/domain/authorization";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";
import type { ProjectRepository } from "@/server/storage/project-repository";

/**
 * Défense métier au-dessus du port de persistance projet.
 *
 * Le repository PostgreSQL conserve ses propres contrôles identité, membership,
 * transaction et RLS. Ce décorateur ajoute le contrôle d'action RBAC avant que
 * l'opération n'atteigne le delegate, afin qu'une identité valide du bon tenant
 * ne suffise jamais à autoriser une mutation métier.
 */
export function createAuthorizedProjectRepository(input: {
  delegate: ProjectRepository;
  identityProvider: VerifiedIdentityProvider;
}): ProjectRepository {
  async function requireAction(action: ProspectusAction): Promise<void> {
    const identity = assertVerifiedIdentity(await input.identityProvider.getVerifiedIdentity());
    assertAuthorized(
      {
        userId: identity.userId,
        organizationId: identity.organizationId,
        roles: identity.roles as ProspectusRole[],
      },
      action,
      { organizationId: identity.organizationId },
    );
  }

  return {
    driver: input.delegate.driver,

    async listProjects() {
      await requireAction("PROJECT_LIST");
      return input.delegate.listProjects();
    },

    async getProject(projectId) {
      await requireAction("PROJECT_READ");
      return input.delegate.getProject(projectId);
    },

    async createProject(projectInput) {
      await requireAction("PROJECT_CREATE");
      return input.delegate.createProject(projectInput);
    },

    async saveAnswer(answerInput) {
      await requireAction("ANSWER_WRITE");
      return input.delegate.saveAnswer(answerInput);
    },

    async persistGenerationArtifacts(generationInput) {
      await requireAction("GENERATION_RUN");
      return input.delegate.persistGenerationArtifacts(generationInput);
    },
  };
}
