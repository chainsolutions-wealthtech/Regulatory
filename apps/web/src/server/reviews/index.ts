import "server-only";

import { createPostgresReviewRepository } from "@/server/reviews/postgres-review-repository";
import type { ReviewRepository } from "@/server/reviews/review-repository";
import { unavailableReviewRepository } from "@/server/reviews/unavailable-review-repository";
import {
  getRuntimeIdentityProvider,
  getRuntimePostgresPool,
  regulatoryStorageDriver,
} from "@/server/storage";

export function getReviewRepository(): ReviewRepository {
  if (regulatoryStorageDriver !== "postgresql") return unavailableReviewRepository;
  return createPostgresReviewRepository({
    pool: getRuntimePostgresPool(),
    identityProvider: getRuntimeIdentityProvider(),
  });
}

export const reviewRepository = getReviewRepository();
