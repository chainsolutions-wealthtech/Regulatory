import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import {
  rolesForAction,
  separationOfDutiesRules,
  type ProspectusAction,
  type ProspectusRole,
} from "@/domain/authorization";
import {
  REVIEW_CENTER_OPEN_STATUSES,
  REVIEW_CENTER_ROLES,
  reviewRequestMatchesFilters,
  reviewRequestUrgency,
  reviewScopeKeys,
  type ReviewCenterFilters,
} from "@/domain/review-center";
import type { ReviewWorkspace } from "@/domain/review-types";
import { workflowStateLabel } from "@/domain/review-workflow";
import type { ProjectSummary } from "@/domain/types";

export type ReviewCenterEntry = {
  project: ProjectSummary;
  workspace: ReviewWorkspace | null;
  reviewUnavailable: boolean;
};

export function ReviewCenterTemplate({
  entries,
  filters,
  reviewDriver,
  portfolioUnavailable = false,
}: {
  entries: ReviewCenterEntry[];
  filters: ReviewCenterFilters;
  reviewDriver: "local-json" | "postgresql";
  portfolioUnavailable?: boolean;
}) {
  const availableEntries = entries.filter(
    (entry): entry is ReviewCenterEntry & { workspace: ReviewWorkspace } =>
      entry.workspace !== null,
  );
  const allOpenRequests = availableEntries.flatMap((entry) =>
    entry.workspace.requests
      .filter((request) =>
        REVIEW_CENTER_OPEN_STATUSES.includes(
          request.status as (typeof REVIEW_CENTER_OPEN_STATUSES)[number],
        ),
      )
      .map((request) => ({ project: entry.project, request })),
  );
  const filteredRequests = allOpenRequests
    .filter(({ project, request }) =>
      reviewRequestMatchesFilters(project, request, filters),
    )
    .sort((left, right) => {
      const urgency =
        reviewRequestUrgency(left.request).rank -
        reviewRequestUrgency(right.request).rank;
      if (urgency !== 0) return urgency;
      const leftDue = left.request.dueAt ? Date.parse(left.request.dueAt) : Number.POSITIVE_INFINITY;
      const rightDue = right.request.dueAt ? Date.parse(right.request.dueAt) : Number.POSITIVE_INFINITY;
      return leftDue - rightDue || left.project.name.localeCompare(right.project.name, "fr");
    });
  const changesRequested = allOpenRequests.filter(
    ({ request }) => request.status === "CHANGES_REQUESTED",
  ).length;
  const internalApprovals = availableEntries.reduce(
    (total, entry) => total + entry.workspace.internalApprovalRoles.length,
    0,
  );
  const runtimeAvailable =
    reviewDriver === "postgresql" &&
    !portfolioUnavailable &&
    (entries.length === 0 || availableEntries.length > 0);
  const visibleRoles =
    filters.role === "ALL"
      ? REVIEW_CENTER_ROLES
      : REVIEW_CENTER_ROLES.filter((role) => role === filters.role);
  const filteredProjectIds = new Set(filteredRequests.map(({ project }) => project.id));
  const portfolioEntries = entries.filter((entry) => {
    const queryMatches =
      !filters.query ||
      entry.project.name.toLocaleLowerCase("fr-FR").includes(
        filters.query.toLocaleLowerCase("fr-FR"),
      );
    if (!queryMatches) return false;
    if (filters.role !== "ALL" || filters.status !== "OPEN") {
      return filteredProjectIds.has(entry.project.id);
    }
    return true;
  });
  const sodRules = separationOfDutiesRules();

  return (
    <AppShell active="reviews">
      <AppHeader
        title="Centre de revues"
        description="Vue transverse et strictement read-only des files de revue existantes. Les décisions, commentaires et transitions restent exécutés dans chaque projet et contrôlés côté serveur par OIDC, tenant, RBAC et séparation des tâches."
      />

      <div className="page-stack">
        <section className="stat-grid">
          <StatCard
            label="Projets suivis"
            value={entries.length}
            detail="Portefeuille autorisé"
            tone="info"
          />
          <StatCard
            label="Demandes ouvertes"
            value={allOpenRequests.length}
            detail="Files humaines"
            tone={allOpenRequests.length > 0 ? "warning" : "success"}
          />
          <StatCard
            label="Corrections demandées"
            value={changesRequested}
            detail="CHANGES_REQUESTED"
            tone={changesRequested > 0 ? "danger" : "success"}
          />
          <StatCard
            label="Approbations internes"
            value={internalApprovals}
            detail="Jamais un visa"
            tone="info"
          />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Runtime de revues</h2>
              <p>
                Cette surface ne simule aucune identité et ne crée aucune décision. Elle projette
                uniquement les workspaces que le repository de revue autorise à lire.
              </p>
            </div>
            <Badge tone={runtimeAvailable ? "success" : "warning"}>
              {runtimeAvailable ? "PostgreSQL / OIDC" : "Fail-closed"}
            </Badge>
          </div>

          {!runtimeAvailable ? (
            <div className="control-alert control-alert--warning" role="status">
              <div>
                <strong>Runtime de revues indisponible</strong>
                <p>
                  Les files restent vides tant que PostgreSQL et l’identité OIDC vérifiée ne sont
                  pas disponibles. Aucune revue fictive n’est créée pour alimenter ce centre.
                </p>
              </div>
            </div>
          ) : null}

          <div className="review-center-guardrails" aria-label="Garde-fous du centre de revues">
            <Badge tone="info">Lecture transverse uniquement</Badge>
            <Badge tone="danger">Aucune approbation depuis cette surface</Badge>
            <Badge tone="danger">ready_for_submission=false</Badge>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Filtrer les files</h2>
              <p>
                Les filtres ne modifient aucun état de revue. Ils bornent uniquement la projection
                courante des demandes déjà autorisées.
              </p>
            </div>
            <Badge tone="info">{filteredRequests.length} affichée(s)</Badge>
          </div>
          <form action="/reviews" className="review-center-filters" method="get">
            <label>
              <span>Recherche projet ou contexte</span>
              <input
                className="field-control"
                defaultValue={filters.query}
                maxLength={80}
                name="q"
                placeholder="Nom du projet, rôle, assignation…"
                type="search"
              />
            </label>
            <label>
              <span>Rôle</span>
              <select className="field-control" defaultValue={filters.role} name="role">
                <option value="ALL">Tous les rôles</option>
                {REVIEW_CENTER_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Statut</span>
              <select className="field-control" defaultValue={filters.status} name="status">
                <option value="OPEN">Tous les statuts ouverts</option>
                {REVIEW_CENTER_OPEN_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <div className="review-center-filters__actions">
              <button className="button button--primary button--sm" type="submit">Filtrer</button>
              <Link className="button button--secondary button--sm" href="/reviews">Réinitialiser</Link>
            </div>
          </form>
        </section>

        <section className="review-role-grid" aria-label="Files de revue par rôle">
          {visibleRoles.map((role) => {
            const roleRequests = filteredRequests.filter(({ request }) => request.role === role);
            const decisionRoles = decisionRolesFor(role);
            return (
              <article className="content-section review-role-card" key={role}>
                <div className="section-heading">
                  <div>
                    <h2>{role}</h2>
                    <p>
                      Décision autorisée par la politique courante :{" "}
                      {decisionRoles.join(", ") || "aucun rôle actif"}.
                    </p>
                  </div>
                  <Badge tone={roleRequests.length > 0 ? "warning" : "neutral"}>
                    {roleRequests.length} affichée(s)
                  </Badge>
                </div>

                <div className="review-request-list">
                  {roleRequests.length > 0 ? (
                    roleRequests.map(({ project, request }) => {
                      const urgency = reviewRequestUrgency(request);
                      const scopeKeys = reviewScopeKeys(request);
                      return (
                        <article className="review-request-item" key={request.id}>
                          <div className="review-request-item__body">
                            <div className="review-request-item__title">
                              <strong>{project.name}</strong>
                              <Badge tone={urgency.tone}>{urgency.label}</Badge>
                            </div>
                            <small>
                              {request.status}
                              {request.assignedTo ? ` · assignée à ${request.assignedTo}` : ""}
                              {request.dueAt
                                ? ` · échéance ${new Date(request.dueAt).toLocaleDateString("fr-FR")}`
                                : ""}
                            </small>
                            {scopeKeys.length > 0 ? (
                              <small>Contexte : {scopeKeys.join(", ")}</small>
                            ) : null}
                          </div>
                          <nav className="review-request-context" aria-label={`Contexte de ${project.name}`}>
                            <Link href={`/projects/${project.id}`}>Projet</Link>
                            <Link href={`/projects/${project.id}/reviews`}>Revue</Link>
                            <Link href={`/projects/${project.id}/controls`}>Contrôles</Link>
                            <Link href={`/projects/${project.id}/evidence`}>Preuves</Link>
                          </nav>
                        </article>
                      );
                    })
                  ) : (
                    <div className="empty-state review-role-card__empty">
                      <h3>Aucune demande correspondante</h3>
                      <p>Aucune file {role} accessible ne correspond aux filtres courants.</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Séparation des tâches</h2>
              <p>
                Projection directe de la politique RBAC canonique. Ces règles sont informatives
                ici et restent appliquées par le serveur lors de toute mutation.
              </p>
            </div>
            <Badge tone="info">{sodRules.length} règle(s)</Badge>
          </div>
          <div className="review-sod-list">
            {sodRules.map((rule) => (
              <article className="review-sod-item" key={rule.id}>
                <div>
                  <strong>{rule.id}</strong>
                  <p>{rule.description}</p>
                </div>
                <div className="review-center-guardrails">
                  {rule.actions.map((action) => (
                    <Badge key={action} tone={action.startsWith("SUBMISSION_") ? "danger" : "neutral"}>
                      {action}
                    </Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Portefeuille de revue</h2>
              <p>
                État du workflow et files ouvertes, sans mutation transverse ni contournement des
                permissions projet.
              </p>
            </div>
          </div>
          <div className="coverage-table">
            {portfolioEntries.length > 0 ? (
              portfolioEntries.map((entry) => {
                const projectOpenRequests =
                  entry.workspace?.requests.filter((request) =>
                    REVIEW_CENTER_OPEN_STATUSES.includes(
                      request.status as (typeof REVIEW_CENTER_OPEN_STATUSES)[number],
                    ),
                  ).length ?? 0;
                return (
                  <div className="coverage-table__row review-center-project-row" key={entry.project.id}>
                    <div>
                      <strong>{entry.project.name}</strong>
                      <div>
                        <small>
                          {entry.workspace
                            ? workflowStateLabel(entry.workspace.currentState)
                            : "Workspace de revue indisponible"}
                          {" · "}
                          {projectOpenRequests} demande(s) ouverte(s)
                        </small>
                      </div>
                    </div>
                    <div className="review-center-project-actions">
                      <Badge tone={entry.workspace ? "info" : "warning"}>
                        {entry.workspace ? "Lecture autorisée" : "Fail-closed"}
                      </Badge>
                      <Link className="button button--secondary button--sm" href={`/projects/${entry.project.id}`}>
                        Projet
                      </Link>
                      <Link className="button button--secondary button--sm" href={`/projects/${entry.project.id}/reviews`}>
                        Revues
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <h3>
                  {portfolioUnavailable
                    ? "Portefeuille indisponible"
                    : filters.query || filters.role !== "ALL" || filters.status !== "OPEN"
                      ? "Aucun projet correspondant"
                      : "Aucun projet suivi"}
                </h3>
                <p>
                  {portfolioUnavailable
                    ? "L’identité ou le stockage cible ne permet pas de lire le portefeuille. Aucune donnée de démonstration n’est substituée."
                    : "Aucune donnée supplémentaire n’est créée pour satisfaire les filtres."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function decisionRolesFor(role: (typeof REVIEW_CENTER_ROLES)[number]): ProspectusRole[] {
  const action = `REVIEW_DECIDE_${role}` as ProspectusAction;
  try {
    return rolesForAction(action);
  } catch {
    return [];
  }
}
