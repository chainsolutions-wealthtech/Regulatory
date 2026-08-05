import { DashboardTemplate } from "@/components/templates/DashboardTemplate";
import { listProjects } from "@/server/project-store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await listProjects();
  return <DashboardTemplate projects={projects} />;
}
