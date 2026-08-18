import { NextResponse } from "next/server";
import {
  getRuntimeEvidenceDescriptorService,
  getRuntimeEvidenceReleaseService,
} from "@/server/evidence";
import { toPublicEvidenceMetadata } from "@/server/evidence/evidence-public-view";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ objectId: string }> },
) {
  try {
    const { objectId } = await params;
    const descriptor = await getRuntimeEvidenceDescriptorService().readForVerification(objectId);
    const released = await getRuntimeEvidenceReleaseService().releaseCleanScan({
      descriptor,
      releasedAt: new Date().toISOString(),
    });
    return NextResponse.json({
      evidence: toPublicEvidenceMetadata(released),
      released: true,
      readyForSubmission: false,
    });
  } catch (error) {
    return evidenceReleaseError(error);
  }
}

function evidenceReleaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de libération de preuve.";
  if (
    message.startsWith("EVIDENCE_DESCRIPTOR_SERVICE_UNAVAILABLE") ||
    message.startsWith("EVIDENCE_RELEASE_SERVICE_UNAVAILABLE") ||
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
  if (
    message.startsWith("EVIDENCE_RELEASE_REQUIRES_CLEAN_SCAN") ||
    message.startsWith("EVIDENCE_CLEAN_SCAN_REQUIRED_BEFORE_RELEASE")
  ) return NextResponse.json({ error: message }, { status: 409 });
  return NextResponse.json({ error: message }, { status: 400 });
}
