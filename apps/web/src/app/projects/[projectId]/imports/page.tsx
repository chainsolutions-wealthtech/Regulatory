import { notFound } from "next/navigation";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import type { ImportStagingSummary } from "@/server/import/import-staging-query-repository";
import { importStagingQueryRepository } from "@/server/import/queries";
import { projectRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function ProjectImportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await projectRepository.getProject(projectId);
  if (!project) notFound();

  let imports: ImportStagingSummary[] = [];
  let unavailable = false;
  try {
    imports = await importStagingQueryRepository.listProjectImports(projectId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("IMPORT_STAGING_QUERY_UNAVAILABLE")) unavailable = true;
    else throw error;
  }

  return (
    <ProjectWorkspaceTemplate project={project} active="imports">
      <div className="page-stack">
        <section className="content-section">
          <div className="section-heading">
            <div>
              <h1>Imports de prospectus</h1>
              <p>
                Staging de pré-conformité : les extractions restent séparées du modèle canonique et
                doivent être revues humainement avant toute utilisation explicite.
              </p>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Batches visibles</dt>
              <dd>{imports.length}</dd>
            </div>
            <div>
              <dt>Écriture canonique automatique</dt>
              <dd>Interdite</dd>
            </div>
            <div>
              <dt>Soumission</dt>
              <dd>Verrouillée</dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>{unavailable ? "PostgreSQL + OIDC requis" : "PostgreSQL gouverné"}</dd>
            </div>
          </dl>
        </section>

        {unavailable ? (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <h2>Staging indisponible dans ce runtime</h2>
                <p>
                  Le mode local-json ne simule ni identité, ni reviewer, ni RLS. Configurez le driver
                  PostgreSQL et un fournisseur OIDC vérifié pour consulter ou revoir les imports.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <h2>Batches persistés</h2>
                <p>
                  Les compteurs reflètent uniquement les décisions persistées dans le staging et ne
                  modifient aucune réponse du projet.
                </p>
              </div>
            </div>
            <div className="alert-stack">
              {imports.map((item) => (
                <div className="next-action-card" key={item.importId}>
                  <div>
                    <strong>{item.sourceFilename}</strong>
                    <p>
                      Version projet {item.projectVersion} · {item.status} · {item.valueCount} valeur(s)
                    </p>
                    <p>
                      {item.pendingCount} en attente · {item.confirmedCount} confirmée(s) · {item.rejectedCount} rejetée(s)
                    </p>
                    <p>
                      SHA-256 {item.evidenceSha256.slice(0, 16)}… · extracteur {item.extractorId} {item.extractorVersion}
                    </p>
                  </div>
                  <a href={`/api/projects/${project.id}/imports/${item.importId}`}>Batch JSON</a>
                </div>
              ))}
              {imports.length === 0 ? <p>Aucun import persisté pour ce projet.</p> : null}
            </div>
          </section>
        )}
      </div>
    </ProjectWorkspaceTemplate>
  );
}
