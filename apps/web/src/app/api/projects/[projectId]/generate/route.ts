import { NextResponse } from "next/server";
import { buildProspectusPreview } from "@/server/generation-adapter";
import { getProject, persistGeneration } from "@/server/project-store";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  const preview = await buildProspectusPreview(project);
  const generation = {
    generationId: preview.generationId,
    generatedAt: preview.generatedAt,
    documentStatus: "DRAFT_PRE_COMPLIANCE_REVIEW" as const,
    readyForComplianceReview: preview.readyForComplianceReview,
    readyForSubmission: false as const,
  };
  await persistGeneration(projectId, generation);
  return NextResponse.json({ generation, preview });
}
