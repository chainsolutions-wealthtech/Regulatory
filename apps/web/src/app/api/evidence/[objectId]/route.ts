import { NextResponse } from "next/server";
import { getRuntimeEvidenceDescriptorService } from "@/server/evidence";
import { toPublicEvidenceMetadata } from "@/server/evidence/evidence-public-view";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ objectId: string }> },
) {
  try {
    const { objectId } = await params;
    const descriptor = await getRuntimeEvidenceDescriptorService().readMetadata(objectId);
    return NextResponse.json({ evidence: toPublicEvidenceMetadata(descriptor), readyForSubmission: false });
  } catch (error) {
    return evidenceMetadataError(error);
  }
}

function evidenceMetadataError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de lecture des métadonnées de preuve.";
  if (
    message.startsWith("EVIDENCE_DESCRIPTOR_SERVICE_UNAVAILABLE") ||
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
  if (message.startsWith("EVIDENCE_OBJECT_NOT_FOUND")) {
    return NextResponse.json({ error: message }, { status: 404 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
