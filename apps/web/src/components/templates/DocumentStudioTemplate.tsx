import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { GenerationArtifactsPanel } from "@/components/organisms/GenerationArtifactsPanel";
import type { ProspectusProject } from "@/domain/types";
import type { GenerationArtifactSummary } from "@/server/storage/generation-artifact-repository";
import type { ProjectVersionSummary } from "@/server/storage/project-version-repository";

type TraceabilityReference = {
  label: string;
  reference?: string;
};

export function DocumentStudioTemplate({
  project,
  artifacts,
  versions,
  artifactDriver,
  versionDriver,
  artifactsError,
  versionsError,
}: {
  project: ProspectusProject;
  artifacts: GenerationArtifactSummary[];
  versions: ProjectVersionSummary[];
  artifactDriver: "local-json" | "postgresql";
  versionDriver: "local-json" | "postgresql";
  artifactsError?: string;
  versionsError?: string;
}) {
  const generation = project.generation;
  const generationId = generation?.generationId ?? "AUCUNE_GENERATION_PERSISTEE";
  const references = generation ? traceabilityReferences(generation) : [];
  const latest = versions[0];
  const previous = versions[1];

  return (
    <div className="page-stack">
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h1>Document Studio</h1>
            <p>
              Lecture consolidée de la dernière génération persistée, de ses artefacts, de sa
              traçabilité et de l’historique projet. Cette surface ne déclenche aucune génération
              et ne modifie aucun document.
            </p>
          </div>
          <Badge tone="danger">ready_for_submission=false</Badge>
        </div>

        <div className="document-studio-guardrails" aria-label="Garde-fous Document Studio">
          <Badge tone="info">Lecture seule</Badge>
          <Badge tone="warning">Pré-conformité</Badge>
          <Badge tone="danger">Aucune soumission</Badge>
        </div>
      </section>

      {generation ? (
        <section className="document-studio-identity">
          <article className="content-section">
            <div className="section-heading">
              <div>
                <h2>Identité de génération</h2>
                <p>Valeurs issues du snapshot de génération déjà persisté.</p>
              </div>
              <Badge tone={generation.readyForComplianceReview ? "success" : "warning"}>
                {generation.documentStatus}
              </Badge>
            </div>
            <dl className="detail-list">
              <div><dt>Generation ID</dt><dd>{generation.generationId}</dd></div>
              <div><dt>Générée le</dt><dd>{formatDate(generation.generatedAt)}</dd></div>
              <div><dt>Version projet courante</dt><dd>{project.version}</dd></div>
              <div><dt>Catalogue</dt><dd>{generation.catalogDigest ?? project.catalog?.digest ?? "Non renseigné"}</dd></div>
              <div><dt>Exigences</dt><dd>{generation.requirementCount ?? project.catalog?.requirementCount ?? "—"}</dd></div>
              <div><dt>Questions</dt><dd>{generation.questionCount ?? project.catalog?.interactiveQuestionCount ?? "—"}</dd></div>
              <div><dt>Compliance review</dt><dd>{generation.readyForComplianceReview ? "Disponible" : "Non prête"}</dd></div>
              <div><dt>Soumission</dt><dd>Interdite</dd></div>
            </dl>
          </article>

          <article className="content-section">
            <div className="section-heading">
              <div>
                <h2>Points d’entrée documentaires</h2>
                <p>Navigation vers les surfaces existantes, sans nouveau moteur documentaire.</p>
              </div>
            </div>
            <div className="document-studio-links">
              <Link href={`/projects/${project.id}/preview`}>Aperçu courant</Link>
              <Link href={`/projects/${project.id}/concordance`}>Concordance réglementaire</Link>
              <Link href={`/projects/${project.id}/controls`}>Contrôles</Link>
              <Link href={`/projects/${project.id}/versions`}>Historique des versions</Link>
              {latest && previous ? (
                <Link href={`/projects/${project.id}/versions?from=${previous.version}&to=${latest.version}`}>
                  Comparer v{previous.version} → v{latest.version}
                </Link>
              ) : null}
            </div>
          </article>
        </section>
      ) : (
        <section className="content-section">
          <div className="empty-state">
            <h2>Aucune génération persistée</h2>
            <p>
              Le Document Studio reste read-only. Utilisez l’aperçu projet pour examiner le
              document courant et le flux gouverné existant pour créer une génération.
            </p>
            <div className="form-panel__actions">
              <Link className="button button--secondary" href={`/projects/${project.id}/preview`}>
                Ouvrir l’aperçu
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>Traçabilité de génération</h2>
            <p>
              Références enregistrées dans le snapshot de génération. Un lien de téléchargement
              n’est proposé que lorsqu’un artefact correspondant est réellement persisté.
            </p>
          </div>
          <Badge tone={generation ? "info" : "neutral"}>{references.length} référence(s)</Badge>
        </div>
        {references.length > 0 ? (
          <div className="document-traceability-grid">
            {references.map((item) => {
              const fileName = fileNameFromReference(item.reference);
              const artifact = fileName
                ? artifacts.find((candidate) => candidate.fileName === fileName)
                : undefined;
              return (
                <article className="document-traceability-item" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{fileName ?? "Référence non matérialisée"}</small>
                  </div>
                  {artifact && generation ? (
                    <a
                      className="button button--secondary button--sm"
                      href={artifactHref(project.id, generation.generationId, artifact.fileName)}
                    >
                      Ouvrir l’artefact
                    </a>
                  ) : (
                    <Badge tone="neutral">Pas de lien persisté</Badge>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Aucune référence de génération</h3>
            <p>Aucune référence n’est inventée en l’absence d’une génération persistée.</p>
          </div>
        )}
      </section>

      <GenerationArtifactsPanel
        projectId={project.id}
        generationId={generationId}
        artifacts={artifacts}
        error={artifactsError}
      />

      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>Versions et comparaison</h2>
            <p>
              Historique en lecture seule provenant du repository de versions existant. La
              comparaison ne restaure, n’approuve et n’active aucune version.
            </p>
          </div>
          <Badge tone={versionsError ? "warning" : "info"}>{versions.length} version(s)</Badge>
        </div>

        {versionsError ? (
          <div className="control-alert control-alert--warning" role="status">
            <div><strong>Historique indisponible</strong><p>{versionsError}</p></div>
          </div>
        ) : versions.length > 0 ? (
          <div className="coverage-table">
            {versions.slice(0, 6).map((version) => (
              <div className="coverage-table__row document-version-row" key={version.version}>
                <div>
                  <strong>Version {version.version}</strong>
                  <div>
                    <small>
                      {version.answerCount} réponses · {formatDate(version.createdAt)} ·{" "}
                      {version.frozen ? "gelée" : "non gelée"}
                    </small>
                  </div>
                </div>
                <a href={`/api/projects/${project.id}/versions/${version.version}`}>
                  Snapshot JSON
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Aucune version persistée</h3>
            <p>Aucune version historique n’est synthétisée artificiellement.</p>
          </div>
        )}

        <div className="document-studio-runtime">
          <span>Artefacts : {artifactDriver}</span>
          <span>Versions : {versionDriver}</span>
          <span>Soumission : verrouillée</span>
        </div>
      </section>
    </div>
  );
}

function traceabilityReferences(
  generation: NonNullable<ProspectusProject["generation"]>,
): TraceabilityReference[] {
  return [
    { label: "Snapshot canonique", reference: generation.canonicalSnapshotPath },
    { label: "Données canoniques", reference: generation.canonicalDataPath },
    { label: "État questionnaire", reference: generation.questionnaireStatePath },
    { label: "Rapport de contrôles", reference: generation.controlReportPath },
    { label: "Concordance", reference: generation.concordancePath },
    { label: "Modèle documentaire", reference: generation.documentModelPath },
    { label: "Journal des réponses", reference: generation.answerLogPath },
    { label: "Manifeste génération", reference: generation.generationManifestPath },
    { label: "Manifeste DOCX", reference: generation.docxManifestPath },
    { label: "Validation DOCX", reference: generation.docxValidationPath },
    { label: "Manifeste PDF", reference: generation.pdfManifestPath },
    { label: "Package de revue", reference: generation.reviewPackageManifestPath },
  ].filter((item) => Boolean(item.reference));
}

function fileNameFromReference(reference?: string): string | undefined {
  if (!reference) return undefined;
  return reference.split("/").filter(Boolean).at(-1);
}

function artifactHref(projectId: string, generationId: string, fileName: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(generationId)}/${encodeURIComponent(fileName)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
