import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "from et to doivent être des versions entières positives." }, { status: 422 });
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
    return NextResponse.json({ error: "Une des versions demandées est introuvable." }, { status: 404 });
  }

  const fromIds = new Set(Object.keys(fromProject.answers));
  const toIds = new Set(Object.keys(toProject.answers));
  const addedAnswerIds = [...toIds].filter((id) => !fromIds.has(id)).toSorted();
  const removedAnswerIds = [...fromIds].filter((id) => !toIds.has(id)).toSorted();
  const changedAnswerIds = [...fromIds]
    .filter((id) => toIds.has(id) && stableSerialize(fromProject.answers[id]?.value) !== stableSerialize(toProject.answers[id]?.value))
    .toSorted();

  return NextResponse.json({
    projectId,
    fromVersion,
    toVersion,
    changedAnswerIds,
    addedAnswerIds,
    removedAnswerIds,
    changedAnswerCount: changedAnswerIds.length,
    addedAnswerCount: addedAnswerIds.length,
    removedAnswerCount: removedAnswerIds.length,
    readOnly: true,
    readyForSubmission: false,
  });
}

function parseVersion(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableSerialize(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
