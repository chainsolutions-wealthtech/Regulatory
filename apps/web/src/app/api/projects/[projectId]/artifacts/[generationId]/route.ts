import { NextResponse } from "next/server";
import { generationArtifactRepository } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; generationId: string }> },
) {
  const { projectId, generationId } = await params;
  try {
    const artifacts = await generationArtifactRepository.list(projectId, generationId);
    return NextResponse.json(
      {
        projectId,
        generationId,
        driver: generationArtifactRepository.driver,
        artifactCount: artifacts.length,
        artifacts,
        readyForSubmission: false,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return artifactError(error);
  }
}

function artifactError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de lecture des artefacts.";
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message.startsWith("AUTHORIZATION_DENIED")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (message === "PROJECT_NOT_FOUND") {
    return NextResponse.json({ error: message }, { status: 404 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
