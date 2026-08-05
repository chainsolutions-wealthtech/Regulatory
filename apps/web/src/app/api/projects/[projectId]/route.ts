import { NextResponse } from "next/server";
import { getProject } from "@/server/project-store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  return project ? NextResponse.json({ project }) : NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
}
