import { NextResponse } from "next/server";
import { CATALOG_METADATA } from "@/domain/regulatory-catalog";
import { buildProspectusBundle } from "@/server/generation-adapter";
import { projectRepository } from "@/server/storage";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const [{ projectId }, body] = await Promise.all([
    params,
    request.json().catch(() => ({})) as Promise<Record<string, unknown>>,
  ]);
  const expectedVersion = parseOptionalVersion(body.expectedVersion);
  if (body.expectedVersion !== undefined && expectedVersion === undefined) {
    return NextResponse.json({ error: "expectedVersion doit être un entier positif." }, { status: 422 });
  }
  const project = await projectRepository.getProject(projectId);
  if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

  try {
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
      expectedVersion,
    });
    return NextResponse.json({
      storageDriver: projectRepository.driver,
      generation: updatedProject.generation,
      preview,
      canonicalSnapshot: preview.canonicalSnapshot,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de génération.";
    const status = message.startsWith("PROJECT_VERSION_CONFLICT") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

function parseOptionalVersion(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
