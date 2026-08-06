"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { FieldShell, Select, Textarea } from "@/components/atoms/Field";
import type { ProspectusRole } from "@/domain/authorization";
import type { InternalApprovalRole, ReviewWorkspace } from "@/domain/review-types";
import type { ReviewWorkflowTransitionId } from "@/domain/review-workflow";

const REVIEW_ROLES: ProspectusRole[] = [
  "RISK",
  "OPERATIONS",
  "COMPLIANCE",
  "LEGAL",
  "TAX",
  "SECURITY",
];

const INTERNAL_APPROVAL_ROLES: InternalApprovalRole[] = [
  "PRODUCT",
  "RISK",
  "OPERATIONS",
  "COMPLIANCE",
  "LEGAL",
  "TAX",
  "SECURITY",
];

const TRANSITION_BY_STATE: Partial<Record<ReviewWorkspace["currentState"], ReviewWorkflowTransitionId>> = {
  DRAFT: "START_QUESTIONNAIRE",
  QUESTIONNAIRE_IN_PROGRESS: "GENERATE_PRE_COMPLIANCE",
  CHANGES_REQUESTED: "RESUME_AFTER_CHANGES",
  PRE_COMPLIANCE_REVIEW: "REQUEST_RISK_REVIEW",
  RISK_REVIEW: "APPROVE_RISK_REVIEW",
  OPERATIONS_REVIEW: "APPROVE_OPERATIONS_REVIEW",
  COMPLIANCE_REVIEW: "APPROVE_COMPLIANCE_REVIEW",
  LEGAL_REVIEW: "APPROVE_LEGAL_REVIEW",
  TAX_REVIEW: "APPROVE_TAX_REVIEW",
  READY_FOR_INTERNAL_APPROVAL: "FREEZE_INTERNAL_VERSION",
};

