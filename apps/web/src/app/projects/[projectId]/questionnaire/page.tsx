import { notFound } from "next/navigation";
import { QuestionnaireWorkspace } from "@/components/organisms/QuestionnaireWorkspace";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { getQuestionsByGroup } from "@/domain/questionnaire";
import { getProject } from "@/server/project-store";

export const dynamic = "force-dynamic";

export default async function QuestionnairePage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ group?: string }> }) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const project = await getProject(projectId);
  if (!project) notFound();
  const groups = getQuestionsByGroup(project);
  const activeGroupId = groups.some((group) => group.id === query.group) ? query.group! : groups[0]?.id ?? "project";
  return <ProjectWorkspaceTemplate project={project} active="questionnaire"><QuestionnaireWorkspace initialProject={project} activeGroupId={activeGroupId} /></ProjectWorkspaceTemplate>;
}
