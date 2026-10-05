import { ReviewCenterTemplate, type ReviewCenterEntry } from "@/components/templates/ReviewCenterTemplate";
import { reviewRepository } from "@/server/reviews";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function ReviewCenterPage() {
  let projects: Awaited<ReturnType<typeof projectRepository.listProjects>> = [];
  let portfolioUnavailable = false;

  try {
    projects = await projectRepository.listProjects();
  } catch {
    portfolioUnavailable = true;
  }

  const entries: ReviewCenterEntry[] = await Promise.all(
    projects.map(async (project) => {
      try {
        const workspace = await reviewRepository.getWorkspace(project.id);
        return { project, workspace, reviewUnavailable: false };
      } catch {
        return { project, workspace: null, reviewUnavailable: true };
      }
    }),
  );

  return (
    <ReviewCenterTemplate
      entries={entries}
      portfolioUnavailable={portfolioUnavailable}
      reviewDriver={reviewRepository.driver}
    />
  );
}
