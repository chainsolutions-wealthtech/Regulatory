import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { CATALOG_METADATA, REGULATORY_REQUIREMENTS } from "@/domain/regulatory-catalog";
import { CLAUSE_CATALOG_METADATA } from "@/domain/clause-catalog";
import type { ProjectSummary } from "@/domain/types";

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

export function OperationsCockpitTemplate({ projects }: { projects: ProjectSummary[] }) {
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
