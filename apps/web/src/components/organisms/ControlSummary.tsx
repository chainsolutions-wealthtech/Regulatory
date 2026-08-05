import { StatCard } from "@/components/molecules/StatCard";
import type { ProspectusProject, ValidationFinding } from "@/domain/types";

export function ControlSummary({ project, findings }: { project: ProspectusProject; findings: ValidationFinding[] }) {
  const blockers = findings.filter((finding) => finding.severity === "BLOCKER").length;
  const warnings = findings.filter((finding) => finding.severity === "WARNING").length;
  return (
    <div className="stat-grid">
      <StatCard detail="Circulaire 05" label="Exigences" tone="info" value="62" />
      <StatCard detail="Aucune omission" label="Manquantes" tone="success" value={project.coverage.MISSING} />
      <StatCard detail="Revue humaine" label="En attente" tone="warning" value={project.coverage.PENDING_REVIEW} />
      <StatCard detail={`${blockers} blocage`} label="Avertissements" tone={blockers > 0 ? "danger" : "warning"} value={warnings} />
    </div>
  );
}
