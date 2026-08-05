import { notFound } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ControlAlert } from "@/components/molecules/ControlAlert";
import { ControlSummary } from "@/components/organisms/ControlSummary";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { validateProject } from "@/domain/questionnaire";
import { getProject } from "@/server/project-store";

export const dynamic = "force-dynamic";

export default async function ControlsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();
  const findings = validateProject(project);
  return (
    <ProjectWorkspaceTemplate project={project} active="controls">
      <div className="page-stack">
        <div className="page-title-row"><div><h1>Contrôles et couverture</h1><p>Les contrôles automatiques signalent les incohérences ; ils ne remplacent pas les revues humaines.</p></div><Button href={`/projects/${project.id}/preview`} icon="arrow">Voir l’aperçu</Button></div>
        <ControlSummary project={project} findings={findings} />
        <section className="content-section">
          <div className="section-heading"><div><h2>Résultats</h2><p>{findings.length} point(s) actif(s) sur le snapshot courant.</p></div></div>
          <div className="alert-stack">{findings.length > 0 ? findings.map((finding) => <ControlAlert key={finding.id} finding={finding} />) : <div className="empty-state"><h3>Aucune anomalie automatique</h3><p>La revue conformité, juridique et fiscale reste néanmoins obligatoire.</p></div>}</div>
        </section>
        <section className="content-section">
          <div className="section-heading"><div><h2>Couverture CIRC005</h2><p>Les statuts ne doivent jamais masquer une absence de réponse ou de preuve.</p></div></div>
          <div className="coverage-table">
            {Object.entries(project.coverage).map(([status, count]) => <div className="coverage-table__row" key={status}><strong>{status}</strong><span>{count}</span></div>)}
          </div>
        </section>
      </div>
    </ProjectWorkspaceTemplate>
  );
}
