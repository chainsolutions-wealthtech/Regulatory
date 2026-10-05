import { notFound } from "next/navigation";
import { DocumentStudioTemplate } from "@/components/templates/DocumentStudioTemplate";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import {
  generationArtifactRepository,
  projectRepository,
  projectVersionRepository,
} from "@/server/storage";
import type { GenerationArtifactSummary } from "@/server/storage/generation-artifact-repository";
import type { ProjectVersionSummary } from "@/server/storage/project-version-repository";

export const dynamic = "force-dynamic";

export default async function DocumentStudioPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) notFound();

  let artifacts: GenerationArtifactSummary[] = [];
  let artifactsError: string | undefined;
  if (project.generation?.generationId) {
    try {
      artifacts = await generationArtifactRepository.list(
        project.id,
        project.generation.generationId,
      );
    } catch (error) {
      artifactsError =
        error instanceof Error ? error.message : "Lecture des artefacts indisponible.";
    }
  }

  let versions: ProjectVersionSummary[] = [];
  let versionsError: string | undefined;
  try {
    versions = await projectVersionRepository.listProjectVersions(project.id);
  } catch (error) {
    versionsError =
      error instanceof Error ? error.message : "Historique des versions indisponible.";
  }

  return (
    <ProjectWorkspaceTemplate project={project} active="document-studio">
      <DocumentStudioTemplate
        artifactDriver={generationArtifactRepository.driver}
        artifacts={artifacts}
        artifactsError={artifactsError}
        project={project}
        versionDriver={projectVersionRepository.driver}
        versions={versions}
        versionsError={versionsError}
      />
    </ProjectWorkspaceTemplate>
  );
}
