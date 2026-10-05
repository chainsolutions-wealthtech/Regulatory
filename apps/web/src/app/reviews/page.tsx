import {
  ReviewCenterTemplate,
  type ReviewCenterEntry,
} from "@/components/templates/ReviewCenterTemplate";
import { normalizeReviewCenterFilters } from "@/domain/review-center";
import { reviewRepository } from "@/server/reviews";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ReviewCenterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = normalizeReviewCenterFilters(await searchParams);
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
      filters={filters}
      portfolioUnavailable={portfolioUnavailable}
      reviewDriver={reviewRepository.driver}
    />
  );
}
