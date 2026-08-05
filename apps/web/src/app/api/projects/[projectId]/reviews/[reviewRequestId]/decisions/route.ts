import { NextResponse } from "next/server";
import type { ReviewDecisionStatus } from "@/domain/review-workflow";
import { reviewRepository } from "@/server/reviews";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ projectId: string; reviewRequestId: string }>;
  },
) {
  const [{ projectId, reviewRequestId }, body] = await Promise.all([
    params,
    request.json().catch(() => null) as Promise<Record<string, unknown> | null>,
  ]);
  if (!body) return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  const expectedVersion = Number(body.expectedVersion);
  const decision = String(body.decision ?? "").toUpperCase() as ReviewDecisionStatus;
  const rationale = String(body.rationale ?? "").trim();
  if (!Number.isInteger(expectedVersion) || expectedVersion <= 0 || !rationale) {
    return NextResponse.json(
      { error: "expectedVersion et rationale sont obligatoires." },
      { status: 422 },
    );
  }
  if (!["APPROVED", "CHANGES_REQUESTED", "REJECTED"].includes(decision)) {
    return NextResponse.json({ error: "Décision non autorisée." }, { status: 422 });
  }
  try {
    const workspace = await reviewRepository.decideReview({
      projectId,
      expectedVersion,
      reviewRequestId,
      decision: decision as "APPROVED" | "CHANGES_REQUESTED" | "REJECTED",
      rationale,
      findingIds: stringArray(body.findingIds),
      evidenceIds: stringArray(body.evidenceIds),
    });
    return NextResponse.json({ workspace });
  } catch (error) {
    return reviewError(error);
  }
}

function reviewError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de décision.";
  if (message.startsWith("REVIEW_REPOSITORY_UNAVAILABLE")) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (
    message.startsWith("AUTHORIZATION_DENIED") ||
    message.startsWith("REVIEW_ROLE_DECISION_DENIED") ||
    message.startsWith("REVIEW_ASSIGNED_TO_ANOTHER_USER")
  ) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (message.startsWith("PROJECT_VERSION_CONFLICT")) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}
