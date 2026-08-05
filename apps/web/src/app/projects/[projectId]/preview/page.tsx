import { notFound } from "next/navigation";
import { GenerateProspectusButton } from "@/components/organisms/GenerateProspectusButton";
import { ProspectusDocument } from "@/components/organisms/ProspectusDocument";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { buildProspectusPreview } from "@/server/generation-adapter";
import { projectRepository } from "@/server/storage";

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
  return (
    <ProjectWorkspaceTemplate project={project} active="preview">
      <div className="preview-layout">
        <aside className="preview-toolbar">
          <h2>Aperçu généré</h2>
          <p>
            Le contenu est construit depuis le snapshot canonique et conserve le statut de
            pré-conformité.
          </p>
          <GenerateProspectusButton projectId={project.id} />
          <dl>
            <div>
              <dt>Génération</dt>
              <dd>{preview.generationId}</dd>
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
    </ProjectWorkspaceTemplate>
  );
}
