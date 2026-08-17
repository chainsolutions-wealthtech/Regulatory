import { NextResponse } from "next/server";
import { getRuntimeEvidenceIngestionService } from "@/server/evidence";

export const runtime = "nodejs";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const service = getRuntimeEvidenceIngestionService();
    const form = await request.formData();
    const projectVersionId = String(form.get("projectVersionId") ?? "").trim();
    const file = form.get("file");
    if (!projectVersionId) throw new Error("EVIDENCE_PROJECT_VERSION_ID_REQUIRED");
    if (!(file instanceof File)) throw new Error("EVIDENCE_FILE_REQUIRED");
    if (file.size < 1) throw new Error("EVIDENCE_FILE_EMPTY");
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("EVIDENCE_FILE_TOO_LARGE");

    const descriptor = await service.stageEvidence({
      projectVersionId,
      originalFilename: file.name,
      ...(file.type ? { declaredMediaType: file.type } : {}),
      content: new Uint8Array(await file.arrayBuffer()),
    });

    return NextResponse.json({
      evidence: descriptor,
      quarantined: true,
      scanStatus: "PENDING",
      clean: false,
      readyForSubmission: false,
    }, { status: 201 });
  } catch (error) {
    return evidenceErrorResponse(error);
  }
}

function evidenceErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur d'ingestion de preuve.";
  if (
    message.startsWith("EVIDENCE_INGESTION_SERVICE_UNAVAILABLE") ||
    message.startsWith("EVIDENCE_RUNTIME_") ||
    message.startsWith("EVIDENCE_DEVELOPMENT_DRIVER_") ||
    message.startsWith("RUNTIME_CONFIGURATION_MISSING:REGULATORY_EVIDENCE_")
  ) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message.startsWith("AUTHORIZATION_DENIED") || message.startsWith("ORGANIZATION_MEMBERSHIP_REQUIRED")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
