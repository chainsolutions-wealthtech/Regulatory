import type { ReactNode } from "react";
import { AppShell } from "@/components/organisms/AppShell";
import { ProjectWorkspaceNav } from "@/components/organisms/ProjectWorkspaceNav";
import type { ProspectusProject } from "@/domain/types";

export function ProjectWorkspaceTemplate({ project, active, children }: { project: ProspectusProject; active: "overview" | "questionnaire" | "controls" | "preview"; children: ReactNode }) {
  return (
    <AppShell active="projects">
      <div className="workspace-topbar"><div><a href="/projects">Projets</a><span>/</span><strong>{project.name}</strong></div><span>Version {project.version}</span></div>
      <ProjectWorkspaceNav projectId={project.id} active={active} />
      <div className="workspace-body">{children}</div>
    </AppShell>
  );
}
