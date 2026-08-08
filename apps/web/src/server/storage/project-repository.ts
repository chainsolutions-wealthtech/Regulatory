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

export type GenerationArtifactSummary = {
  generationId: string;
  fileName: string;
  documentType: string;
  mediaType: string;
  sha256: string;
  byteSize: number;
};

export type GenerationArtifactContent = GenerationArtifactSummary & {
  content: Buffer;
};

/**
 * Port de persistance du domaine projet.
 *
 * Une implémentation transactionnelle doit garantir qu'une réponse, la version
 * du projet, le snapshot, les collections normalisées et l'événement d'audit
 * sont cohérents dans une même transaction. Les écritures peuvent fournir une
 * précondition de version afin de rejeter une mise à jour concurrente.
 *
 * Les opérations d'artefacts n'acceptent jamais de chemin de stockage fourni
 * par l'appelant. Elles résolvent uniquement un triplet projet/génération/fichier
 * déjà persisté par le repository.
 */
export interface ProjectRepository {
  readonly driver: "local-json" | "postgresql";
  listProjects(): Promise<ProjectSummary[]>;
  getProject(projectId: string): Promise<ProspectusProject | null>;
  createProject(input: CreateProjectInput): Promise<ProspectusProject>;
  saveAnswer(input: SaveAnswerInput): Promise<ProspectusProject>;
  persistGenerationArtifacts(input: PersistGenerationInput): Promise<ProspectusProject>;
  listGenerationArtifacts(projectId: string, generationId: string): Promise<GenerationArtifactSummary[]>;
  readGenerationArtifact(
    projectId: string,
    generationId: string,
    fileName: string,
  ): Promise<GenerationArtifactContent | null>;
}
