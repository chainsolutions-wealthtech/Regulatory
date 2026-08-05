import { NextResponse } from "next/server";
import { CATALOG_METADATA } from "@/domain/regulatory-catalog";
import { buildProspectusBundle } from "@/server/generation-adapter";
import { projectRepository } from "@/server/storage";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

  const bundle = await buildProspectusBundle(project);
  const preview = bundle.preview;
  const generation = {
    generationId: preview.generationId,
    generatedAt: preview.generatedAt,
    documentStatus: "DRAFT_PRE_COMPLIANCE_REVIEW" as const,
    readyForComplianceReview: preview.readyForComplianceReview,
    readyForSubmission: false as const,
    catalogDigest: CATALOG_METADATA.catalogDigest,
    requirementCount: CATALOG_METADATA.requirementCount,
    questionCount: preview.canonicalSnapshot.answerRecords.length,
  };
  const updatedProject = await projectRepository.persistGenerationArtifacts({
    projectId,
    generation,
    preview,
    canonicalSnapshot: preview.canonicalSnapshot,
    artifacts: bundle.artifacts,
  });
  return NextResponse.json({
    storageDriver: projectRepository.driver,
    generation: updatedProject.generation,
    preview,
    canonicalSnapshot: preview.canonicalSnapshot,
  });
}
