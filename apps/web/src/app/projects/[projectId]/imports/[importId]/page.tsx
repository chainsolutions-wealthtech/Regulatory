import { notFound } from "next/navigation";
import { ImportStagingReviewPanel } from "@/components/organisms/ImportStagingReviewPanel";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { getQuestionsByGroup } from "@/domain/questionnaire";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function ProjectImportReviewPage({
  params,
}: {
  params: Promise<{ projectId: string; importId: string }>;
}) {
  const { projectId, importId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) notFound();
  const questionTargets = getQuestionsByGroup(project)
    .flatMap((group) => group.questions)
    .map((question) => ({ id: question.id, label: question.label }));

  return (
    <ProjectWorkspaceTemplate project={project} active="imports">
      <ImportStagingReviewPanel
        projectId={project.id}
        importId={importId}
        projectVersion={project.version}
        questionTargets={questionTargets}
      />
    </ProjectWorkspaceTemplate>
  );
}
