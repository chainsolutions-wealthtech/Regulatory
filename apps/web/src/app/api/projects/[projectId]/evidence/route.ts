import { NextResponse } from "next/server";
import {
  getRuntimeEvidenceIngestionService,
  getRuntimeEvidenceProjectQueryRepository,
  getRuntimeProjectVersionIdResolver,
} from "@/server/evidence";
import { toPublicEvidenceMetadata } from "@/server/evidence/evidence-public-view";
import { projectRepository, regulatoryStorageDriver } from "@/server/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    if (regulatoryStorageDriver !== "postgresql") {
      throw new Error("EVIDENCE_PROJECT_QUERY_UNAVAILABLE: PostgreSQL + OIDC requis.");
    }
    const { projectId } = await params;
    const project = await projectRepository.getProject(projectId);
    if (!project) return NextResponse.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 });
    const evidence = await getRuntimeEvidenceProjectQueryRepository().listProjectEvidence(projectId);
    return NextResponse.json({ evidence, readyForSubmission: false });
  } catch (error) {
    return projectEvidenceError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    if (regulatoryStorageDriver !== "postgresql") {
      throw new Error("EVIDENCE_INGESTION_SERVICE_UNAVAILABLE: PostgreSQL + OIDC + store privé requis.");
    }
    const { projectId } = await params;
    const project = await projectRepository.getProject(projectId);
    if (!project) return NextResponse.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "EVIDENCE_FILE_REQUIRED" }, { status: 422 });
    }
    if (file.size < 1 || file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "EVIDENCE_FILE_SIZE_INVALID" }, { status: 413 });
    }

    const projectVersionId = await getRuntimeProjectVersionIdResolver().resolve(projectId, project.version);
    const descriptor = await getRuntimeEvidenceIngestionService().stageEvidence({
      projectVersionId,
      originalFilename: file.name,
      ...(file.type ? { declaredMediaType: file.type } : {}),
      content: new Uint8Array(await file.arrayBuffer()),
    });
    return NextResponse.json({
      evidence: toPublicEvidenceMetadata(descriptor),
      projectVersion: project.version,
      quarantined: true,
      clean: false,
      readyForSubmission: false,
    }, { status: 201 });
  } catch (error) {
    return projectEvidenceError(error);
  }
}

function projectEvidenceError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de preuve projet.";
  if (
    message.startsWith("EVIDENCE_INGESTION_SERVICE_UNAVAILABLE") ||
    message.startsWith("EVIDENCE_PROJECT_QUERY_UNAVAILABLE") ||
    message.startsWith("PROJECT_VERSION_ID_RESOLVER_UNAVAILABLE") ||
    message.startsWith("EVIDENCE_RUNTIME_") ||
    message.startsWith("EVIDENCE_DEVELOPMENT_DRIVER_") ||
    message.startsWith("RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_")
  ) return NextResponse.json({ error: message }, { status: 503 });
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message.startsWith("AUTHORIZATION_DENIED") || message.startsWith("ORGANIZATION_MEMBERSHIP_REQUIRED")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (message.includes("NOT_FOUND")) return NextResponse.json({ error: message }, { status: 404 });
  if (message.includes("INVALID") || message.includes("REQUIRED")) {
    return NextResponse.json({ error: message }, { status: 422 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
