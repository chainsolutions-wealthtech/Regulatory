import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { RegulatoryKnowledgeNav } from "@/components/organisms/RegulatoryKnowledgeNav";
import {
  REGULATORY_DEPENDENCIES,
  REGULATORY_KNOWLEDGE_METADATA,
  type RegulatoryDependency,
} from "@/domain/regulatory-knowledge";

function DependencyRows({
  dependencies,
  resolved,
}: {
  dependencies: RegulatoryDependency[];
  resolved: boolean;
}) {
  return (
    <div className="coverage-table">
      {dependencies.map((dependency) => (
        <div className="coverage-table__row traceability-row" key={dependency.dependencyId}>
          <div>
            <strong>{dependency.dependencyId} — Article {dependency.articleNumber}</strong>
            <div><small>{dependency.articleTitle} · {dependency.dependencyKind}</small></div>
            <p className="traceability-value">{dependency.sourceWording}</p>
            <div className="traceability-chain">
              <span>Référence documentaire : {dependency.officialReference ?? "non résolue"}</span>
              <span>Source résolue : {dependency.resolvedSourceId ?? "aucune"}</span>
              <span>Origine résolution : {dependency.resolutionOrigin}</span>
              <span>Contexte : {dependency.sourceContextExcerpt}</span>
            </div>
          </div>
          <div className="traceability-meta">
            <Badge tone={resolved ? "info" : "warning"}>{dependency.effectiveReferenceStatus}</Badge>
            <Badge tone="danger">ACTIVATION {dependency.activation}</Badge>
            <Badge tone="warning">LEGAL {dependency.legalReviewStatus}</Badge>
            <Badge tone="warning">COMPLIANCE {dependency.complianceReviewStatus}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DependencyGraphTemplate() {
  const summary = REGULATORY_KNOWLEDGE_METADATA.dependencySummary;
  const unresolved = REGULATORY_DEPENDENCIES.filter(
    (dependency) => dependency.effectiveReferenceStatus === "UNRESOLVED",
  );
  const resolved = REGULATORY_DEPENDENCIES.filter(
    (dependency) => dependency.effectiveReferenceStatus !== "UNRESOLVED",
  );

  return (
    <AppShell active="library">
      <AppHeader
        title="Dependency Graph"
        description="Vue documentaire des dépendances externes de l’Instruction 66. Une résolution documentaire identifie une source candidate confirmée ; elle n’active ni exigence, ni règle, ni sanction."
      />
      <RegulatoryKnowledgeNav active="dependencies" />
      <div className="page-stack">
        <section className="stat-grid">
          <StatCard label="Occurrences" value={summary.dependencyOccurrenceCount} detail="Instruction 66" tone="info" />
          <StatCard label="Résolues documentairement" value={summary.resolvedDocumentaryCount} detail="Pas une activation" tone="info" />
          <StatCard label="Non résolues" value={summary.unresolvedDocumentaryCount} detail="Recherche requise" tone="warning" />
          <StatCard label="Activation" value="FORBIDDEN" detail="Legal + Compliance requis" tone="danger" />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Invariants de gouvernance</h2>
              <p>Ces frontières sont directement issues du registre courant de dépendances.</p>
            </div>
            <Badge tone="danger">FAIL-CLOSED</Badge>
          </div>
          <dl className="detail-list">
            <div><dt>Résolution documentaire = activation</dt><dd>{String(REGULATORY_KNOWLEDGE_METADATA.dependencyBoundary.documentaryResolutionIsRequirementActivation)}</dd></div>
            <div><dt>Résolution automatique autorisée</dt><dd>{String(REGULATORY_KNOWLEDGE_METADATA.dependencyBoundary.automaticDependencyResolutionAllowed)}</dd></div>
            <div><dt>Activation automatique autorisée</dt><dd>{String(REGULATORY_KNOWLEDGE_METADATA.dependencyBoundary.automaticRequirementActivationAllowed)}</dd></div>
            <div><dt>Revue juridique requise</dt><dd>{String(REGULATORY_KNOWLEDGE_METADATA.dependencyBoundary.humanLegalReviewRequired)}</dd></div>
            <div><dt>Revue conformité requise</dt><dd>{String(REGULATORY_KNOWLEDGE_METADATA.dependencyBoundary.humanComplianceReviewRequired)}</dd></div>
            <div><dt>ready_for_submission doit rester false</dt><dd>{String(REGULATORY_KNOWLEDGE_METADATA.dependencyBoundary.readyForSubmissionMustRemainFalse)}</dd></div>
          </dl>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Dépendances non résolues</h2>
              <p>File de recherche prioritaire. Aucune source n’est devinée à partir du libellé.</p>
            </div>
            <Badge tone="warning">{unresolved.length}</Badge>
          </div>
          <DependencyRows dependencies={unresolved} resolved={false} />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Résolutions documentaires</h2>
              <p>Relations documentées mais encore soumises aux revues humaines avant toute activation normative.</p>
            </div>
            <Badge tone="info">{resolved.length}</Badge>
          </div>
          <DependencyRows dependencies={resolved} resolved />
        </section>
      </div>
    </AppShell>
  );
}
