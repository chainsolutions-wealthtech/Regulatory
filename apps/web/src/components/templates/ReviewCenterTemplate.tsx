import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import {
  rolesForAction,
  type ProspectusAction,
  type ProspectusRole,
} from "@/domain/authorization";
import type { ReviewRequestRecord, ReviewWorkspace } from "@/domain/review-types";
import { workflowStateLabel } from "@/domain/review-workflow";
import type { ProjectSummary } from "@/domain/types";

const REVIEW_ROLES = [
  "RISK",
  "OPERATIONS",
  "COMPLIANCE",
  "LEGAL",
  "TAX",
  "SECURITY",
] as const satisfies readonly ProspectusRole[];

const OPEN_STATUSES = new Set<ReviewRequestRecord["status"]>([
  "REQUESTED",
  "IN_PROGRESS",
  "CHANGES_REQUESTED",
]);

export type ReviewCenterEntry = {
  project: ProjectSummary;
  workspace: ReviewWorkspace | null;
  reviewUnavailable: boolean;
};

export function ReviewCenterTemplate({
  entries,
  reviewDriver,
  portfolioUnavailable = false,
}: {
  entries: ReviewCenterEntry[];
  reviewDriver: "local-json" | "postgresql";
  portfolioUnavailable?: boolean;
}) {
  const availableEntries = entries.filter(
    (entry): entry is ReviewCenterEntry & { workspace: ReviewWorkspace } =>
      entry.workspace !== null,
  );
  const openRequests = availableEntries.flatMap((entry) =>
    entry.workspace.requests
      .filter((request) => OPEN_STATUSES.has(request.status))
      .map((request) => ({ project: entry.project, request })),
  );
  const changesRequested = openRequests.filter(
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
            value={openRequests.length}
            detail="Files humaines"
            tone={openRequests.length > 0 ? "warning" : "success"}
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

        <section className="review-role-grid" aria-label="Files de revue par rôle">
          {REVIEW_ROLES.map((role) => {
            const roleRequests = openRequests.filter(({ request }) => request.role === role);
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
                    {roleRequests.length} ouverte(s)
                  </Badge>
                </div>

                <div className="review-request-list">
                  {roleRequests.length > 0 ? (
                    roleRequests.map(({ project, request }) => (
                      <div className="review-request-item" key={request.id}>
                        <div>
                          <strong>{project.name}</strong>
                          <small>
                            {request.status}
                            {request.assignedTo ? ` · assignée à ${request.assignedTo}` : ""}
                            {request.dueAt
                              ? ` · échéance ${new Date(request.dueAt).toLocaleDateString("fr-FR")}`
                              : ""}
                          </small>
                        </div>
                        <Link
                          className="button button--secondary button--sm"
                          href={`/projects/${project.id}/reviews`}
                        >
                          Ouvrir la revue
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state review-role-card__empty">
                      <h3>Aucune demande ouverte</h3>
                      <p>Aucune file {role} accessible n’exige d’action dans l’état observé.</p>
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
              <h2>Portefeuille de revue</h2>
              <p>
                État du workflow et files ouvertes, sans mutation transverse ni contournement des
                permissions projet.
              </p>
            </div>
          </div>
          <div className="coverage-table">
            {entries.length > 0 ? (
              entries.map((entry) => {
                const projectOpenRequests =
                  entry.workspace?.requests.filter((request) => OPEN_STATUSES.has(request.status))
                    .length ?? 0;
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
                      <Link
                        className="button button--secondary button--sm"
                        href={`/projects/${entry.project.id}/reviews`}
                      >
                        Détail
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <h3>{portfolioUnavailable ? "Portefeuille indisponible" : "Aucun projet suivi"}</h3>
                <p>
                  {portfolioUnavailable
                    ? "L’identité ou le stockage cible ne permet pas de lire le portefeuille. Aucune donnée de démonstration n’est substituée."
                    : "Les files apparaîtront ici lorsqu’un projet autorisé existera."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function decisionRolesFor(role: (typeof REVIEW_ROLES)[number]): ProspectusRole[] {
  const action = `REVIEW_DECIDE_${role}` as ProspectusAction;
  try {
    return rolesForAction(action);
  } catch {
    return [];
  }
}
