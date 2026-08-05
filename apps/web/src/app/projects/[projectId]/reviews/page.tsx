import { notFound } from "next/navigation";
import { ReviewWorkspacePanel } from "@/components/organisms/ReviewWorkspacePanel";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) notFound();
  return (
    <ProjectWorkspaceTemplate project={project} active="reviews">
      <ReviewWorkspacePanel projectId={project.id} projectVersion={project.version} />
    </ProjectWorkspaceTemplate>
  );
}
