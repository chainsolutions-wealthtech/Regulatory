"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import type { ProspectusImportBatch } from "@/domain/prospectus-import";

export function ImportStagingReviewPanel({
  projectId,
  importId,
}: {
  projectId: string;
  importId: string;
}) {
  const [batch, setBatch] = useState<ProspectusImportBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    setBatch(body.batch);
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

  return (
    <div className="page-stack">
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h1>Revue d’un import</h1>
            <p>
              Chaque proposition reste dans le staging. Confirmer une valeur ne l’écrit pas dans le
              modèle canonique et ne rend jamais le dossier prêt pour soumission.
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
              staging réel exige PostgreSQL et une identité serveur vérifiée.
            </p>
          </div>
        ) : (
          <dl className="detail-list">
            <div><dt>Fichier</dt><dd>{batch.sourceFilename}</dd></div>
            <div><dt>Version projet</dt><dd>{batch.projectVersion}</dd></div>
            <div><dt>Extracteur</dt><dd>{batch.extractorId} {batch.extractorVersion}</dd></div>
            <div><dt>SHA-256</dt><dd>{batch.evidenceSha256}</dd></div>
            <div><dt>Écriture canonique</dt><dd>Interdite</dd></div>
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
                La première décision humaine est finale pour une proposition donnée. Une seconde
                décision est refusée par le serveur et PostgreSQL.
              </p>
            </div>
          </div>
          <div className="alert-stack">
            {batch.values.map((value) => (
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
              </article>
            ))}
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
  if (message.startsWith("IMPORT_STAGING_REPOSITORY_UNAVAILABLE")) {
    return "Le staging exige PostgreSQL et un fournisseur OIDC vérifié. Aucune identité locale fictive n’est créée.";
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return "L’identité OIDC vérifiée n’est pas disponible pour cette requête.";
  }
  if (message.startsWith("IMPORT_REVIEW_ROLE_REQUIRED")) {
    return "La décision exige un rôle COMPLIANCE ou LEGAL dans l’organisation courante.";
  }
  if (message.startsWith("IMPORT_VALUE_ALREADY_REVIEWED")) {
    return "Cette proposition a déjà reçu une décision humaine et ne peut pas être rejugée silencieusement.";
  }
  if (message.startsWith("IMPORT_BATCH_NOT_FOUND") || message.startsWith("IMPORT_VALUE_NOT_FOUND")) {
    return "Le batch ou la proposition n’est pas visible dans le tenant courant.";
  }
  return message;
}
