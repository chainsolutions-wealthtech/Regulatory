import { NextResponse } from "next/server";
import type { ReviewWorkflowTransitionId } from "@/domain/review-workflow";
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
  const transitionId = String(body.transitionId ?? "") as ReviewWorkflowTransitionId;
  if (!Number.isInteger(expectedVersion) || expectedVersion <= 0 || !transitionId) {
    return NextResponse.json(
      { error: "expectedVersion et transitionId sont obligatoires." },
      { status: 422 },
    );
  }
  try {
    const workspace = await reviewRepository.transition({
      projectId,
      expectedVersion,
      transitionId,
      rationale: optionalString(body.rationale),
    });
    return NextResponse.json({ workspace });
  } catch (error) {
    return workflowError(error);
  }
}

function workflowError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de transition.";
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
  if (message.startsWith("WORKFLOW_TRANSITION_DENIED")) {
    return NextResponse.json({ error: message }, { status: 422 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}

function optionalString(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}
