import { notFound } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ControlAlert } from "@/components/molecules/ControlAlert";
import { ControlSummary } from "@/components/organisms/ControlSummary";
import { ProjectHero } from "@/components/organisms/ProjectHero";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { calculateProgress, getNextIncompleteGroup, validateProject } from "@/domain/questionnaire";
import { getProject } from "@/server/project-store";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();
  const findings = validateProject(project);
  const nextGroup = getNextIncompleteGroup(project);
  return (
    <ProjectWorkspaceTemplate project={project} active="overview">
      <div className="page-stack">
        <ProjectHero project={project} />
        <ControlSummary project={project} findings={findings} />
        <section className="split-grid">
          <article className="content-section">
            <div className="section-heading"><div><h2>Prochaine action</h2><p>Le parcours reprend au premier groupe contenant une réponse obligatoire manquante.</p></div></div>
            <div className="next-action-card">
              <div><strong>{nextGroup?.title ?? "Questionnaire renseigné"}</strong><p>{nextGroup?.description ?? "Passez aux contrôles et aux revues humaines."}</p></div>
              <Button href={nextGroup ? `/projects/${project.id}/questionnaire?group=${nextGroup.id}` : `/projects/${project.id}/controls`} icon="arrow">Continuer</Button>
            </div>
            <dl className="detail-list"><div><dt>Progression</dt><dd>{calculateProgress(project)}%</dd></div><div><dt>Version du projet</dt><dd>{project.version}</dd></div><div><dt>Dernière mise à jour</dt><dd>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(project.updatedAt))}</dd></div></dl>
          </article>
          <article className="content-section">
            <div className="section-heading"><div><h2>Points à traiter</h2><p>Les statuts restent explicites jusqu’à leur résolution.</p></div></div>
            <div className="alert-stack">{findings.slice(0, 3).map((finding) => <ControlAlert key={finding.id} finding={finding} />)}</div>
          </article>
        </section>
      </div>
    </ProjectWorkspaceTemplate>
  );
}
