import { NextResponse } from "next/server";
import { importStagingRepository } from "@/server/import";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; importId: string }> },
) {
  const { projectId, importId } = await params;
  try {
    const batch = await importStagingRepository.getBatch(importId);
    if (!batch || batch.projectId !== projectId) {
      return NextResponse.json({ error: "IMPORT_BATCH_NOT_FOUND" }, { status: 404 });
    }
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
  const message = error instanceof Error ? error.message : "Erreur de staging import.";
  if (message.startsWith("IMPORT_STAGING_REPOSITORY_UNAVAILABLE")) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message.startsWith("ORGANIZATION_MEMBERSHIP_REQUIRED")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