export function ReviewWorkspacePanel({
  projectId,
  projectVersion,
}: {
  projectId: string;
  projectVersion: number;
}) {
  const [workspace, setWorkspace] = useState<ReviewWorkspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();
  const [requestRole, setRequestRole] = useState<ProspectusRole>("RISK");
  const [comment, setComment] = useState("");
  const [rationale, setRationale] = useState("");
  const [approvalRole, setApprovalRole] = useState<InternalApprovalRole>("PRODUCT");

  useEffect(() => {
    void refresh();
  }, [projectId]);

  const nextTransition = workspace ? TRANSITION_BY_STATE[workspace.currentState] : undefined;
  const openRequests = useMemo(
    () => workspace?.requests.filter((item) => ["REQUESTED", "IN_PROGRESS", "CHANGES_REQUESTED"].includes(item.status)) ?? [],
    [workspace],
  );

  async function refresh() {
    setError(null);
    const response = await fetch(`/api/projects/${projectId}/reviews`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setWorkspace(null);
      setError(explainError(body.error));
      return;
    }
    setWorkspace(body.workspace);
  }

  async function post(path: string, body: Record<string, unknown>) {
    setError(null);
    const expectedVersion = workspace?.projectVersion ?? projectVersion;
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expectedVersion, ...body }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(explainError(payload.error));
    setWorkspace(payload.workspace);
    return payload.workspace as ReviewWorkspace;
  }

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Action de revue impossible.");
      }
    });
  }

  return (
    <div className="page-stack">
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>Workflow de revue humaine</h2>
            <p>
              Chaque action est contrôlée côté serveur par l’identité OIDC, le tenant, le RBAC et
              la politique de transition.
            </p>
          </div>
          <Badge tone={workspace ? "info" : "warning"}>
            {workspace?.currentState ?? "Identité non configurée"}
          </Badge>
        </div>
        {error ? (
          <div className="control-alert control-alert--warning" role="alert">
            <strong>Action indisponible</strong>
            <p>{error}</p>
          </div>
        ) : null}
        {!workspace ? (
          <div className="empty-state">
            <h3>Mode local de démonstration</h3>
            <p>
              Les revues ne sont pas simulées. Active PostgreSQL et configure un fournisseur OIDC
              vérifié pour utiliser les décisions et transitions.
            </p>
          </div>
        ) : (
          <dl className="detail-list">
            <div><dt>Version examinée</dt><dd>{workspace.projectVersion}</dd></div>
            <div><dt>Demandes ouvertes</dt><dd>{openRequests.length}</dd></div>
            <div><dt>Décisions</dt><dd>{workspace.decisions.length}</dd></div>
            <div><dt>Approbations internes</dt><dd>{workspace.internalApprovalRoles.join(", ") || "Aucune"}</dd></div>
            <div><dt>Prêt pour soumission</dt><dd>Non</dd></div>
          </dl>
        )}
      </section>

      <section className="split-grid">
        <article className="content-section">
          <div className="section-heading"><div><h2>Demander une revue</h2><p>La personne assignée doit posséder le rôle correspondant dans la même organisation.</p></div></div>
          <FieldShell id="review-role" label="Rôle de revue">
            <Select
              id="review-role"
              value={requestRole}
              onChange={(event) => setRequestRole(event.target.value as ProspectusRole)}
            >
              {REVIEW_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </Select>
          </FieldShell>
          <Button
            disabled={loading || !workspace}
            onClick={() => run(() => post(`/api/projects/${projectId}/reviews`, { role: requestRole }))}
          >
            Créer la demande
          </Button>
        </article>

        <article className="content-section">
          <div className="section-heading"><div><h2>Commentaire</h2><p>Les commentaires ne modifient jamais silencieusement les données ou les décisions.</p></div></div>
          <FieldShell id="review-comment" label="Commentaire motivé">
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </FieldShell>
          <Button
            disabled={loading || !workspace || !comment.trim()}
            onClick={() =>
              run(async () => {
                await post(`/api/projects/${projectId}/reviews/comments`, { body: comment });
                setComment("");
              })
            }
          >
            Ajouter le commentaire
          </Button>
        </article>
      </section>

      <section className="content-section">
        <div className="section-heading"><div><h2>Demandes et décisions</h2><p>Le serveur vérifie le rôle spécialisé avant toute décision.</p></div></div>
        <div className="alert-stack">
          {workspace?.requests.length ? workspace.requests.map((request) => {
            const latestDecision = workspace.decisions.filter((decision) => decision.reviewRequestId === request.id).at(-1);
            return (
              <article className="control-alert control-alert--info" key={request.id}>
                <div>
                  <strong>{request.role} — {request.status}</strong>
                  <p>Demandée le {new Date(request.requestedAt).toLocaleString("fr-FR")}</p>
                  {latestDecision ? <p>Dernière décision : {latestDecision.decision} — {latestDecision.rationale}</p> : null}
                </div>
                <div className="button-row">
                  {(["APPROVED", "CHANGES_REQUESTED", "REJECTED"] as const).map((decision) => (
                    <Button
                      key={decision}
                      variant={decision === "APPROVED" ? "primary" : "secondary"}
                      disabled={loading}
                      onClick={() => {
                        const decisionRationale = window.prompt(`Justification obligatoire pour ${decision}`)?.trim();
                        if (!decisionRationale) return;
                        run(() => post(`/api/projects/${projectId}/reviews/${request.id}/decisions`, {
                          decision,
                          rationale: decisionRationale,
                        }));
                      }}
                    >
                      {decision}
                    </Button>
                  ))}
                </div>
              </article>
            );
          }) : <div className="empty-state"><h3>Aucune demande</h3><p>Crée une demande de revue lorsque la génération de pré-conformité est disponible.</p></div>}
        </div>
      </section>

      <section className="split-grid">
        <article className="content-section">
          <div className="section-heading"><div><h2>Approbation interne</h2><p>Cette décision n’est ni un visa ni une approbation du régulateur.</p></div></div>
          <FieldShell id="approval-role" label="Rôle d’approbation">
            <Select
              id="approval-role"
              value={approvalRole}
              onChange={(event) => setApprovalRole(event.target.value as InternalApprovalRole)}
            >
              {INTERNAL_APPROVAL_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </Select>
          </FieldShell>
          <FieldShell id="approval-rationale" label="Justification">
            <Textarea
              id="approval-rationale"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
            />
          </FieldShell>
          <Button
            disabled={loading || !workspace || !rationale.trim()}
            onClick={() => run(async () => {
              await post(`/api/projects/${projectId}/reviews/approvals`, { approvalType: approvalRole, rationale });
              setRationale("");
            })}
          >
            Enregistrer l’approbation interne
          </Button>
        </article>

        <article className="content-section">
          <div className="section-heading"><div><h2>Transition suivante</h2><p>Les conditions et la séparation des tâches sont recalculées côté serveur.</p></div></div>
          <p><strong>{nextTransition ?? "Aucune transition séquentielle proposée"}</strong></p>
          <Button
            disabled={loading || !workspace || !nextTransition}
            onClick={() => run(() => post(`/api/projects/${projectId}/workflow`, {
              transitionId: nextTransition,
              rationale: rationale || undefined,
            }))}
          >
            Exécuter la transition humaine
          </Button>
        </article>
      </section>

      <section className="content-section">
        <div className="section-heading"><div><h2>Historique</h2><p>Transitions et commentaires restent associés à la version examinée.</p></div></div>
        <div className="coverage-table">
          {workspace?.transitions.map((transition) => (
            <div className="coverage-table__row" key={transition.id}>
              <strong>{transition.transitionId}</strong>
              <span>{transition.from} → {transition.to}</span>
            </div>
          ))}
          {workspace?.comments.map((item) => (
            <div className="coverage-table__row" key={item.id}>
              <strong>Commentaire</strong>
              <span>{item.body}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function explainError(value: unknown): string {
  const message = String(value ?? "Erreur inconnue");
  if (message.startsWith("REVIEW_REPOSITORY_UNAVAILABLE")) {
    return "Le workflow humain exige PostgreSQL et un fournisseur OIDC vérifié. Aucune identité locale fictive n’est créée.";
  }
  if (message.startsWith("OIDC_CONFIGURATION_MISSING") || message.startsWith("OIDC_BEARER_TOKEN_REQUIRED")) {
    return "Le fournisseur d’identité OIDC ou le jeton serveur n’est pas configuré.";
  }
  if (message.startsWith("AUTHORIZATION_DENIED")) {
    return "Le rôle courant n’est pas autorisé à exécuter cette action.";
  }
  if (message.startsWith("PROJECT_VERSION_CONFLICT")) {
    return "La version a changé. Recharge la page avant de recommencer.";
  }
  return message;
}
