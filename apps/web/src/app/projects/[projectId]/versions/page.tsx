import { notFound } from "next/navigation";
import { ProjectWorkspaceTemplate } from "@/components/templates/ProjectWorkspaceTemplate";
import { buildProjectVersionDiff } from "@/server/project-version-diff";
import { projectRepository, projectVersionRepository } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function ProjectVersionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const project = await projectRepository.getProject(projectId);
  if (!project) notFound();

  const versions = await projectVersionRepository.listProjectVersions(projectId);
  const defaultTo = versions[0]?.version;
  const defaultFrom = versions[1]?.version ?? defaultTo;
  const fromVersion = parseAvailableVersion(query.from, versions.map((item) => item.version)) ?? defaultFrom;
  const toVersion = parseAvailableVersion(query.to, versions.map((item) => item.version)) ?? defaultTo;

  const [fromProject, toProject] =
    fromVersion && toVersion
      ? await Promise.all([
          projectVersionRepository.getProjectVersion(projectId, fromVersion),
          projectVersionRepository.getProjectVersion(projectId, toVersion),
        ])
      : [null, null];
  const diff = fromProject && toProject ? buildProjectVersionDiff(fromProject, toProject) : null;

  return (
    <ProjectWorkspaceTemplate project={project} active="versions">
      <div className="page-stack">
        <section className="content-section">
          <div className="section-heading">
            <div>
              <h1>Historique des versions</h1>
              <p>
                Consultation strictement en lecture seule. Une version historique ne peut être ni
                restaurée, ni approuvée, ni activée depuis cet écran.
              </p>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Version courante</dt>
              <dd>{project.version}</dd>
            </div>
            <div>
              <dt>Versions conservées</dt>
              <dd>{versions.length}</dd>
            </div>
            <div>
              <dt>Stockage</dt>
              <dd>{projectVersionRepository.driver}</dd>
            </div>
            <div>
              <dt>Soumission</dt>
              <dd>Verrouillée</dd>
            </div>
          </dl>
        </section>

        <section className="split-grid">
          <article className="content-section">
            <div className="section-heading">
              <div>
                <h2>Versions disponibles</h2>
                <p>Les snapshots sont ordonnés de la version la plus récente à la plus ancienne.</p>
              </div>
            </div>
            <div className="alert-stack">
              {versions.map((version) => (
                <div className="next-action-card" key={version.version}>
                  <div>
                    <strong>Version {version.version}</strong>
                    <p>
                      {version.answerCount} réponses · {formatDate(version.createdAt)} · {version.frozen ? "gelée" : "modifiable à sa création"}
                    </p>
                  </div>
                  <a href={`/api/projects/${project.id}/versions/${version.version}`}>Snapshot JSON</a>
                </div>
              ))}
              {versions.length === 0 ? <p>Aucune version historique persistée.</p> : null}
            </div>
          </article>

          <article className="content-section">
            <div className="section-heading">
              <div>
                <h2>Comparer deux versions</h2>
                <p>Le diff porte uniquement sur les réponses persistées et ne produit aucune écriture.</p>
              </div>
            </div>
            <form method="get" className="page-stack">
              <label>
                Version source
                <select name="from" defaultValue={String(fromVersion ?? "")}>
                  {versions.map((version) => (
                    <option key={version.version} value={version.version}>
                      Version {version.version}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Version cible
                <select name="to" defaultValue={String(toVersion ?? "")}>
                  {versions.map((version) => (
                    <option key={version.version} value={version.version}>
                      Version {version.version}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Comparer</button>
            </form>

            {diff ? (
              <dl className="detail-list">
                <div>
                  <dt>Réponses modifiées</dt>
                  <dd>{diff.changedAnswerCount}</dd>
                </div>
                <div>
                  <dt>Réponses ajoutées</dt>
                  <dd>{diff.addedAnswerCount}</dd>
                </div>
                <div>
                  <dt>Réponses supprimées</dt>
                  <dd>{diff.removedAnswerCount}</dd>
                </div>
                <div>
                  <dt>Soumission</dt>
                  <dd>False</dd>
                </div>
              </dl>
            ) : null}

            {diff && (diff.changedAnswerIds.length || diff.addedAnswerIds.length || diff.removedAnswerIds.length) ? (
              <div className="alert-stack">
                {diff.changedAnswerIds.length ? <p><strong>Modifiées :</strong> {diff.changedAnswerIds.join(", ")}</p> : null}
                {diff.addedAnswerIds.length ? <p><strong>Ajoutées :</strong> {diff.addedAnswerIds.join(", ")}</p> : null}
                {diff.removedAnswerIds.length ? <p><strong>Supprimées :</strong> {diff.removedAnswerIds.join(", ")}</p> : null}
              </div>
            ) : null}
          </article>
        </section>
      </div>
    </ProjectWorkspaceTemplate>
  );
}

function parseAvailableVersion(value: string | undefined, available: number[]): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && available.includes(parsed) ? parsed : null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
