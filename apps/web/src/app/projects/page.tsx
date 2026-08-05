import type { Metadata } from "next";
import { ProjectsTemplate } from "@/components/templates/ProjectsTemplate";
import { projectRepository } from "@/server/storage";

export const metadata: Metadata = { title: "Projets" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  return <ProjectsTemplate projects={await projectRepository.listProjects()} />;
}
