import { OperationsCockpitTemplate } from "@/components/templates/OperationsCockpitTemplate";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const projects = await projectRepository.listProjects();
  return <OperationsCockpitTemplate projects={projects} />;
}
