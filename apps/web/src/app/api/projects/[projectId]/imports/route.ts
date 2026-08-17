import { NextResponse } from "next/server";
import { getProspectusImportIngestionService } from "@/server/import";
import { importStagingQueryRepository } from "@/server/import/queries";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const imports = await importStagingQueryRepository.listProjectImports(projectId);
    return NextResponse.json({
      imports,
      readOnly: true,
      canonicalWriteAllowed: false,
      readyForSubmission: false,
    });
  } catch (error) {
    return importErrorResponse(error, "Erreur de listing import.");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const body = await request.json() as {
      projectVersion?: unknown;
      projectVersionId?: unknown;
      evidenceObjectId?: unknown;
    };
    const projectVersion = Number(body.projectVersion);
    const projectVersionId = typeof body.projectVersionId === "string" ? body.projectVersionId : "";
    const evidenceObjectId = typeof body.evidenceObjectId === "string" ? body.evidenceObjectId : "";

    const batch = await getProspectusImportIngestionService().extractAndStage({
      projectId,
      projectVersion,
      projectVersionId,
      evidenceObjectId,
    });
    return NextResponse.json({
      batch,
      extractedUnverified: true,
      canonicalWriteAllowed: false,
      readyForSubmission: false,
    }, { status: 201 });
  } catch (error) {
    return importErrorResponse(error, "Erreur d'extraction prospectus.");
  }
}

function importErrorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (
    message.startsWith("IMPORT_STAGING_QUERY_UNAVAILABLE") ||
    message.startsWith("IMPORT_INGESTION_SERVICE_UNAVAILABLE") ||
    message.startsWith("EVIDENCE_RUNTIME_") ||
    message.startsWith("EVIDENCE_DEVELOPMENT_DRIVER_") ||
    message.startsWith("RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_")
  ) {
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
  if (message.includes("NOT_FOUND")) {
    return NextResponse.json({ error: message }, { status: 404 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
