"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { FieldShell, Select } from "@/components/atoms/Field";
import type { ProspectusImportBatch } from "@/domain/prospectus-import";

export type ImportPromotionQuestionTarget = {
  id: string;
  label: string;
};

export function ImportStagingReviewPanel({
  projectId,
  importId,
  projectVersion,
  questionTargets,
}: {
  projectId: string;
  importId: string;
  projectVersion: number;
  questionTargets: ImportPromotionQuestionTarget[];
}) {
  const [batch, setBatch] = useState<ProspectusImportBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [currentProjectVersion, setCurrentProjectVersion] = useState(projectVersion);
  const [promotionTargets, setPromotionTargets] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setError(null);
    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/imports/${encodeURIComponent(importId)}`,
      { cache: "no-store" },
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setBatch(null);
      setError(explainError(body.error));
      return;
    }
    const nextBatch = body.batch as ProspectusImportBatch;
    setBatch(nextBatch);
    const promotedVersions = nextBatch.values.map((value) => value.promotion?.projectVersion ?? 0);
    const highestPromotedVersion = Math.max(0, ...promotedVersions);
    if (highestPromotedVersion > 0) {
      setCurrentProjectVersion((version) => Math.max(version, highestPromotedVersion));
    }
  }, [projectId, importId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function review(importValueId: string, decision: "CONFIRMED_BY_HUMAN" | "REJECTED_BY_HUMAN") {
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/imports/${encodeURIComponent(importId)}/review`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ importValueId, decision }),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(explainError(body.error));
        setBatch(body.batch);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Décision de revue impossible.");
      }
    });
  }

  function promote(importValueId: string) {
    const questionId = promotionTargets[importValueId]?.trim();
    if (!questionId) {
      setError("Choisis explicitement la question cible avant toute promotion.");
      return;
    }
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/imports/${encodeURIComponent(importId)}/promote`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              importValueId,
              questionId,
              expectedVersion: currentProjectVersion,
            }),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(explainError(body.error));
        setCurrentProjectVersion(body.receipt.projectVersion);
        setPromotionTargets((current) => ({ ...current, [importValueId]: "" }));
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Promotion canonique impossible.");
      }
    });
  }

  return (
    <div className="page-stack">
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h1>Revue d’un import</h1>
            <p>
              Chaque proposition reste dans le staging. La confirmation humaine et la promotion
              canonique sont deux actes distincts. Une promotion exige une question cible choisie
              explicitement et ne rend jamais le dossier prêt pour soumission.
            </p>
          </div>
          <Badge tone={batch?.status === "REVIEWED" ? "success" : "warning"}>
            {batch?.status ?? "Staging indisponible"}
          </Badge>
        </div>

        {error ? (
          <div className="control-alert control-alert--warning" role="alert">
            <strong>Action indisponible</strong>
            <p>{error}</p>
          </div>
        ) : null}

        {!batch ? (
          <div className="empty-state">
            <h3>Aucune donnée de staging disponible</h3>
            <p>
              Le mode local-json ne simule ni identité OIDC, ni reviewer, ni contenu d’import. Le
              staging et la promotion réels exigent PostgreSQL et une identité serveur vérifiée.
            </p>
          </div>
        ) : (
          <dl className="detail-list">
            <div><dt>Fichier</dt><dd>{batch.sourceFilename}</dd></div>
            <div><dt>Version source de l’import</dt><dd>{batch.projectVersion}</dd></div>
            <div><dt>Version actuelle du projet</dt><dd>{currentProjectVersion}</dd></div>
            <div><dt>Extracteur</dt><dd>{batch.extractorId} {batch.extractorVersion}</dd></div>
            <div><dt>SHA-256</dt><dd>{batch.evidenceSha256}</dd></div>
            <div><dt>Promotion automatique</dt><dd>Interdite</dd></div>
            <div><dt>Prêt pour soumission</dt><dd>Non</dd></div>
          </dl>
        )}
      </section>

      {batch ? (
        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Propositions extraites</h2>
              <p>
                La première décision humaine est finale. Une valeur confirmée peut ensuite être
                promue une seule fois vers une question explicitement sélectionnée.
              </p>
            </div>
          </div>
          <div className="alert-stack">
            {batch.values.map((value) => {
              const targetId = `promotion-target-${value.importValueId}`;
              return (
                <article className="control-alert control-alert--info" key={value.importValueId}>
                  <div>
                    <strong>{value.proposedCanonicalFieldPath}</strong>
                    <p>Valeur extraite : {formatExtractedValue(value.extractedValue)}</p>
                    <p>
                      Confiance : {value.confidence === undefined ? "non fournie" : `${Math.round(value.confidence * 100)} %`}
                      {value.sourceLocation.page ? ` · page ${value.sourceLocation.page}` : ""}
                    </p>
                    <p>
                      Statut : {value.reviewStatus}
                      {value.reviewedBy ? ` · reviewer ${value.reviewedBy}` : ""}
                      {value.reviewedAt ? ` · ${new Date(value.reviewedAt).toLocaleString("fr-FR")}` : ""}
                    </p>
                    {value.promotion ? (
                      <p>
                        Promue vers <strong>{value.promotion.questionId}</strong> · version {value.promotion.projectVersion}
                        {` · ${new Date(value.promotion.promotedAt).toLocaleString("fr-FR")}`}
                      </p>
                    ) : null}
                  </div>
                  {value.reviewStatus === "EXTRACTED_UNVERIFIED" ? (
                    <div className="button-row">
                      <Button
                        disabled={pending}
                        onClick={() => review(value.importValueId, "CONFIRMED_BY_HUMAN")}
                      >
                        Confirmer humainement
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={pending}
                        onClick={() => review(value.importValueId, "REJECTED_BY_HUMAN")}
                      >
                        Rejeter
                      </Button>
                    </div>
                  ) : null}
                  {value.reviewStatus === "CONFIRMED_BY_HUMAN" && !value.promotion ? (
                    <div>
                      <FieldShell
                        id={targetId}
                        label="Question cible — choix humain obligatoire"
                        help="La proposition de champ de l’extracteur n’est jamais transformée automatiquement en question cible."
                      >
                        <Select
                          id={targetId}
                          value={promotionTargets[value.importValueId] ?? ""}
                          onChange={(event) =>
                            setPromotionTargets((current) => ({
                              ...current,
                              [value.importValueId]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Sélectionner explicitement une question</option>
                          {questionTargets.map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.label} — {target.id}
                            </option>
                          ))}
                        </Select>
                      </FieldShell>
                      <Button
                        disabled={pending || !(promotionTargets[value.importValueId] ?? "").trim()}
                        onClick={() => promote(value.importValueId)}
                      >
                        Promouvoir vers la réponse sélectionnée
                      </Button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function formatExtractedValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function explainError(value: unknown): string {
  const message = String(value ?? "Erreur inconnue");
  if (
    message.startsWith("IMPORT_STAGING_REPOSITORY_UNAVAILABLE") ||
    message.startsWith("IMPORT_PROMOTION_REPOSITORY_UNAVAILABLE")
  ) {
    return "Le staging et la promotion exigent PostgreSQL et un fournisseur OIDC vérifié. Aucune identité locale fictive n’est créée.";
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return "L’identité OIDC vérifiée n’est pas disponible pour cette requête.";
  }
  if (message.startsWith("IMPORT_REVIEW_ROLE_REQUIRED")) {
    return "La décision exige un rôle COMPLIANCE ou LEGAL dans l’organisation courante.";
  }
  if (message.startsWith("AUTHORIZATION_DENIED:ANSWER_WRITE")) {
    return "Le rôle courant n’est pas autorisé à promouvoir une valeur vers une réponse projet.";
  }
  if (message.startsWith("PROJECT_VERSION_CONFLICT")) {
    return "La version du projet a changé. Recharge la page avant de recommencer la promotion.";
  }
  if (message.startsWith("IMPORT_VALUE_ALREADY_PROMOTED")) {
    return "Cette proposition a déjà été promue et ne peut pas créer une nouvelle version silencieusement.";
  }
  if (message.startsWith("IMPORT_VALUE_NOT_HUMAN_CONFIRMED")) {
    return "Seule une proposition préalablement confirmée par un humain peut être promue.";
  }
  if (message.startsWith("IMPORT_VALUE_ALREADY_REVIEWED")) {
    return "Cette proposition a déjà reçu une décision humaine et ne peut pas être rejugée silencieusement.";
  }
  if (message.startsWith("IMPORT_BATCH_NOT_FOUND") || message.startsWith("IMPORT_VALUE_NOT_FOUND")) {
    return "Le batch ou la proposition n’est pas visible dans le tenant courant.";
  }
  return message;
}
