import { NextResponse } from "next/server";
import { importStagingRepository } from "@/server/import";

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
  const decision = String(body.decision ?? "").trim();
  if (!importValueId || !["CONFIRMED_BY_HUMAN", "REJECTED_BY_HUMAN"].includes(decision)) {
    return NextResponse.json(
      { error: "importValueId et une décision humaine valide sont obligatoires." },
      { status: 422 },
    );
  }

  try {
    const existing = await importStagingRepository.getBatch(importId);
    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json({ error: "IMPORT_BATCH_NOT_FOUND" }, { status: 404 });
    }
    const batch = await importStagingRepository.reviewValue({
      importId,
      importValueId,
      decision: decision as "CONFIRMED_BY_HUMAN" | "REJECTED_BY_HUMAN",
    });
    return NextResponse.json({
      batch,
      canonicalWriteAllowed: false,
      readyForSubmission: false,
    });
  } catch (error) {
    return importError(error);
  }
}

function importError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de revue import.";
  if (message.startsWith("IMPORT_STAGING_REPOSITORY_UNAVAILABLE")) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (
    message.startsWith("ORGANIZATION_MEMBERSHIP_REQUIRED") ||
    message.startsWith("IMPORT_REVIEW_ROLE_REQUIRED")
  ) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (message.startsWith("IMPORT_BATCH_NOT_FOUND") || message.startsWith("IMPORT_VALUE_NOT_FOUND")) {
    return NextResponse.json({ error: message }, { status: 404 });
  }
  if (message.startsWith("IMPORT_VALUE_ALREADY_REVIEWED")) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
