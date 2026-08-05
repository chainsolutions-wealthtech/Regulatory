import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { ProjectRow } from "@/components/molecules/ProjectRow";
import type { ProjectSummary } from "@/domain/types";

export function ProjectsTemplate({ projects }: { projects: ProjectSummary[] }) {
  return (
    <AppShell active="projects">
      <AppHeader title="Projets de prospectus" description="Créez, reprenez et suivez chaque dossier réglementaire." actionHref="/projects/new" actionLabel="Nouveau projet" />
      <section className="content-section content-section--standalone">
        <div className="project-list">{projects.map((project) => <ProjectRow key={project.id} project={project} />)}</div>
      </section>
    </AppShell>
  );
}
