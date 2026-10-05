"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { FieldShell, Select, Textarea } from "@/components/atoms/Field";
import { StatCard } from "@/components/molecules/StatCard";
import { CLAUSE_CATALOG, getClauseById } from "@/domain/clause-catalog";
import type {
  ClauseProposal,
  ClauseProposalStatus,
} from "@/server/clauses/clause-proposal-repository";

const firstClauseId = CLAUSE_CATALOG[0]?.clauseId ?? "";

type DiffPart = {
  kind: "equal" | "remove" | "add";
  value: string;
};

const lifecycle: Array<{
  status: ClauseProposalStatus | "ACTIVE";
  label: string;
  description: string;
}> = [
  { status: "DRAFT", label: "Draft", description: "Rédaction tenant-scoped." },
  {
    status: "DRAFT_LEGAL_REVIEW_REQUIRED",
    label: "Legal review",
    description: "Revue juridique humaine demandée.",
  },
  { status: "APPROVED", label: "Approved", description: "Approuvée en interne, non active." },
  { status: "ACTIVE", label: "Active", description: "Gate fermé : aucun grant CLAUSE_ACTIVATE." },
];

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
  const previewDiff = useMemo(
    () => buildWordDiff(selectedClause?.wording ?? "", wording),
    [selectedClause?.wording, wording],
  );

  const stats = {
    draft: proposals.filter((proposal) => proposal.status === "DRAFT").length,
    review: proposals.filter(
      (proposal) => proposal.status === "DRAFT_LEGAL_REVIEW_REQUIRED",
    ).length,
    approved: proposals.filter((proposal) => proposal.status === "APPROVED").length,
  };

  return (
    <div className="page-stack">
      <section className="stat-grid">
        <StatCard label="Drafts" value={stats.draft} detail="Tenant-scoped" tone="info" />
        <StatCard label="Legal review" value={stats.review} detail="Revue humaine" tone={stats.review > 0 ? "warning" : "success"} />
        <StatCard label="Approved" value={stats.approved} detail="Approuvées, non actives" tone="success" />
        <StatCard label="Activation" value="LOCKED" detail="CLAUSE_ACTIVATE sans grant" tone="danger" />
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <h1>Clause Studio</h1>
            <p>
              Préparation juridique gouvernée à partir du catalogue immuable. Chaque proposition
              reste tenant-scoped, versionnée en append-only et séparée du catalogue global.
            </p>
          </div>
          <Badge tone="danger">Activation globale interdite</Badge>
        </div>

        <div className="clause-lifecycle" aria-label="Cycle de vie des clauses">
          {lifecycle.map((step, index) => (
            <div
              className={`clause-lifecycle__step${step.status === "ACTIVE" ? " clause-lifecycle__step--locked" : ""}`}
              key={step.status}
            >
              <span className="clause-lifecycle__index">{index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.description}</small>
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <div className="control-alert control-alert--warning" role="alert">
            <strong>Action indisponible</strong>
            <p>{error}</p>
          </div>
        ) : null}

        <div className="clause-studio-grid">
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
              <div className="clause-source-card">
                <div className="clause-source-card__heading">
                  <div>
                    <strong>{selectedClause.clauseId} · v{selectedClause.version}</strong>
                    <small>{selectedClause.sectionId} · {selectedClause.category}</small>
                  </div>
                  <Badge tone={selectedClause.status === "ACTIVE" ? "success" : "info"}>
                    {selectedClause.status}
                  </Badge>
                </div>
                <p>{selectedClause.wording}</p>
                <dl className="detail-list">
                  <div><dt>Exigences</dt><dd>{selectedClause.requirementIds.join(", ") || "aucune"}</dd></div>
                  <div><dt>Champs</dt><dd>{selectedClause.fieldPaths.join(", ") || "aucun"}</dd></div>
                </dl>
              </div>
            ) : null}

            <FieldShell
              id="clause-proposal-wording"
              label="Texte proposé"
              help="Le texte devient immuable dans cette proposition. Une nouvelle rédaction crée une nouvelle proposition/version gouvernée."
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

          <div className="clause-diff-card">
            <div className="clause-diff-card__heading">
              <div>
                <strong>Comparaison avant création</strong>
                <small>Source du catalogue vs texte proposé</small>
              </div>
              <Badge tone={wording.trim() ? "warning" : "neutral"}>
                {wording.trim() ? "PROPOSITION NON VALIDÉE" : "EN ATTENTE"}
              </Badge>
            </div>
            {!wording.trim() ? (
              <p className="clause-diff-card__empty">
                Saisissez un texte proposé pour visualiser les ajouts et suppressions avant de
                créer la proposition.
              </p>
            ) : (
              <div className="clause-diff" aria-label="Diff entre clause source et proposition">
                {previewDiff.map((part, index) =>
                  part.kind === "add" ? (
                    <ins key={`add-${index}`}>{part.value}</ins>
                  ) : part.kind === "remove" ? (
                    <del key={`remove-${index}`}>{part.value}</del>
                  ) : (
                    <span key={`equal-${index}`}>{part.value}</span>
                  ),
                )}
              </div>
            )}
            <div className="control-alert control-alert--warning">
              <div>
                <strong>Gate d’activation fermé</strong>
                <p>
                  Une proposition peut être rédigée, envoyée en revue et approuvée par un second
                  acteur LEGAL. Elle ne peut pas devenir ACTIVE depuis cette surface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>Propositions et historique append-only</h2>
            <p>
              Chaque transition ajoute une version. L’auteur ne peut pas approuver sa propre
              proposition et le catalogue source reste inchangé.
            </p>
          </div>
          <Badge tone="neutral">{proposals.length} proposition(s)</Badge>
        </div>

        {proposals.length === 0 ? (
          <div className="empty-state">
            <h3>Aucune proposition visible</h3>
            <p>
              En mode local-json, PostgreSQL et une identité OIDC réelle sont requis. Aucune
              identité juridique fictive n’est créée pour rendre le Studio artificiellement actif.
            </p>
          </div>
        ) : (
          <div className="clause-proposal-list">
            {proposals.map((proposal) => (
              <ProposalStudioCard
                key={proposal.proposalId}
                proposal={proposal}
                pending={pending}
                transition={transition}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProposalStudioCard({
  proposal,
  pending,
  transition,
}: {
  proposal: ClauseProposal;
  pending: boolean;
  transition: (proposal: ClauseProposal, event: "REQUEST_LEGAL_REVIEW" | "APPROVE") => void;
}) {
  const sourceClause = getClauseById(proposal.sourceClauseId);
  const diff = buildWordDiff(proposal.sourceWording, proposal.wording);

  return (
    <article className="clause-proposal-card">
      <div className="clause-proposal-card__header">
        <div>
          <strong>{proposal.sourceClauseId}</strong>
          <small>Proposition {proposal.proposalId} · v{proposal.currentVersion}</small>
        </div>
        <div className="traceability-meta">
          <Badge tone={statusTone(proposal.status)}>{proposal.status}</Badge>
          <Badge tone="danger">NON ACTIVE</Badge>
        </div>
      </div>

      <div className="clause-compare-grid">
        <div>
          <span className="clause-column-label">Source catalogue</span>
          <p>{proposal.sourceWording}</p>
          <small>
            {sourceClause
              ? `Catalogue ${sourceClause.clauseId}@v${sourceClause.version} · ${sourceClause.status}`
              : "Clause source historique conservée dans la proposition"}
          </small>
        </div>
        <div>
          <span className="clause-column-label">Version proposée</span>
          <p>{proposal.wording}</p>
          <small>Auteur : {proposal.createdBy}</small>
        </div>
      </div>

      <details className="clause-diff-details">
        <summary>Voir le diff source → proposition</summary>
        <div className="clause-diff">
          {diff.map((part, index) =>
            part.kind === "add" ? (
              <ins key={`proposal-add-${index}`}>{part.value}</ins>
            ) : part.kind === "remove" ? (
              <del key={`proposal-remove-${index}`}>{part.value}</del>
            ) : (
              <span key={`proposal-equal-${index}`}>{part.value}</span>
            ),
          )}
        </div>
      </details>

      <ol className="clause-timeline" aria-label="Historique de la proposition">
        {proposal.versions.map((version) => (
          <li key={version.versionId}>
            <span className="clause-timeline__dot" />
            <div>
              <strong>v{version.versionNumber} · {version.status}</strong>
              <small>
                {version.transitionEvent} · acteur {version.actorUserId} · {version.createdAt}
              </small>
              {version.approvedBy ? (
                <small>Approbateur : {version.approvedBy} · {version.approvedAt}</small>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="clause-proposal-card__actions">
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
          <div className="control-alert control-alert--info">
            <div>
              <strong>Approuvée en interne · non active</strong>
              <p>
                Aucun endpoint ni grant CLAUSE_ACTIVATE n’est exposé. L’approbation n’altère pas le
                catalogue global et ne débloque pas la soumission.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function statusTone(status: ClauseProposalStatus): "neutral" | "success" | "warning" | "info" {
  if (status === "APPROVED") return "success";
  if (status === "DRAFT_LEGAL_REVIEW_REQUIRED") return "warning";
  return "info";
}

function buildWordDiff(before: string, after: string): DiffPart[] {
  const left = tokenize(before);
  const right = tokenize(after);
  if (!left.length && !right.length) return [];
  if (left.length * right.length > 45_000) {
    return [
      ...(before ? [{ kind: "remove" as const, value: before }] : []),
      ...(after ? [{ kind: "add" as const, value: after }] : []),
    ];
  }

  const table = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  );
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        left[i] === right[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      pushPart(parts, "equal", left[i]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      pushPart(parts, "remove", left[i]);
      i += 1;
    } else {
      pushPart(parts, "add", right[j]);
      j += 1;
    }
  }
  while (i < left.length) {
    pushPart(parts, "remove", left[i]);
    i += 1;
  }
  while (j < right.length) {
    pushPart(parts, "add", right[j]);
    j += 1;
  }
  return parts;
}

function tokenize(value: string): string[] {
  return value.match(/\s+|[^\s]+/g) ?? [];
}

function pushPart(parts: DiffPart[], kind: DiffPart["kind"], value: string) {
  const last = parts.at(-1);
  if (last?.kind === kind) last.value += value;
  else parts.push({ kind, value });
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
