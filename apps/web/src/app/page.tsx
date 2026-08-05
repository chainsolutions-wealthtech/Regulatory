import { DashboardTemplate } from "@/components/templates/DashboardTemplate";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await projectRepository.listProjects();
  return <DashboardTemplate projects={projects} />;
}
