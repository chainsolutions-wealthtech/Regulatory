"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { FieldShell, Select, Textarea } from "@/components/atoms/Field";
import { CLAUSE_CATALOG } from "@/domain/clause-catalog";
import type { ClauseProposal } from "@/server/clauses/clause-proposal-repository";

const firstClauseId = CLAUSE_CATALOG[0]?.clauseId ?? "";

export function ClauseProposalAdminPanel() {
  const [proposals, setProposals] = useState<ClauseProposal[]>([]);
  const [sourceClauseId, setSourceClauseId] = useState(firstClauseId);
  const [wording, setWording] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch("/api/regulatory/clause-proposals", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setProposals([]);
      setError(explainError(body.error));
      return;
    }
    setProposals(Array.isArray(body.proposals) ? body.proposals : []);
    setError(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function createProposal() {
    if (!sourceClauseId || !wording.trim()) return;
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch("/api/regulatory/clause-proposals", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sourceClauseId, wording: wording.trim() }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(explainError(body.error));
        setWording("");
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Création impossible.");
      }
    });
  }

  function transition(proposal: ClauseProposal, event: "REQUEST_LEGAL_REVIEW" | "APPROVE") {
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(
          `/api/regulatory/clause-proposals/${encodeURIComponent(proposal.proposalId)}/transitions`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ event, expectedVersion: proposal.currentVersion }),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(explainError(body.error));
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Transition impossible.");
      }
    });
  }

  const selectedClause = CLAUSE_CATALOG.find((clause) => clause.clauseId === sourceClauseId);

  return (
    <div className="page-stack">
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h1>Propositions de clauses</h1>
            <p>
              Espace tenant-scoped de préparation juridique. Une proposition approuvée reste une
              proposition interne : elle ne modifie pas le catalogue global, ne devient jamais
              ACTIVE automatiquement et ne rend pas un dossier prêt pour soumission.
            </p>
          </div>
          <Badge tone="warning">Activation globale interdite</Badge>
        </div>

        {error ? (
          <div className="control-alert control-alert--warning" role="alert">
            <strong>Action indisponible</strong>
            <p>{error}</p>
          </div>
        ) : null}

        <div className="page-stack">
          <FieldShell
            id="clause-proposal-source"
            label="Clause source du catalogue"
            help="La clause source est immuable. La proposition ne remplace jamais silencieusement le catalogue global."
            required
          >
            <Select
              id="clause-proposal-source"
              value={sourceClauseId}
              onChange={(event) => setSourceClauseId(event.target.value)}
              disabled={pending}
            >
              {CLAUSE_CATALOG.map((clause) => (
                <option value={clause.clauseId} key={clause.clauseId}>
                  {clause.clauseId} · {clause.sectionId}
                </option>
              ))}
            </Select>
          </FieldShell>

          {selectedClause ? (
            <div className="control-alert control-alert--info">
              <strong>Texte source · v{selectedClause.version}</strong>
              <p>{selectedClause.wording}</p>
              <small>{selectedClause.status} · {selectedClause.requirementIds.join(", ")}</small>
            </div>
          ) : null}

          <FieldShell
            id="clause-proposal-wording"
            label="Texte proposé"
            help="Le texte devient immuable dans cette proposition. Toute nouvelle rédaction devra créer une nouvelle proposition/version gouvernée."
            required
          >
            <Textarea
              id="clause-proposal-wording"
              value={wording}
              onChange={(event) => setWording(event.target.value)}
              disabled={pending}
            />
          </FieldShell>

          <div className="button-row">
            <Button disabled={pending || !sourceClauseId || !wording.trim()} onClick={createProposal}>
              Créer la proposition juridique
            </Button>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>Historique tenant</h2>
            <p>
              Chaque transition ajoute une version append-only. L’auteur ne peut pas approuver sa
              propre proposition ; un autre acteur LEGAL autorisé doit intervenir.
            </p>
          </div>
          <Badge tone="neutral">{proposals.length} proposition(s)</Badge>
        </div>

        {proposals.length === 0 ? (
          <div className="empty-state">
            <h3>Aucune proposition visible</h3>
            <p>
              En mode local-json, PostgreSQL et une identité OIDC réelle sont requis : aucune
              identité juridique fictive n’est créée.
            </p>
          </div>
        ) : (
          <div className="alert-stack">
            {proposals.map((proposal) => (
              <article className="control-alert control-alert--info" key={proposal.proposalId}>
                <div>
                  <strong>{proposal.sourceClauseId} · version {proposal.currentVersion}</strong>
                  <p>{proposal.wording}</p>
                  <p>
                    Statut : {proposal.status} · auteur {proposal.createdBy}
                    {proposal.approvedBy ? ` · approbateur ${proposal.approvedBy}` : ""}
                  </p>
                  <details>
                    <summary>Voir les {proposal.versions.length} version(s)</summary>
                    <ol>
                      {proposal.versions.map((version) => (
                        <li key={version.versionId}>
                          v{version.versionNumber} · {version.status} · {version.transitionEvent} · acteur {version.actorUserId}
                        </li>
                      ))}
                    </ol>
                  </details>
                </div>
                <div className="button-row">
                  {proposal.status === "DRAFT" ? (
                    <Button
                      disabled={pending}
                      onClick={() => transition(proposal, "REQUEST_LEGAL_REVIEW")}
                    >
                      Demander la revue juridique
                    </Button>
                  ) : null}
                  {proposal.status === "DRAFT_LEGAL_REVIEW_REQUIRED" ? (
                    <Button disabled={pending} onClick={() => transition(proposal, "APPROVE")}>
                      Approuver humainement
                    </Button>
                  ) : null}
                  {proposal.status === "APPROVED" ? (
                    <Badge tone="success">Approuvée · non active</Badge>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function explainError(value: unknown): string {
  const message = String(value ?? "Erreur inconnue");
  if (message.startsWith("CLAUSE_PROPOSAL_REPOSITORY_UNAVAILABLE")) {
    return "Cette administration exige PostgreSQL et une identité OIDC vérifiée. Aucun rôle LEGAL local fictif n’est créé.";
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return "Une identité OIDC vérifiée est requise.";
  }
  if (message.includes("AUTHORIZATION_DENIED:CLAUSE_DRAFT")) {
    return "La création ou la demande de revue exige le droit CLAUSE_DRAFT.";
  }
  if (message.includes("AUTHORIZATION_DENIED:CLAUSE_APPROVE")) {
    return "L’approbation exige le droit CLAUSE_APPROVE.";
  }
  if (message.includes("DENIED_SEPARATION_OF_DUTIES") || message.includes("AUTHOR_CANNOT_APPROVE")) {
    return "L’auteur ne peut pas approuver sa propre proposition. Un second acteur LEGAL est requis.";
  }
  if (message.startsWith("CLAUSE_PROPOSAL_VERSION_CONFLICT")) {
    return "La proposition a changé depuis l’affichage. Rechargez l’état courant avant de décider.";
  }
  return message;
}
