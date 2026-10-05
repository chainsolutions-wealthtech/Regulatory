import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { CLAUSE_CATALOG } from "@/domain/clause-catalog";
import {
  CATALOG_METADATA,
  REGULATORY_REQUIREMENTS,
  getQuestionById,
} from "@/domain/regulatory-catalog";
import type { CanonicalSnapshot, ProspectusProject } from "@/domain/types";

function registryTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  const normalized = status.toUpperCase();
  if (normalized.includes("APPROVED") || normalized.includes("VALIDATED")) return "success";
  if (normalized.includes("REJECT")) return "danger";
  if (normalized.includes("PENDING") || normalized.includes("REVIEW")) return "warning";
  return "info";
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function ConcordanceTemplate({
  project,
  snapshot,
}: {
  project: ProspectusProject;
  snapshot: CanonicalSnapshot;
}) {
  const rows = REGULATORY_REQUIREMENTS.map((requirement) => {
    const records = snapshot.answerRecords.filter((record) =>
      record.requirementIds.includes(requirement.requirementId),
    );
    const clauses = CLAUSE_CATALOG.filter((clause) =>
      clause.requirementIds.includes(requirement.requirementId),
    );
    const question = getQuestionById(requirement.questionId);
    const canonicalPaths = [
      ...new Set([
        ...requirement.canonicalFieldPaths,
        ...records.flatMap((record) => record.canonicalFieldPaths),
      ]),
    ];
    return {
      requirement,
      records,
      clauses,
      question,
      canonicalPaths,
      hasData: records.some((record) => hasMeaningfulValue(record.value)),
      reviewStatuses: [...new Set(records.map((record) => record.reviewStatus))],
    };
  });

  const withData = rows.filter((row) => row.hasData).length;
  const withClauses = rows.filter((row) => row.clauses.length > 0).length;
  const pendingRegistry = rows.filter((row) =>
    row.requirement.registryReviewStatus.toUpperCase().includes("PENDING"),
  ).length;

  return (
    <ProjectWorkspaceTemplate project={project} active="concordance">
      <div className="page-stack">
        <div className="page-title-row">
          <div>
            <h1>Concordance réglementaire</h1>
            <p>
              Crosswalk en lecture seule : exigence → question → donnée canonique → clause →
              section documentaire → revue. L’absence de donnée n’est jamais transformée en
              non-applicabilité.
            </p>
          </div>
          <Link className="button button--secondary" href={`/projects/${project.id}/canonical-data`}>
            Données canoniques
          </Link>
        </div>

        <section className="stat-grid">
          <StatCard label="Exigences" value={CATALOG_METADATA.requirementCount} detail={CATALOG_METADATA.rulePack} tone="info" />
          <StatCard label="Avec donnée projet" value={withData} detail="Snapshot courant" tone="success" />
          <StatCard label="Avec clause liée" value={withClauses} detail="Catalogue clauses" tone="info" />
          <StatCard label="Registre en revue" value={pendingRegistry} detail="Validation humaine" tone={pendingRegistry > 0 ? "warning" : "success"} />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Chaîne de traçabilité</h2>
              <p>
                Les statuts de couverture affichés sont ceux du catalogue réglementaire ; ils ne
                constituent pas à eux seuls une validation du dossier courant.
              </p>
            </div>
            <Badge tone="danger">Soumission interdite</Badge>
          </div>
          <div className="coverage-table">
            {rows.map((row) => (
              <div className="coverage-table__row traceability-row" key={row.requirement.requirementId}>
                <div>
                  <strong>{row.requirement.requirementId} — {row.requirement.label}</strong>
                  <div><small>{row.requirement.sourceReference} · {row.requirement.groupId}</small></div>
                  <div className="traceability-chain">
                    <span>Question : {row.question?.id ?? row.requirement.questionId}</span>
                    <span>Données : {row.canonicalPaths.length > 0 ? row.canonicalPaths.join(", ") : "aucun chemin canonique"}</span>
                    <span>Clauses : {row.clauses.length > 0 ? row.clauses.map((clause) => `${clause.clauseId}@v${clause.version}`).join(", ") : "aucune"}</span>
                    <span>Section : {row.requirement.outputSectionId ?? "non renseignée"}</span>
                    <span>Revues : {row.requirement.reviewRoles.length > 0 ? row.requirement.reviewRoles.join(", ") : "aucun rôle spécifique"}</span>
                  </div>
                  {row.question ? (
                    <Link className="traceability-link" href={`/projects/${project.id}/questionnaire?group=${row.question.groupId}`}>
                      Ouvrir la question
                    </Link>
                  ) : null}
                </div>
                <div className="traceability-meta">
                  <Badge tone={row.hasData ? "success" : "warning"}>{row.hasData ? "DONNÉE PRÉSENTE" : "DONNÉE À COMPLÉTER"}</Badge>
                  <Badge tone={registryTone(row.requirement.registryReviewStatus)}>{row.requirement.registryReviewStatus}</Badge>
                  <Badge tone="neutral">Catalogue : {row.requirement.defaultCoverageStatus}</Badge>
                  {row.reviewStatuses.map((status) => (
                    <Badge tone={status === "CONFIRMED" ? "success" : "warning"} key={status}>
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ProjectWorkspaceTemplate>
  );
}
