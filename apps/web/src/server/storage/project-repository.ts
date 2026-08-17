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

export type ProjectVersionSummary = {
  version: number;
  createdAt: string;
  status: ProspectusProject["status"];
  answerCount: number;
  frozen: boolean;
};

/**
 * Port de persistance du domaine projet.
 *
 * Une implémentation transactionnelle doit garantir qu'une réponse, la version
 * du projet, le snapshot, les collections normalisées et l'événement d'audit
 * sont cohérents dans une même transaction. Les écritures peuvent fournir une
 * précondition de version afin de rejeter une mise à jour concurrente.
 *
 * L'historique est strictement en lecture seule : lister ou relire une version
 * ne doit ni restaurer, ni activer, ni approuver automatiquement un état passé.
 *
 * La lecture des documents générés relève du port séparé
 * `GenerationArtifactRepository`, afin de pouvoir substituer un stockage objet
 * au filesystem sans élargir le repository métier projet.
 */
export interface ProjectRepository {
  readonly driver: "local-json" | "postgresql";
  listProjects(): Promise<ProjectSummary[]>;
  getProject(projectId: string): Promise<ProspectusProject | null>;
  listProjectVersions(projectId: string): Promise<ProjectVersionSummary[]>;
  getProjectVersion(projectId: string, version: number): Promise<ProspectusProject | null>;
  createProject(input: CreateProjectInput): Promise<ProspectusProject>;
  saveAnswer(input: SaveAnswerInput): Promise<ProspectusProject>;
  persistGenerationArtifacts(input: PersistGenerationInput): Promise<ProspectusProject>;
}
