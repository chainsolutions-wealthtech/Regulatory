import { NextResponse } from "next/server";
import { getQuestionById } from "@/domain/regulatory-catalog";
import { importPromotionRepository } from "@/server/import";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; importId: string }> },
) {
  const [{ projectId, importId }, body] = await Promise.all([
    params,
    request.json().catch(() => null) as Promise<Record<string, unknown> | null>,
  ]);
  if (!body) return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });

  const importValueId = String(body.importValueId ?? "").trim();
  const questionId = String(body.questionId ?? "").trim();
  const expectedVersion = Number(body.expectedVersion);
  if (
    !importValueId ||
    !questionId ||
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    return NextResponse.json(
      { error: "importValueId, questionId et expectedVersion positif sont obligatoires." },
      { status: 422 },
    );
  }
  const question = getQuestionById(questionId);
  if (!question || question.interactive === false) {
    return NextResponse.json({ error: "Question cible inconnue ou non interactive." }, { status: 422 });
  }

  try {
    const receipt = await importPromotionRepository.promoteConfirmedValue({
      projectId,
      importId,
      importValueId,
      questionId,
      expectedVersion,
    });
    return NextResponse.json({
      receipt,
      canonicalPromotionAutomatic: false,
      readyForSubmission: false,
    });
  } catch (error) {
    return promotionError(error);
  }
}

function promotionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de promotion import.";
  if (message.startsWith("IMPORT_PROMOTION_REPOSITORY_UNAVAILABLE")) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (
    message.startsWith("ORGANIZATION_MEMBERSHIP_REQUIRED") ||
    message.startsWith("AUTHORIZATION_DENIED")
  ) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (message.startsWith("IMPORT_PROMOTION_SCOPE_MISMATCH")) {
    return NextResponse.json({ error: message }, { status: 404 });
  }
  if (
    message.startsWith("PROJECT_VERSION_CONFLICT") ||
    message.startsWith("IMPORT_VALUE_ALREADY_PROMOTED")
  ) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  if (
    message.startsWith("IMPORT_VALUE_NOT_HUMAN_CONFIRMED") ||
    message.startsWith("QUESTION_UNKNOWN_OR_NON_INTERACTIVE") ||
    message.startsWith("IMPORT_PROMOTION_QUESTION_ID_REQUIRED") ||
    message.startsWith("IMPORT_PROMOTION_EXPECTED_VERSION_REQUIRED")
  ) {
    return NextResponse.json({ error: message }, { status: 422 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
