import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { PROJECT_STATUS_LABELS } from "@/domain/constants";
import type { ProspectusProject } from "@/domain/types";
import { calculateProgress } from "@/domain/questionnaire";

export function ProjectHero({ project }: { project: ProspectusProject }) {
  const progress = calculateProgress(project);
  return (
    <section className="project-hero">
      <div className="project-hero__main">
        <div className="project-hero__meta"><Badge tone="info">{project.fundType} · {project.jurisdiction}</Badge><Badge tone={project.status === "PRE_COMPLIANCE_REVIEW" ? "warning" : "neutral"}>{PROJECT_STATUS_LABELS[project.status]}</Badge></div>
        <h1>{project.name}</h1>
        <p>{project.managementCompany.legalName}</p>
        <ProgressBar value={progress} label="Progression du questionnaire" />
      </div>
      <div className="project-hero__actions">
        <Button href={`/projects/${project.id}/questionnaire`} icon="document">Continuer le questionnaire</Button>
        <Button href={`/projects/${project.id}/preview`} variant="secondary">Voir l’aperçu</Button>
      </div>
    </section>
  );
}
