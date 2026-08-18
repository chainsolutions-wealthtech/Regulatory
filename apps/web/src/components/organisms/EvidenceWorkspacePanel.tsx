"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";

type EvidenceSummary = {
  objectId: string;
  projectVersion: number;
  originalFilename: string;
  safeFilename: string;
  declaredMediaType?: string;
  detectedMediaType?: string;
  sha256: string;
  byteSize: number;
  state: "QUARANTINED" | "SCANNING" | "CLEAN" | "INFECTED" | "REJECTED" | "DELETION_PENDING" | "DELETED";
  scanStatus: "PENDING" | "CLEAN" | "INFECTED" | "ERROR" | "NOT_SUPPORTED";
  scanProvider?: string;
  scanEngineVersion?: string;
  scanSignatureVersion?: string;
  scanCompletedAt?: string;
  uploadedBy: string;
  releasedBy?: string;
  releasedAt?: string;
  retentionUntil: string;
  legalHold: boolean;
  createdAt: string;
};

export function EvidenceWorkspacePanel({
  projectId,
  projectVersion,
}: {
  projectId: string;
  projectVersion: number;
}) {
  const [evidence, setEvidence] = useState<EvidenceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/evidence`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (response.status === 503) {
      setUnavailable(true);
      setEvidence([]);
      return;
    }
    setUnavailable(false);
    if (!response.ok) {
      setError(explainError(body.error));
      return;
    }
    setEvidence(Array.isArray(body.evidence) ? body.evidence : []);
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Sélectionne un fichier PDF ou DOCX à placer en quarantaine.");
      return;
    }
    startTransition(async () => {
      try {
        setError(null);
        const form = new FormData();
        form.set("file", file);
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/evidence`, {
          method: "POST",
          body: form,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(explainError(body.error));
        if (fileRef.current) fileRef.current.value = "";
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Upload impossible.");
      }
    });
  }

  function release(objectId: string) {
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(`/api/evidence/${encodeURIComponent(objectId)}/release`, { method: "POST" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(explainError(body.error));
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Libération impossible.");
      }
    });
  }

  function extract(item: EvidenceSummary) {
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/imports`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            projectVersion,
            evidenceObjectId: item.objectId,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(explainError(body.error));
        const importId = String(body.batch?.importId ?? "");
        if (!importId) throw new Error("Le batch d’extraction n’a pas retourné d’identifiant.");
        window.location.assign(`/projects/${encodeURIComponent(projectId)}/imports/${encodeURIComponent(importId)}`);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Extraction impossible.");
      }
    });
  }

  return (
    <div className="page-stack">
      <section className="content-section">
        <div className="section-heading">
          <div>
            <h1>Preuves documentaires</h1>
            <p>
              Tout fichier entre en quarantaine. Un scanner serveur de confiance doit produire son
              attestation avant qu’un rôle autorisé puisse le libérer. Aucun verdict antivirus ne peut
              être fourni depuis cette interface.
            </p>
          </div>
          <Badge tone="warning">Soumission verrouillée</Badge>
        </div>

        <dl className="detail-list">
          <div><dt>Version projet courante</dt><dd>{projectVersion}</dd></div>
          <div><dt>Scan automatique depuis le navigateur</dt><dd>Interdit</dd></div>
          <div><dt>Libération sans scan CLEAN</dt><dd>Interdite</dd></div>
          <div><dt>Écriture canonique automatique</dt><dd>Interdite</dd></div>
        </dl>

        {error ? (
          <div className="control-alert control-alert--warning" role="alert">
            <strong>Action indisponible</strong>
            <p>{error}</p>
          </div>
        ) : null}

        {unavailable ? (
          <div className="empty-state">
            <h3>Runtime de preuves indisponible</h3>
            <p>
              Le mode local-json ne simule ni OIDC, ni stockage privé, ni KMS, ni antivirus. La gestion
              réelle des preuves exige PostgreSQL et les dépendances serveur explicitement configurées.
            </p>
          </div>
        ) : (
          <div className="next-action-card">
            <div>
              <strong>Ajouter une preuve</strong>
              <p>PDF ou DOCX, 50 Mo maximum. Le fichier sera uniquement placé en quarantaine.</p>
              <input ref={fileRef} type="file" accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={pending} />
            </div>
            <div className="button-row">
              <Button disabled={pending} onClick={upload}>Placer en quarantaine</Button>
            </div>
          </div>
        )}
      </section>

      {!unavailable ? (
        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Objets de preuve du projet</h2>
              <p>Les métadonnées sont relues sous RLS depuis PostgreSQL ; aucun chemin de stockage privé n’est exposé.</p>
            </div>
            <Badge tone="info">{evidence.length} objet(s)</Badge>
          </div>

          <div className="alert-stack">
            {evidence.map((item) => {
              const historical = item.projectVersion !== projectVersion;
              const releasable = item.state === "QUARANTINED" && item.scanStatus === "CLEAN";
              const extractable = item.state === "CLEAN" && item.scanStatus === "CLEAN" && !historical;
              return (
                <article className="next-action-card" key={item.objectId}>
                  <div>
                    <div className="button-row">
                      <strong>{item.originalFilename}</strong>
                      <Badge tone={statusTone(item)}>{statusLabel(item)}</Badge>
                      {historical ? <Badge tone="neutral">Version {item.projectVersion}</Badge> : null}
                    </div>
                    <p>SHA-256 {item.sha256.slice(0, 20)}… · {formatBytes(item.byteSize)}</p>
                    <p>
                      Scan : {item.scanStatus}
                      {item.scanProvider ? ` · ${item.scanProvider}` : ""}
                      {item.scanEngineVersion ? ` ${item.scanEngineVersion}` : ""}
                    </p>
                    {item.scanStatus === "PENDING" ? (
                      <p>En attente d’un scanner serveur de confiance. Aucune action CLEAN n’est disponible ici.</p>
                    ) : null}
                    {releasable ? (
                      <p>Le scan est CLEAN mais le fichier reste en quarantaine jusqu’à une libération humaine EVIDENCE_VERIFY.</p>
                    ) : null}
                    {historical ? (
                      <p>Cette preuve appartient à une version historique et ne sera pas extraite silencieusement dans la version courante.</p>
                    ) : null}
                  </div>
                  <div className="button-row">
                    <a href={`/api/evidence/${encodeURIComponent(item.objectId)}`}>Métadonnées JSON</a>
                    {releasable ? (
                      <Button disabled={pending} onClick={() => release(item.objectId)}>Libérer après scan CLEAN</Button>
                    ) : null}
                    {extractable ? (
                      <Button disabled={pending} onClick={() => extract(item)}>Extraire vers le staging</Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
            {evidence.length === 0 ? <p>Aucune preuve persistée pour ce projet.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function statusTone(item: EvidenceSummary): "neutral" | "success" | "warning" | "danger" | "info" {
  if (item.state === "CLEAN") return "success";
  if (item.state === "INFECTED" || item.state === "REJECTED") return "danger";
  if (item.scanStatus === "CLEAN") return "info";
  return "warning";
}

function statusLabel(item: EvidenceSummary): string {
  if (item.state === "CLEAN") return "CLEAN · libéré";
  if (item.state === "INFECTED") return "Infecté";
  if (item.state === "REJECTED") return "Rejeté";
  if (item.scanStatus === "CLEAN") return "CLEAN · quarantaine";
  return `${item.state} · ${item.scanStatus}`;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} o`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} Ko`;
  return `${(value / (1024 * 1024)).toFixed(1)} Mo`;
}

function explainError(value: unknown): string {
  const message = String(value ?? "Erreur inconnue");
  if (message.includes("UNAVAILABLE") || message.startsWith("RUNTIME_CONFIGURATION_MISSING")) {
    return "Le runtime gouverné de preuves n’est pas entièrement configuré. Aucun fallback local fictif n’est utilisé.";
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return "Une identité OIDC vérifiée est requise pour cette action.";
  }
  if (message.startsWith("AUTHORIZATION_DENIED:EVIDENCE_VERIFY")) {
    return "La libération d’une preuve exige le droit EVIDENCE_VERIFY.";
  }
  if (message.startsWith("AUTHORIZATION_DENIED:EVIDENCE_WRITE")) {
    return "Le rôle courant n’est pas autorisé à déposer une preuve.";
  }
  if (message.startsWith("EVIDENCE_RELEASE_REQUIRES_CLEAN_SCAN") || message.startsWith("EVIDENCE_CLEAN_SCAN_REQUIRED")) {
    return "La preuve doit disposer d’un scan serveur CLEAN avant toute libération.";
  }
  if (message.startsWith("PROJECT_VERSION_CONFLICT")) {
    return "La version du projet a changé. Recharge l’espace de preuves avant de relancer l’extraction.";
  }
  if (message.startsWith("IMPORT_CLEAN_EVIDENCE_REQUIRED")) {
    return "L’extraction exige une preuve CLEAN préalablement libérée.";
  }
  return message;
}
