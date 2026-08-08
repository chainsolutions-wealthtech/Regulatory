import { Badge } from "@/components/atoms/Badge";
import type { GenerationArtifactSummary } from "@/server/storage/generation-artifact-repository";

export function GenerationArtifactsPanel({
  projectId,
  generationId,
  artifacts,
  error,
}: {
  projectId: string;
  generationId: string;
  artifacts: GenerationArtifactSummary[];
  error?: string;
}) {
  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <h2>Livrables persistés</h2>
          <p>
            Artefacts de la dernière génération enregistrée. Les téléchargements sont servis par
            le repository d’artefacts et restent des documents de pré-conformité.
          </p>
        </div>
        <Badge tone={error ? "warning" : "info"}>{artifacts.length} fichier(s)</Badge>
      </div>
      {error ? (
        <div className="empty-state">
          <h3>Artefacts indisponibles</h3>
          <p>{error}</p>
        </div>
      ) : artifacts.length === 0 ? (
        <div className="empty-state">
          <h3>Aucun livrable persisté</h3>
          <p>Générez le prospectus pour enregistrer les artefacts documentaires.</p>
        </div>
      ) : (
        <div className="coverage-table">
          {artifacts.map((artifact) => {
            const href = `/api/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(generationId)}/${encodeURIComponent(artifact.fileName)}`;
            return (
              <div className="coverage-table__row" key={artifact.fileName}>
                <div>
                  <strong>{artifact.fileName}</strong>
                  <div><small>{artifact.mediaType} · {formatBytes(artifact.byteSize)}</small></div>
                  <div><small>SHA-256 : {artifact.sha256}</small></div>
                </div>
                <a className="button button--secondary button--sm" href={href}>
                  Télécharger
                </a>
              </div>
            );
          })}
        </div>
      )}
      <p className="form-help">Génération persistée : {generationId} · ready_for_submission=false</p>
    </section>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} o`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} Ko`;
  return `${(value / (1024 * 1024)).toFixed(1)} Mo`;
}
