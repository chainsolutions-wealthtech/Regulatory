import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { CATALOG_METADATA, REGULATORY_REQUIREMENTS } from "@/domain/regulatory-catalog";
import { CLAUSE_CATALOG_METADATA } from "@/domain/clause-catalog";
import type { ProjectSummary } from "@/domain/types";
import type { RuntimeDependencyState, RuntimeReadiness } from "@/server/observability/runtime-health";

function projectStatusLabel(status: ProjectSummary["status"]): string {
  const labels: Record<ProjectSummary["status"], string> = {
    DRAFT: "Brouillon",
    QUESTIONNAIRE_IN_PROGRESS: "Questionnaire",
    PRE_COMPLIANCE_REVIEW: "Pré-conformité",
    COMPLIANCE_REVIEW: "Revue conformité",
    LEGAL_REVIEW: "Revue juridique",
    READY_FOR_INTERNAL_APPROVAL: "Approbation interne",
  };
  return labels[status];
}

function priorityTone(project: ProjectSummary): "danger" | "warning" | "success" {
  if (project.blockers > 0) return "danger";
  if (project.warnings > 0) return "warning";
  return "success";
}

const dependencyNames = {
  postgresql: "PostgreSQL",
  oidc: "Identité OIDC",
  evidence: "Stockage des preuves",
  scanner: "Service de scan",
} as const;

const dependencyKeys = ["postgresql", "oidc", "evidence", "scanner"] as const;

function readinessTone(value: RuntimeDependencyState): "success" | "warning" | "danger" {
  if (value === "READY") return "success";
  if (value === "CONFIGURED" || value === "DEVELOPMENT_ONLY") return "warning";
  return "danger";
}

