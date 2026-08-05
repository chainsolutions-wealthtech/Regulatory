import { NextResponse } from "next/server";
import { CATALOG_METADATA } from "@/domain/regulatory-catalog";
import { getQuestionsByGroup } from "@/domain/questionnaire";
import { getProject } from "@/server/project-store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  return NextResponse.json({
    projectId,
    catalog: CATALOG_METADATA,
    groups: getQuestionsByGroup(project),
    answers: project.answers,
  });
}
