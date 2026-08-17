import { NextResponse } from "next/server";
import { projectRepository, projectVersionRepository } from "@/server/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; version: string }> },
) {
  const { projectId, version: rawVersion } = await params;
  const version = parseVersion(rawVersion);
  if (version === null) {
    return NextResponse.json({ error: "Version invalide." }, { status: 422 });
  }
  const project = await projectRepository.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }
  const historical = await projectVersionRepository.getProjectVersion(projectId, version);
  if (!historical) {
    return NextResponse.json({ error: "Version introuvable." }, { status: 404 });
  }
  return NextResponse.json({
    project: historical,
    readOnly: true,
    readyForSubmission: false,
  });
}

function parseVersion(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
