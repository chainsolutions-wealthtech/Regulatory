import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { RegulatoryKnowledgeNav } from "@/components/organisms/RegulatoryKnowledgeNav";
import {
  INST066_REQUIREMENT_CANDIDATES,
  REGULATORY_KNOWLEDGE_METADATA,
} from "@/domain/regulatory-knowledge";
import {
  CATALOG_METADATA,
  REGULATORY_REQUIREMENTS,
} from "@/domain/regulatory-catalog";

function tone(value: string): "neutral" | "success" | "warning" | "danger" | "info" {
  const normalized = value.toUpperCase();
  if (normalized.includes("VALIDATED") || normalized.includes("IMPLEMENTED")) return "success";
  if (normalized.includes("FORBIDDEN") || normalized.includes("REJECT")) return "danger";
  if (normalized.includes("PENDING") || normalized.includes("UNVERIFIED") || normalized.includes("REVIEW")) return "warning";
  return "info";
}

export function RequirementExplorerTemplate() {
  return (
    <AppShell active="library">
      <AppHeader
        title="Requirement Explorer"
        description="Séparation explicite entre les 62 exigences CIRC005 consommées par l’application et les 111 candidats INST066 encore inactifs, extraits et soumis à double revue humaine."
      />
      <RegulatoryKnowledgeNav active="requirements" />
      <div className="page-stack">
        <section className="stat-grid">
          <StatCard label="CIRC005 applicatif" value={CATALOG_METADATA.requirementCount} detail={CATALOG_METADATA.rulePack} tone="success" />
          <StatCard label="INST066 candidats" value={REGULATORY_KNOWLEDGE_METADATA.inst066.requirementCandidateCount} detail="Non activés" tone="warning" />
          <StatCard label="Legal review INST066" value="PENDING" detail="Revue humaine obligatoire" tone="warning" />
          <StatCard label="Activation INST066" value="FORBIDDEN" detail="Fail-closed" tone="danger" />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Exigences CIRC005 consommées</h2>
              <p>Catalogue web actif du moteur. Les statuts de revue restent visibles et ne sont jamais remplacés par une supposition.</p>
            </div>
            <Badge tone="success">{REGULATORY_REQUIREMENTS.length}</Badge>
          </div>
          <div className="coverage-table">
            {REGULATORY_REQUIREMENTS.map((requirement) => (
              <div className="coverage-table__row traceability-row" key={requirement.requirementId}>
                <div>
                  <strong>{requirement.requirementId} — {requirement.label}</strong>
                  <div><small>{requirement.sourceReference}</small></div>
                  <div className="traceability-chain">
                    <span>Question : {requirement.questionId}</span>
                    <span>Champs : {requirement.canonicalFieldPaths.join(", ")}</span>
                    <span>Contrôles : {requirement.controls.length > 0 ? requirement.controls.join(", ") : "aucun"}</span>
                    <span>Section : {requirement.outputSectionId ?? "non renseignée"}</span>
                    <span>Revues : {requirement.reviewRoles.join(", ")}</span>
                  </div>
                </div>
                <div className="traceability-meta">
                  <Badge tone={tone(requirement.implementationStatus)}>{requirement.implementationStatus}</Badge>
                  <Badge tone={tone(requirement.registryReviewStatus)}>{requirement.registryReviewStatus}</Badge>
                  <Badge tone="neutral">{requirement.defaultCoverageStatus}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Candidats Instruction 66</h2>
              <p>{REGULATORY_KNOWLEDGE_METADATA.inst066.caveat}</p>
            </div>
            <Badge tone="danger">ACTIVATION FORBIDDEN</Badge>
          </div>
          <div className="coverage-table">
            {INST066_REQUIREMENT_CANDIDATES.map((requirement) => (
              <div className="coverage-table__row traceability-row" key={requirement.id}>
                <div>
                  <strong>{requirement.id} — Article {requirement.articleNumber}</strong>
                  <p className="traceability-value">{requirement.normalizedRequirementCandidate}</p>
                  <div className="traceability-chain">
                    <span>Pages source : {requirement.sourcePages.join(", ")}</span>
                    <span>Applicabilité candidate : {requirement.applicabilityCandidate}</span>
                    <span>Champs candidats : {requirement.canonicalFields.join(", ") || "aucun"}</span>
                    <span>Questions candidates : {requirement.questionIds.join(", ") || "aucune"}</span>
                    <span>Contrôles candidats : {requirement.controlIds.join(", ") || "aucun"}</span>
                    <span>Crosswalk CIRC005 : {requirement.circ005RequirementLinks.join(", ") || "aucun"}</span>
                  </div>
                </div>
                <div className="traceability-meta">
                  <Badge tone="danger">{requirement.activation}</Badge>
                  <Badge tone="warning">LEGAL {requirement.legalReviewStatus}</Badge>
                  <Badge tone="warning">COMPLIANCE {requirement.complianceReviewStatus}</Badge>
                  <Badge tone={tone(requirement.status)}>{requirement.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
