import type {
  CanonicalSnapshot,
  GenerationSnapshot,
  ProspectusProject,
  ProjectSummary,
} from "@/domain/types";
import type {
  GeneratedProspectusArtifact,
  ProspectusPreview,
} from "@/server/generation-adapter";

export type {
  GenerationArtifactContent,
  GenerationArtifactSummary,
} from "@/server/storage/generation-artifact-types";

export type CreateProjectInput = {
  name: string;
  category: ProspectusProject["category"];
  countryCode: string;
  operation: ProspectusProject["operation"];
  managementCompanyName: string;
};

export type SaveAnswerInput = {
  projectId: string;
  questionId: string;
  value: unknown;
  updatedBy?: string;
  expectedVersion?: number;
};

export type PersistGenerationInput = {
  projectId: string;
  generation: GenerationSnapshot;
  preview: ProspectusPreview;
  canonicalSnapshot: CanonicalSnapshot;
  artifacts: GeneratedProspectusArtifact[];
  expectedVersion?: number;
};

/**
 * Port de persistance transactionnelle du domaine projet courant.
 *
 * L'historique des versions est volontairement exposé par un port séparé afin
 * de garantir une frontière read-only et d'éviter qu'une consultation du passé
 * ne puisse devenir implicitement une restauration ou une approbation.
 */
export interface ProjectRepository {
  readonly driver: "local-json" | "postgresql";
  listProjects(): Promise<ProjectSummary[]>;
  getProject(projectId: string): Promise<ProspectusProject | null>;
  createProject(input: CreateProjectInput): Promise<ProspectusProject>;
  saveAnswer(input: SaveAnswerInput): Promise<ProspectusProject>;
  persistGenerationArtifacts(input: PersistGenerationInput): Promise<ProspectusProject>;
}
