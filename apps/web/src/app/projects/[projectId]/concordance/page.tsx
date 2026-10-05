import { notFound } from "next/navigation";
import { ConcordanceTemplate } from "@/components/templates/ConcordanceTemplate";
import { buildCanonicalSnapshot } from "@/server/canonical-snapshot";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function ConcordancePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) notFound();
  const snapshot = buildCanonicalSnapshot(project);
  return <ConcordanceTemplate project={project} snapshot={snapshot} />;
}
