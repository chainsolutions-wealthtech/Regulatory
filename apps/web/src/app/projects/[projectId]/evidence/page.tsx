import { notFound } from "next/navigation";
import { EvidenceWorkspacePanel } from "@/components/organisms/EvidenceWorkspacePanel";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function ProjectEvidencePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) notFound();

  return (
    <ProjectWorkspaceTemplate project={project} active="evidence">
      <EvidenceWorkspacePanel projectId={project.id} projectVersion={project.version} />
    </ProjectWorkspaceTemplate>
  );
}
