import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { PROJECT_STATUS_LABELS } from "@/domain/constants";
import type { ProjectSummary } from "@/domain/types";

export function ProjectRow({ project }: { project: ProjectSummary }) {
  const tone = project.blockers > 0 ? "danger" : project.warnings > 0 ? "warning" : "success";
  return (
    <Link className="project-row" href={`/projects/${project.id}`}>
      <div className="project-row__identity">
        <div className="project-row__icon"><Icon name="document" size={20} /></div>
        <div><strong>{project.name}</strong><span>{categoryLabel(project.category)}</span></div>
      </div>
      <Badge tone={tone}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
      <ProgressBar value={project.progress} />
      <div className="project-row__issues">
        <span>{project.blockers} blocage</span>
        <span>{project.warnings} avert.</span>
      </div>
      <Icon name="chevron" size={18} />
    </Link>
  );
}

function categoryLabel(category: ProjectSummary["category"]): string {
  return ({ MONETARY: "Monétaire", BOND: "Obligataire", EQUITY: "Actions", DIVERSIFIED: "Diversifié", FUND_OF_FUNDS: "Fonds de fonds" })[category];
}
