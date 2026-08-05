import { NextResponse } from "next/server";
import { CATALOG_METADATA } from "@/domain/regulatory-catalog";
import { getQuestionsByGroup } from "@/domain/questionnaire";
import { projectRepository } from "@/server/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  return NextResponse.json({
    projectId,
    storageDriver: projectRepository.driver,
    catalog: CATALOG_METADATA,
    groups: getQuestionsByGroup(project),
    answers: project.answers,
  });
}
