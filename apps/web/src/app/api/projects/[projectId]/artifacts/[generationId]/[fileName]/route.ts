import { NextResponse } from "next/server";
import { generationArtifactRepository } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; generationId: string; fileName: string }> },
) {
  const { projectId, generationId, fileName } = await params;
  try {
    const artifact = await generationArtifactRepository.read(projectId, generationId, fileName);
    if (!artifact) return NextResponse.json({ error: "ARTIFACT_NOT_FOUND" }, { status: 404 });

    return new Response(new Uint8Array(artifact.content), {
      status: 200,
      headers: {
        "Content-Type": artifact.mediaType,
        "Content-Length": String(artifact.byteSize),
        "Content-Disposition": `attachment; filename="${artifact.fileName}"`,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
        "X-Content-SHA256": artifact.sha256,
        ETag: `"${artifact.sha256}"`,
        "X-Regulatory-Ready-For-Submission": "false",
      },
    });
  } catch (error) {
    return artifactError(error);
  }
}

function artifactError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de lecture de l’artefact.";
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message.startsWith("AUTHORIZATION_DENIED")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (message === "PROJECT_NOT_FOUND" || message === "ARTIFACT_NOT_FOUND") {
    return NextResponse.json({ error: message }, { status: 404 });
  }
  if (message.includes("INTEGRITY_MISMATCH")) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
