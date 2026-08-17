import { NextResponse } from "next/server";
import { projectRepository, projectVersionRepository } from "@/server/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }
  const versions = await projectVersionRepository.listProjectVersions(projectId);
  return NextResponse.json({
    projectId,
    currentVersion: project.version,
    versions,
    readOnly: true,
    readyForSubmission: false,
  });
}
