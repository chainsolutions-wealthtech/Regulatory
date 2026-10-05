import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { RegulatoryKnowledgeNav } from "@/components/organisms/RegulatoryKnowledgeNav";
import {
  MATERIALIZED_REGULATORY_SOURCES,
  REGULATORY_KNOWLEDGE_METADATA,
  REGULATORY_REGISTRY_SOURCES,
  type RegulatorySourceType,
} from "@/domain/regulatory-knowledge";

function sourceTone(source: { portalAbrogated: boolean | null; portalValid: boolean | null }): "neutral" | "success" | "warning" | "danger" | "info" {
  if (source.portalAbrogated === true) return "danger";
  if (source.portalValid === true) return "success";
  return "info";
}

function typeLabel(type: RegulatorySourceType): string {
  if (type === "INSTRUCTION") return "Instructions";
  if (type === "CIRCULAR") return "Circulaires";
  return "Décisions";
}

export function SourceExplorerTemplate() {
  const groups: RegulatorySourceType[] = ["INSTRUCTION", "CIRCULAR", "DECISION"];

  return (
    <AppShell active="library">
      <AppHeader
        title="Source Explorer"
        description="Projection en lecture seule des registres institutionnels versionnés et des sources matérialisées. Présence dans un registre, matérialisation et validation juridique restent trois statuts distincts."
      />
      <RegulatoryKnowledgeNav active="sources" />
      <div className="page-stack">
        <section className="stat-grid">
          <StatCard label="Instructions observées" value={REGULATORY_KNOWLEDGE_METADATA.sourceCounts.instructions} detail="Registre API versionné" tone="info" />
          <StatCard label="Circulaires observées" value={REGULATORY_KNOWLEDGE_METADATA.sourceCounts.circulars} detail="Registre API versionné" tone="info" />
          <StatCard label="Décisions observées" value={REGULATORY_KNOWLEDGE_METADATA.sourceCounts.decisions} detail="Registre API versionné" tone="info" />
          <StatCard label="Sources matérialisées" value={REGULATORY_KNOWLEDGE_METADATA.sourceCounts.materialized} detail="Copies hashées du dépôt" tone="warning" />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Frontière de preuve</h2>
              <p>Le catalogue affiche ce qui a été observé et versionné. Il ne transforme jamais un document disponible en texte juridiquement validé.</p>
            </div>
            <Badge tone="warning">READ_ONLY</Badge>
          </div>
          <dl className="detail-list">
            <div><dt>Digest catalogue</dt><dd className="traceability-path">{REGULATORY_KNOWLEDGE_METADATA.catalogDigest}</dd></div>
            <div><dt>Total registre</dt><dd>{REGULATORY_KNOWLEDGE_METADATA.sourceCounts.total}</dd></div>
            <div><dt>Activation automatique</dt><dd>FORBIDDEN</dd></div>
            <div><dt>Soumission</dt><dd>ready_for_submission=false</dd></div>
          </dl>
        </section>

        {groups.map((type) => {
          const sources = REGULATORY_REGISTRY_SOURCES.filter((source) => source.type === type);
          return (
            <section className="content-section" key={type}>
              <div className="section-heading">
                <div>
                  <h2>{typeLabel(type)}</h2>
                  <p>Entrées issues du snapshot institutionnel versionné dans le dépôt.</p>
                </div>
                <Badge tone="info">{sources.length}</Badge>
              </div>
              <div className="coverage-table">
                {sources.map((source) => (
                  <div className="coverage-table__row traceability-row" key={source.sourceKey}>
                    <div>
                      <strong>{source.reference}</strong>
                      <div><small>{source.title}</small></div>
                      {source.summary ? <p className="traceability-value">{source.summary}</p> : null}
                      <div className="traceability-chain">
                        <span>API ID : {source.actualiteId}</span>
                        <span>Date portail : {source.portalDate ?? "non exposée dans ce registre"}</span>
                        <span>Document déclaré : {source.documentUrl ?? "non exposé"}</span>
                        <span>Raw SHA-256 : {source.rawSha256 ?? "non exposé"}</span>
                      </div>
                    </div>
                    <div className="traceability-meta">
                      <Badge tone={sourceTone(source)}>{source.portalAbrogated ? "ABROGÉ PORTAIL" : source.portalValid ? "VALIDE PORTAIL" : "STATUT PORTAIL N/A"}</Badge>
                      <Badge tone={source.documentPresent ? "success" : "neutral"}>{source.documentPresent ? "BINAIRE OBSERVÉ" : "BINAIRE NON EMBARQUÉ"}</Badge>
                      {source.sanctionsSubjectMatch ? <Badge tone="warning">SUJET SANCTIONS</Badge> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Sources matérialisées</h2>
              <p>Copies documentaires accompagnées de métadonnées d’intégrité. Leur revue juridique reste indépendante.</p>
            </div>
            <Badge tone="warning">{MATERIALIZED_REGULATORY_SOURCES.length}</Badge>
          </div>
          <div className="coverage-table">
            {MATERIALIZED_REGULATORY_SOURCES.map((source) => (
              <div className="coverage-table__row traceability-row" key={source.sourceId}>
                <div>
                  <strong>{source.sourceId}</strong>
                  <div><small>{source.title}</small></div>
                  <div className="traceability-chain">
                    <span>Copie : {source.repositoryCopy ?? "non renseignée"}</span>
                    <span>SHA-256 : {source.sha256 ?? "non renseigné"}</span>
                    <span>Pages : {source.pageCount ?? "non renseigné"} · Taille : {source.byteSize ?? "non renseignée"}</span>
                    <span>Extraction : {source.extractionStatus ?? "non renseignée"}</span>
                  </div>
                </div>
                <div className="traceability-meta">
                  <Badge tone="success">MATÉRIALISÉ</Badge>
                  <Badge tone="warning">{source.legalReviewStatus ?? "LEGAL_REVIEW_NOT_RECORDED"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
