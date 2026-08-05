import "server-only";

import type { ReviewRepository } from "@/server/reviews/review-repository";

const unavailable = async (): Promise<never> => {
  throw new Error(
    "REVIEW_REPOSITORY_UNAVAILABLE: configure PostgreSQL and a verified OIDC identity before using review actions.",
  );
};

export const unavailableReviewRepository: ReviewRepository = {
  driver: "local-json",
  getWorkspace: unavailable,
  requestReview: unavailable,
  decideReview: unavailable,
  addComment: unavailable,
  recordInternalApproval: unavailable,
  transition: unavailable,
};
