import { Badge } from "@/components/atoms/Badge";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { StatCard } from "@/components/molecules/StatCard";
import { CLAUSE_CATALOG, CLAUSE_CATALOG_METADATA } from "@/domain/clause-catalog";
import {
  CATALOG_METADATA,
  QUESTION_GROUPS,
  REGULATORY_REQUIREMENTS,
} from "@/domain/regulatory-catalog";

function badgeTone(value: string): "neutral" | "success" | "warning" | "danger" | "info" {
  const normalized = value.toUpperCase();
  if (normalized.includes("APPROVED") || normalized.includes("ACTIVE") || normalized.includes("IN_PROSPECTUS")) return "success";
  if (normalized.includes("MISSING") || normalized.includes("BLOCK") || normalized.includes("REJECT")) return "danger";
  if (normalized.includes("PENDING") || normalized.includes("REVIEW") || normalized.includes("DRAFT")) return "warning";
  if (normalized.includes("SYSTEM") || normalized.includes("IMPLEMENT")) return "info";
  return "neutral";
}

export function RegulatoryLibraryTemplate() {
  const pendingReview = REGULATORY_REQUIREMENTS.filter((requirement) =>
    requirement.registryReviewStatus.toUpperCase().includes("PENDING"),
  ).length;
  const covered = REGULATORY_REQUIREMENTS.filter(
    (requirement) => requirement.defaultCoverageStatus === "IN_PROSPECTUS",
  ).length;
  const requirementsByGroup = new Map<string, number>();
  for (const requirement of REGULATORY_REQUIREMENTS) {
    requirementsByGroup.set(requirement.groupId, (requirementsByGroup.get(requirement.groupId) ?? 0) + 1);
  }

  return (
    <AppShell active="library">
      <AppHeader
        title="Bibliothèque réglementaire"
        description="Vue en lecture seule des exigences et clauses réellement consommées par le questionnaire et le compositeur. Les statuts affichés ne valent ni approbation juridique ni activation automatique."
      />
      <div className="page-stack">
        <section className="stat-grid">
          <StatCard label="Exigences" value={CATALOG_METADATA.requirementCount} detail={CATALOG_METADATA.rulePack} tone="info" />
          <StatCard label="Clauses" value={CLAUSE_CATALOG_METADATA.clauseCount} detail={`Catalogue ${CLAUSE_CATALOG_METADATA.clauseCatalogVersion}`} tone="warning" />
          <StatCard label="Questions interactives" value={CATALOG_METADATA.interactiveQuestionCount} detail="Catalogue généré" tone="success" />
          <StatCard label="Revue en attente" value={pendingReview} detail="Validation humaine" tone={pendingReview > 0 ? "warning" : "success"} />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Pack actif</h2>
              <p>Identité et empreinte des catalogues consommés par l’application.</p>
            </div>
            <Badge tone="warning">Pré-conformité</Badge>
          </div>
          <dl className="detail-list">
            <div><dt>Source</dt><dd>{CATALOG_METADATA.sourceId}</dd></div>
            <div><dt>Version du registre</dt><dd>{CATALOG_METADATA.registryVersion}</dd></div>
            <div><dt>Statut du registre</dt><dd>{CATALOG_METADATA.registryStatus}</dd></div>
            <div><dt>Exigences couvertes par défaut</dt><dd>{covered} / {CATALOG_METADATA.requirementCount}</dd></div>
            <div><dt>Digest exigences</dt><dd>{CATALOG_METADATA.catalogDigest}</dd></div>
            <div><dt>Digest clauses</dt><dd>{CLAUSE_CATALOG_METADATA.catalogDigest}</dd></div>
          </dl>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Groupes réglementaires</h2>
              <p>Organisation du questionnaire issue du catalogue, sans duplication des règles dans le frontend.</p>
            </div>
          </div>
          <div className="coverage-table">
            {QUESTION_GROUPS.map((group) => (
              <div className="coverage-table__row" key={group.id}>
                <div>
                  <strong>{group.title}</strong>
                  <div><small>{group.description}</small></div>
                </div>
                <Badge tone="info">{requirementsByGroup.get(group.id) ?? 0} exigence(s)</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Clauses du compositeur</h2>
              <p>Projection déterministe de `src/catalog/clause-catalog.js`. Toutes les clauses restent en revue juridique tant qu’un approbateur humain compétent ne les a pas validées.</p>
            </div>
            <Badge tone="warning">{CLAUSE_CATALOG.length} clause(s)</Badge>
          </div>
          <div className="coverage-table">
            {CLAUSE_CATALOG.map((clause) => (
              <div className="coverage-table__row" key={clause.clauseId}>
                <div>
                  <strong>{clause.clauseId} · v{clause.version}</strong>
                  <div><small>{clause.sectionId} · {clause.category}</small></div>
                  <p>{clause.wording}</p>
                  <div><small>Exigences : {clause.requirementIds.join(", ")}</small></div>
                  <div><small>Champs : {clause.fieldPaths.join(", ")}</small></div>
                </div>
                <Badge tone={badgeTone(clause.status)}>{clause.status}</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Exigences du catalogue</h2>
              <p>Source, couverture, statut de revue et rôles compétents. Cette vue est informative : aucune action d’approbation n’est disponible ici.</p>
            </div>
            <Badge tone="neutral">{REGULATORY_REQUIREMENTS.length} lignes</Badge>
          </div>
          <div className="coverage-table">
            {REGULATORY_REQUIREMENTS.map((requirement) => (
              <div className="coverage-table__row" key={requirement.requirementId}>
                <div>
                  <strong>{requirement.requirementId} — {requirement.label}</strong>
                  <div><small>{requirement.sourceReference} · {requirement.groupId}</small></div>
                  {requirement.reviewRoles.length > 0 ? <div><small>Revue : {requirement.reviewRoles.join(", ")}</small></div> : null}
                </div>
                <div className="project-row__issues">
                  <Badge tone={badgeTone(requirement.defaultCoverageStatus)}>{requirement.defaultCoverageStatus}</Badge>
                  <Badge tone={badgeTone(requirement.registryReviewStatus)}>{requirement.registryReviewStatus}</Badge>
                  <Badge tone={badgeTone(requirement.implementationStatus)}>{requirement.implementationStatus}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
