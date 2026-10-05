import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { getQuestionById } from "@/domain/regulatory-catalog";
import type { CanonicalSnapshot, ProspectusProject } from "@/domain/types";

function reviewTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "CONFIRMED" || status === "VERIFIED") return "success";
  if (status.includes("REJECT")) return "danger";
  if (status.includes("REVIEW") || status === "UNREVIEWED") return "warning";
  return "neutral";
}

function valuePreview(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const serialized = JSON.stringify(value);
  if (!serialized) return "—";
  return serialized.length > 220 ? `${serialized.slice(0, 217)}…` : serialized;
}

export function CanonicalDataTemplate({
  project,
  snapshot,
}: {
  project: ProspectusProject;
  snapshot: CanonicalSnapshot;
}) {
  const rows = snapshot.answerRecords
    .flatMap((record) => {
      const question = getQuestionById(record.questionId);
      return record.canonicalFieldPaths.map((fieldPath) => ({
        fieldPath,
        record,
        question,
      }));
    })
    .toSorted((left, right) => left.fieldPath.localeCompare(right.fieldPath));

  const uniquePaths = new Set(rows.map((row) => row.fieldPath)).size;
  const pending = snapshot.answerRecords.filter(
    (record) => record.reviewStatus !== "CONFIRMED",
  ).length;

  return (
    <ProjectWorkspaceTemplate project={project} active="canonical-data">
      <div className="page-stack">
        <div className="page-title-row">
          <div>
            <h1>Données canoniques</h1>
            <p>
              Projection en lecture seule du même snapshot canonique consommé par le compositeur.
              Aucune donnée n’est modifiée depuis cette vue.
            </p>
          </div>
          <Link className="button button--secondary" href={`/projects/${project.id}/concordance`}>
            Voir la concordance
          </Link>
        </div>

        <section className="stat-grid">
          <StatCard label="Champs canoniques" value={uniquePaths} detail="Chemins uniques projetés" tone="info" />
          <StatCard label="Réponses tracées" value={snapshot.answerRecords.length} detail="Answer records" tone="success" />
          <StatCard label="À confirmer" value={pending} detail="Revue humaine" tone={pending > 0 ? "warning" : "success"} />
          <StatCard label="Legacy non mappé" value={snapshot.legacyUnmappedAnswers.length} detail="Conservé sans suppression" tone={snapshot.legacyUnmappedAnswers.length > 0 ? "warning" : "success"} />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Contrat du snapshot</h2>
              <p>Identité du snapshot utilisé par le moteur documentaire.</p>
            </div>
            <Badge tone="danger">ready_for_submission=false</Badge>
          </div>
          <dl className="detail-list">
            <div><dt>Schema</dt><dd>{snapshot.schemaVersion}</dd></div>
            <div><dt>Projet / version</dt><dd>{snapshot.projectId} / {snapshot.projectVersion}</dd></div>
            <div><dt>Rule pack</dt><dd>{snapshot.rulePack}</dd></div>
            <div><dt>Digest catalogue</dt><dd className="traceability-path">{snapshot.catalogDigest}</dd></div>
            <div><dt>Exigences catalogue</dt><dd>{snapshot.requirementCount}</dd></div>
          </dl>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Provenance champ par champ</h2>
              <p>Question, source, revue et exigences restent reliées à chaque chemin canonique.</p>
            </div>
            <Badge tone="info">{rows.length} liaison(s)</Badge>
          </div>
          <div className="coverage-table">
            {rows.map((row, index) => (
              <div className="coverage-table__row traceability-row" key={`${row.record.questionId}:${row.fieldPath}:${index}`}>
                <div>
                  <strong><code className="traceability-path">{row.fieldPath}</code></strong>
                  <div><small>{row.question?.label ?? row.record.questionId}</small></div>
                  <div><small>{row.record.sourceReference ?? "Source applicative"}</small></div>
                  <p className="traceability-value">{valuePreview(row.record.value)}</p>
                  {row.question ? (
                    <Link className="traceability-link" href={`/projects/${project.id}/questionnaire?group=${row.question.groupId}`}>
                      Ouvrir le groupe du questionnaire
                    </Link>
                  ) : null}
                </div>
                <div className="traceability-meta">
                  <Badge tone="info">{row.record.source}</Badge>
                  <Badge tone={reviewTone(row.record.reviewStatus)}>{row.record.reviewStatus}</Badge>
                  <Badge tone="neutral">{row.record.requirementIds.length} exigence(s)</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>

        {snapshot.legacyUnmappedAnswers.length > 0 ? (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <h2>Réponses historiques non mappées</h2>
                <p>Elles sont conservées explicitement et ne sont pas supprimées silencieusement.</p>
              </div>
              <Badge tone="warning">{snapshot.legacyUnmappedAnswers.length}</Badge>
            </div>
            <div className="coverage-table">
              {snapshot.legacyUnmappedAnswers.map((questionId) => (
                <div className="coverage-table__row" key={questionId}>
                  <code className="traceability-path">{questionId}</code>
                  <Badge tone="warning">REVIEW_REQUIRED</Badge>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </ProjectWorkspaceTemplate>
  );
}
