import type {
  AddReviewCommentInput,
  DecideReviewInput,
  RequestReviewInput,
  ReviewWorkspace,
  TransitionReviewWorkflowInput,
} from "@/domain/review-types";

export interface ReviewRepository {
  readonly driver: "local-json" | "postgresql";
  getWorkspace(projectId: string): Promise<ReviewWorkspace>;
  requestReview(input: RequestReviewInput): Promise<ReviewWorkspace>;
  decideReview(input: DecideReviewInput): Promise<ReviewWorkspace>;
  addComment(input: AddReviewCommentInput): Promise<ReviewWorkspace>;
  transition(input: TransitionReviewWorkflowInput): Promise<ReviewWorkspace>;
}
