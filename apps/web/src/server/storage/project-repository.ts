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
};

export type PersistGenerationInput = {
  projectId: string;
  generation: GenerationSnapshot;
  preview: ProspectusPreview;
  canonicalSnapshot: CanonicalSnapshot;
  artifacts: GeneratedProspectusArtifact[];
};

/**
 * Port de persistance du domaine projet.
 *
 * Une implémentation transactionnelle doit garantir qu'une réponse, la version
 * du projet, le snapshot, les collections normalisées et l'événement d'audit
 * sont cohérents dans une même transaction.
 */
export interface ProjectRepository {
  readonly driver: "local-json" | "postgresql";
  listProjects(): Promise<ProjectSummary[]>;
  getProject(projectId: string): Promise<ProspectusProject | null>;
  createProject(input: CreateProjectInput): Promise<ProspectusProject>;
  saveAnswer(input: SaveAnswerInput): Promise<ProspectusProject>;
  persistGenerationArtifacts(input: PersistGenerationInput): Promise<ProspectusProject>;
}
