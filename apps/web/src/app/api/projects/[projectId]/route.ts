import { NextResponse } from "next/server";
import { projectRepository } from "@/server/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  return project
    ? NextResponse.json({ project })
    : NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
}
