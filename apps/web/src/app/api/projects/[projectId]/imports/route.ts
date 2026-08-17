import { NextResponse } from "next/server";
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
    const message = error instanceof Error ? error.message : "Erreur de listing import.";
    if (message.startsWith("IMPORT_STAGING_QUERY_UNAVAILABLE")) {
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
}
