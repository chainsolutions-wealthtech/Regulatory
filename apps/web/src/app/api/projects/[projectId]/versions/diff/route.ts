import { NextResponse } from "next/server";
import { buildProjectVersionDiff } from "@/server/project-version-diff";
import { projectRepository, projectVersionRepository } from "@/server/storage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const url = new URL(request.url);
  const fromVersion = parseVersion(url.searchParams.get("from"));
  const toVersion = parseVersion(url.searchParams.get("to"));
  if (fromVersion === null || toVersion === null) {
    return NextResponse.json(
      { error: "from et to doivent être des versions entières positives." },
      { status: 422 },
    );
  }

  const project = await projectRepository.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  const [fromProject, toProject] = await Promise.all([
    projectVersionRepository.getProjectVersion(projectId, fromVersion),
    projectVersionRepository.getProjectVersion(projectId, toVersion),
  ]);
  if (!fromProject || !toProject) {
    return NextResponse.json(
      { error: "Une des versions demandées est introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    projectId,
    ...buildProjectVersionDiff(fromProject, toProject),
    readOnly: true,
  });
}

function parseVersion(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
