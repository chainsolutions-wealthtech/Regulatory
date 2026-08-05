import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { ProjectRow } from "@/components/molecules/ProjectRow";
import { StatCard } from "@/components/molecules/StatCard";
import type { ProjectSummary } from "@/domain/types";

export function DashboardTemplate({ projects }: { projects: ProjectSummary[] }) {
  const blockers = projects.reduce((sum, project) => sum + project.blockers, 0);
  const warnings = projects.reduce((sum, project) => sum + project.warnings, 0);
  const average = projects.length === 0 ? 0 : Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length);
  return (
    <AppShell active="dashboard">
      <AppHeader title="Tableau de bord" description="Pilotez les projets de prospectus, les contrôles et les revues internes." actionHref="/projects/new" actionLabel="Nouveau prospectus" />
      <div className="page-stack">
        <section className="stat-grid">
          <StatCard label="Projets actifs" value={projects.length} detail="Prototype local" tone="info" />
          <StatCard label="Progression moyenne" value={`${average}%`} detail="Questionnaire" tone="success" />
          <StatCard label="Blocages" value={blockers} detail="À corriger" tone={blockers > 0 ? "danger" : "success"} />
          <StatCard label="Avertissements" value={warnings} detail="Revue humaine" tone="warning" />
        </section>
        <section className="content-section">
          <div className="section-heading"><div><h2>Projets récents</h2><p>Chaque projet conserve ses réponses, versions, contrôles et générations.</p></div></div>
          <div className="project-list">
            {projects.length > 0 ? projects.map((project) => <ProjectRow key={project.id} project={project} />) : <div className="empty-state"><h3>Aucun projet</h3><p>Créez un premier prospectus pour lancer le questionnaire guidé.</p></div>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
