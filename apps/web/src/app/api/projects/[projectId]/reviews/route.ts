import { NextResponse } from "next/server";
import type { ProspectusRole } from "@/domain/authorization";
import { reviewRepository } from "@/server/reviews";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    return NextResponse.json({ workspace: await reviewRepository.getWorkspace(projectId) });
  } catch (error) {
    return reviewError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const [{ projectId }, body] = await Promise.all([
    params,
    request.json().catch(() => null) as Promise<Record<string, unknown> | null>,
  ]);
  if (!body) return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  const expectedVersion = positiveInteger(body.expectedVersion);
  const role = String(body.role ?? "").toUpperCase() as ProspectusRole;
  if (!expectedVersion || !role) {
    return NextResponse.json(
      { error: "expectedVersion et role sont obligatoires." },
      { status: 422 },
    );
  }
  try {
    const workspace = await reviewRepository.requestReview({
      projectId,
      expectedVersion,
      role,
      assignedTo: optionalString(body.assignedTo),
      dueAt: optionalString(body.dueAt),
      scope: isRecord(body.scope) ? body.scope : {},
    });
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    return reviewError(error);
  }
}

function reviewError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de revue.";
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

function positiveInteger(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function optionalString(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
