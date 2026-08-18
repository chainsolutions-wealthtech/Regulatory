import { NextResponse } from "next/server";
import { getRuntimeProjectVersionIdResolver } from "@/server/evidence";
import { getProspectusImportIngestionService } from "@/server/import";
import { importStagingQueryRepository } from "@/server/import/queries";
import { projectRepository, regulatoryStorageDriver } from "@/server/storage";

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
      evidenceObjectId?: unknown;
    };
    const evidenceObjectId = typeof body.evidenceObjectId === "string" ? body.evidenceObjectId.trim() : "";
    if (!evidenceObjectId) throw new Error("IMPORT_EVIDENCE_OBJECT_ID_REQUIRED");

    if (regulatoryStorageDriver !== "postgresql") {
      await getProspectusImportIngestionService().extractAndStage({
        projectId,
        projectVersion: Number(body.projectVersion),
        projectVersionId: "",
        evidenceObjectId,
      });
      throw new Error("IMPORT_INGESTION_SERVICE_UNAVAILABLE");
    }

    const project = await projectRepository.getProject(projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    const requestedVersion = body.projectVersion === undefined ? project.version : Number(body.projectVersion);
    if (!Number.isInteger(requestedVersion) || requestedVersion < 1) {
      throw new Error("IMPORT_PROJECT_VERSION_INVALID");
    }
    if (requestedVersion !== project.version) {
      throw new Error(`PROJECT_VERSION_CONFLICT:${project.version}`);
    }
    const projectVersionId = await getRuntimeProjectVersionIdResolver().resolve(projectId, project.version);

    const batch = await getProspectusImportIngestionService().extractAndStage({
      projectId,
      projectVersion: project.version,
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
    message.startsWith("PROJECT_VERSION_ID_RESOLVER_UNAVAILABLE") ||
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
  if (message.startsWith("PROJECT_VERSION_CONFLICT")) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  if (message.includes("INVALID") || message.includes("REQUIRED")) {
    return NextResponse.json({ error: message }, { status: 422 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
