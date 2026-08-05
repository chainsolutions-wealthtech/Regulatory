import { NextResponse } from "next/server";
import { reviewRepository } from "@/server/reviews";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const [{ projectId }, body] = await Promise.all([
    params,
    request.json().catch(() => null) as Promise<Record<string, unknown> | null>,
  ]);
  if (!body) return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  const expectedVersion = Number(body.expectedVersion);
  const commentBody = String(body.body ?? "").trim();
  if (!Number.isInteger(expectedVersion) || expectedVersion <= 0 || !commentBody) {
    return NextResponse.json(
      { error: "expectedVersion et body sont obligatoires." },
      { status: 422 },
    );
  }
  const visibility = String(body.visibility ?? "PROJECT_REVIEWERS");
  if (!["PROJECT_REVIEWERS", "ROLE_ONLY", "AUDIT_ONLY"].includes(visibility)) {
    return NextResponse.json({ error: "Visibilité non autorisée." }, { status: 422 });
  }
  try {
    const workspace = await reviewRepository.addComment({
      projectId,
      expectedVersion,
      reviewRequestId: optionalString(body.reviewRequestId),
      parentCommentId: optionalString(body.parentCommentId),
      body: commentBody,
      visibility: visibility as "PROJECT_REVIEWERS" | "ROLE_ONLY" | "AUDIT_ONLY",
    });
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    return reviewError(error);
  }
}

function reviewError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de commentaire.";
  if (message.startsWith("REVIEW_REPOSITORY_UNAVAILABLE")) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message.startsWith("AUTHORIZATION_DENIED")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (message.startsWith("PROJECT_VERSION_CONFLICT")) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}

function optionalString(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}
