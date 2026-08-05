import { NextResponse } from "next/server";
import type { ProspectusRole } from "@/domain/authorization";
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
  const approvalType = String(body.approvalType ?? "").toUpperCase() as ProspectusRole;
  const rationale = String(body.rationale ?? "").trim();
  if (!Number.isInteger(expectedVersion) || expectedVersion <= 0 || !rationale) {
    return NextResponse.json(
      { error: "expectedVersion et rationale sont obligatoires." },
      { status: 422 },
    );
  }
  if (
    !["PRODUCT", "RISK", "OPERATIONS", "COMPLIANCE", "LEGAL", "TAX", "SECURITY"].includes(
      approvalType,
    )
  ) {
    return NextResponse.json({ error: "Type d’approbation interne non autorisé." }, { status: 422 });
  }
  try {
    const workspace = await reviewRepository.recordInternalApproval({
      projectId,
      expectedVersion,
      approvalType: approvalType as
        | "PRODUCT"
        | "RISK"
        | "OPERATIONS"
        | "COMPLIANCE"
        | "LEGAL"
        | "TAX"
        | "SECURITY",
      rationale,
    });
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    return reviewError(error);
  }
}

function reviewError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur d’approbation interne.";
  if (message.startsWith("REVIEW_REPOSITORY_UNAVAILABLE")) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (
    message.startsWith("AUTHORIZATION_DENIED") ||
    message.startsWith("INTERNAL_APPROVAL_ROLE_MISMATCH")
  ) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (message.startsWith("PROJECT_VERSION_CONFLICT")) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
