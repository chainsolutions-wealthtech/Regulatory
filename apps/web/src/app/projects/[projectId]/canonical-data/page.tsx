import { notFound } from "next/navigation";
import { CanonicalDataTemplate } from "@/components/templates/CanonicalDataTemplate";
import { buildCanonicalSnapshot } from "@/server/canonical-snapshot";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function CanonicalDataPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) notFound();
  const snapshot = buildCanonicalSnapshot(project);
  return <CanonicalDataTemplate project={project} snapshot={snapshot} />;
}