export function OperationsCockpitTemplate({ projects, readiness }: { projects: ProjectSummary[]; readiness: RuntimeReadiness }) {
  const blockers = projects.reduce((sum, project) => sum + project.blockers, 0);
  const warnings = projects.reduce((sum, project) => sum + project.warnings, 0);
  const reviewPending = REGULATORY_REQUIREMENTS.filter((requirement) =>
    requirement.registryReviewStatus.toUpperCase().includes("PENDING"),
  ).length;
  const priorityProjects = [...projects]
    .sort((a, b) => b.blockers - a.blockers || b.warnings - a.warnings || a.progress - b.progress)
    .slice(0, 8);

  const frontendDomains = [
    { label: "Portefeuille et projets", state: "Implémenté", tone: "success" as const, detail: "Dashboard, création, versions et navigation projet." },
    { label: "Questionnaire réglementaire", state: "Implémenté", tone: "success" as const, detail: "Catalogue exécutable, logique conditionnelle et collections canoniques." },
    { label: "Contrôles et pré-conformité", state: "Implémenté", tone: "success" as const, detail: "Findings, couverture et génération déterministe." },
    { label: "Revues humaines", state: "Implémenté", tone: "success" as const, detail: "Risque, opérations, conformité, juridique, fiscal et approbation interne." },
    { label: "Preuves et import", state: "Implémenté / cible à attester", tone: "warning" as const, detail: "Quarantaine, scan, staging, revue et promotion explicite." },
    { label: "Bibliothèque réglementaire", state: "Partiel", tone: "warning" as const, detail: "Lecture disponible ; administration complète des sources, versions et dépendances à poursuivre." },
    { label: "Studio de clauses", state: "Partiel", tone: "warning" as const, detail: "Propositions gouvernées disponibles ; validation juridique et cycle éditorial complet à finaliser." },
    { label: "Soumission au régulateur", state: "Désactivée", tone: "danger" as const, detail: "Aucune soumission tant que les gates réglementaires et humains ne sont pas fermés." },
  ];

  return (
    <AppShell active="operations">
      <AppHeader
        title="Cockpit opérationnel"
        description="Vue transverse des projets, blocages, revues et capacités du moteur. Les indicateurs restent des informations de pré-conformité."
        actionHref="/projects/new"
        actionLabel="Nouveau prospectus"
      />
      <div className="page-stack">
        <section className="stat-grid">
          <StatCard label="Projets suivis" value={projects.length} detail="Portefeuille courant" tone="info" />
          <StatCard label="Blocages" value={blockers} detail="Remédiation requise" tone={blockers > 0 ? "danger" : "success"} />
          <StatCard label="Avertissements" value={warnings} detail="Revue humaine" tone={warnings > 0 ? "warning" : "success"} />
          <StatCard label="Exigences" value={CATALOG_METADATA.requirementCount} detail={CATALOG_METADATA.rulePack} tone="info" />
        </section>

        <section className="split-grid">
          <div className="content-section">
            <div className="section-heading"><div><h2>File d'action portefeuille</h2><p>Les projets avec blocages et avertissements remontent en priorité.</p></div></div>
            <div className="coverage-table">
              {priorityProjects.length > 0 ? priorityProjects.map((project) => (
                <div className="coverage-table__row" key={project.id}>
                  <div>
                    <strong>{project.name}</strong>
                    <div><small>{projectStatusLabel(project.status)} · progression {project.progress}%</small></div>
                    <div><small>{project.blockers} blocage(s) · {project.warnings} avertissement(s)</small></div>
                  </div>
                  <div className="project-row__issues">
                    <Badge tone={priorityTone(project)}>{project.blockers > 0 ? "À corriger" : project.warnings > 0 ? "À revoir" : "Suivi"}</Badge>
                    <Link className="button button--secondary button--sm" href={`/projects/${project.id}`}>Ouvrir</Link>
                  </div>
                </div>
              )) : <div className="empty-state"><h3>Aucun projet suivi</h3><p>Le cockpit se remplira à partir des projets créés.</p></div>}
            </div>
          </div>

          <div className="content-section">
            <div className="section-heading"><div><h2>Gates réglementaires</h2><p>État fail-closed du produit.</p></div><Badge tone="danger">Soumission fermée</Badge></div>
            <div className="coverage-table">
              <div className="coverage-table__row"><div><strong>Exigences en revue</strong><div><small>Validation humaine du registre</small></div></div><Badge tone="warning">{reviewPending}</Badge></div>
              <div className="coverage-table__row"><div><strong>Catalogue de clauses</strong><div><small>Versions projetées dans l'application</small></div></div><Badge tone="warning">{CLAUSE_CATALOG_METADATA.clauseCount}</Badge></div>
              <div className="coverage-table__row"><div><strong>Activation automatique</strong><div><small>Règles, sanctions, dépendances et quantums</small></div></div><Badge tone="danger">Interdite</Badge></div>
              <div className="coverage-table__row"><div><strong>ready_for_submission</strong><div><small>Invariant de schéma et génération</small></div></div><Badge tone="danger">false</Badge></div>
            </div>
            <div className="form-panel__actions"><Link className="button button--secondary" href="/settings">Voir les gates runtime</Link></div>
          </div>
        </section>

        <section className="content-section" aria-labelledby="operations-readiness-heading">
          <div className="section-heading">
            <div>
              <h2 id="operations-readiness-heading">Préparation opérationnelle — preuves runtime</h2>
              <p>Projection en lecture seule du même contrat que l’API de readiness. Une configuration présente ne démontre ni son activation réelle ni une recette de production.</p>
            </div>
            <Badge tone="warning">Production non attestée</Badge>
          </div>
          <div className="coverage-table">
            {dependencyKeys.map((key) => {
              const state = readiness.dependencies[key];
              return (
                <div className="coverage-table__row" key={key}>
                  <div>
                    <strong>{dependencyNames[key]}</strong>
                    <div><small>État retourné par le contrôleur serveur, sans valeur de secret.</small></div>
                  </div>
                  <Badge tone={readinessTone(state)}>{state}</Badge>
                </div>
              );
            })}
            <div className="coverage-table__row">
              <div><strong>Readiness applicative</strong><div><small>La disponibilité locale ne prouve pas la conformité à l’environnement cible.</small></div></div>
              <Badge tone={readiness.ready ? "success" : "danger"}>{readiness.ready ? "READY" : "BLOCKED"}</Badge>
            </div>
            <div className="coverage-table__row">
              <div><strong>PRODUCTION_VERIFIED</strong><div><small>Nécessite les preuves externes d’identité, scanner, stockage, sauvegarde, supervision et déploiement réel.</small></div></div>
              <Badge tone="danger">{readiness.productionReady ? "ATTESTÉ" : "NON_ATTESTÉ"}</Badge>
            </div>
            <div className="coverage-table__row">
              <div><strong>Soumission réglementaire</strong><div><small>Aucun résultat de cette page ne lève les gates juridiques, conformité et régulateur.</small></div></div>
              <Badge tone="danger">ready_for_submission=false</Badge>
            </div>
          </div>
          <div className="section-heading">
            <div>
              <h3>Distinction des étapes de preuve</h3>
              <p>IMPLEMENTED et TESTED décrivent le logiciel et sa CI ; CONFIGURED décrit la présence de configuration ; ACTIVATED, DEPLOYED et PRODUCTION_VERIFIED nécessitent des attestations indépendantes.</p>
            </div>
          </div>
          <div className="coverage-table">
            {(["IMPLEMENTED", "TESTED", "CONFIGURED", "ACTIVATED", "DEPLOYED", "PRODUCTION_VERIFIED"] as const).map((stage) => (
              <div className="coverage-table__row" key={stage}>
                <div><strong>{stage}</strong><div><small>{stage === "CONFIGURED" ? "Voir les dépendances réellement observées ci-dessus." : "Aucune validation automatique d’une étape supérieure à partir des étapes inférieures."}</small></div></div>
                <Badge tone="neutral">Vérification distincte</Badge>
              </div>
            ))}
          </div>
          <div className="section-heading">
            <div>
              <h3>Blocages et paramètres manquants</h3>
              <p>Seuls les codes de contrôle et noms de paramètres sont exposés, jamais leurs valeurs.</p>
            </div>
          </div>
          {readiness.blockers.length > 0 || readiness.missingConfiguration.length > 0 ? (
            <div className="coverage-table">
              {readiness.blockers.map((code) => (
                <div className="coverage-table__row" key={`blocker:${code}`}>
                  <div><strong>{code}</strong><div><small>Condition de readiness non satisfaite.</small></div></div>
                  <Badge tone="danger">Bloquant</Badge>
                </div>
              ))}
              {readiness.missingConfiguration.map((name) => (
                <div className="coverage-table__row" key={`missing:${name}`}>
                  <div><strong>{name}</strong><div><small>Variable absente, sa valeur n’est pas consultable ici.</small></div></div>
                  <Badge tone="warning">Manquante</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p>Aucun manque de configuration détecté ; les validations de production demeurent distinctes et nécessaires.</p>
          )}
          <div className="form-panel__actions"><Link href="/settings" className="button button--secondary">Consulter les paramètres non secrets</Link></div>
        </section>

        <section className="content-section">
          <div className="section-heading"><div><h2>Carte des capacités frontend</h2><p>La cible distingue ce qui est implémenté, partiel ou encore externe.</p></div><Link className="button button--secondary button--sm" href="/regulatory-library">Bibliothèque</Link></div>
          <div className="coverage-table">
            {frontendDomains.map((domain) => (
              <div className="coverage-table__row" key={domain.label}>
                <div><strong>{domain.label}</strong><div><small>{domain.detail}</small></div></div>
                <Badge tone={domain.tone}>{domain.state}</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading"><div><h2>Architecture cible</h2><p>Quatre surfaces coordonnées, sans nouveau modèle métier concurrent.</p></div></div>
          <div className="split-grid">
            <div className="next-action-card"><div><strong>Composer</strong><p>Questionnaire, canonique, contrôles, preview et documents.</p></div><Link className="button button--secondary button--sm" href="/projects">Projets</Link></div>
            <div className="next-action-card"><div><strong>Regulatory Knowledge</strong><p>Sources, exigences, versions, dépendances et clauses.</p></div><Link className="button button--secondary button--sm" href="/regulatory-library">Bibliothèque</Link></div>
            <div className="next-action-card"><div><strong>Review & Evidence</strong><p>Preuves, imports, décisions, séparation des tâches et audit.</p></div><Link className="button button--secondary button--sm" href="/reviews">Centre de revues</Link></div>
            <div className="next-action-card"><div><strong>Operations & Security</strong><p>Readiness, identité, stockage, scanner, backups et observabilité.</p></div><Link className="button button--secondary button--sm" href="/settings">Paramètres</Link></div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
