import { notFound } from "next/navigation";
import { GenerateProspectusButton } from "@/components/organisms/GenerateProspectusButton";
import { GenerationArtifactsPanel } from "@/components/organisms/GenerationArtifactsPanel";
import { ProspectusDocument } from "@/components/organisms/ProspectusDocument";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { buildProspectusPreview } from "@/server/generation-adapter";
import { generationArtifactRepository, projectRepository } from "@/server/storage";
import type { GenerationArtifactSummary } from "@/server/storage/generation-artifact-repository";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) notFound();
  const preview = await buildProspectusPreview(project);

  let persistedArtifacts: GenerationArtifactSummary[] = [];
  let persistedArtifactsError: string | undefined;
  if (project.generation?.generationId) {
    try {
      persistedArtifacts = await generationArtifactRepository.list(
        project.id,
        project.generation.generationId,
      );
    } catch (error) {
      persistedArtifactsError =
        error instanceof Error ? error.message : "Lecture des artefacts indisponible.";
    }
  }

  return (
    <ProjectWorkspaceTemplate project={project} active="preview">
      <div className="page-stack">
        <div className="preview-layout">
          <aside className="preview-toolbar">
            <h2>Aperçu actuel</h2>
            <p>
              Le contenu est reconstruit depuis le snapshot canonique courant. Il est distinct de
              la dernière génération persistée et conserve le statut de pré-conformité.
            </p>
            <GenerateProspectusButton projectId={project.id} projectVersion={project.version} />
            <dl>
              <div>
                <dt>Aperçu</dt>
                <dd>{preview.generationId}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{project.version}</dd>
              </div>
              <div>
                <dt>Sections</dt>
                <dd>{preview.sections.length}</dd>
              </div>
              <div>
                <dt>Stockage</dt>
                <dd>{projectRepository.driver}</dd>
              </div>
              <div>
                <dt>Soumission</dt>
                <dd>Interdite</dd>
              </div>
            </dl>
          </aside>
          <ProspectusDocument
            title={preview.title}
            sections={preview.sections}
            generationId={preview.generationId}
            readyForComplianceReview={preview.readyForComplianceReview}
          />
        </div>

        {project.generation?.generationId ? (
          <GenerationArtifactsPanel
            projectId={project.id}
            generationId={project.generation.generationId}
            artifacts={persistedArtifacts}
            error={persistedArtifactsError}
          />
        ) : (
          <GenerationArtifactsPanel
            projectId={project.id}
            generationId="AUCUNE_GENERATION_PERSISTEE"
            artifacts={[]}
          />
        )}
      </div>
    </ProjectWorkspaceTemplate>
  );
}
