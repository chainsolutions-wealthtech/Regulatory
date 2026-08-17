import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blockId = "LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN";

const blocks = {
  "README.md": `## 18. Application Next.js de pré-conformité — état 2026-08-17

L'application exécutable \`apps/web\` couvre désormais le cycle de préparation d'un prospectus OPCVM/FCP UMOA : projets, questionnaire réglementaire structuré, contrôles, prévisualisation, revues humaines, génération documentaire et historique de versions.

L'architecture conserve Atomic Design et App Router. Les Server Components restent le choix par défaut ; les interactions client sont limitées aux écrans qui en ont réellement besoin.

Capacités vérifiées :

- catalogue CIRC005 et questionnaire structuré ;
- persistance locale versionnée et repository PostgreSQL transactionnel ;
- RLS multi-tenant et contrôle de concurrence optimiste ;
- fournisseur OIDC générique exigeant une configuration réelle ;
- RBAC, séparation des tâches et workflow de revue ;
- génération déterministe Markdown/JSON/DOCX/PDF ;
- package ZIP de revue et API d'artefacts avec SHA-256 ;
- stockage de preuves en quarantaine et import sécurisé \`EXTRACTED_UNVERIFIED\` ;
- historique de versions et diff read-only ;
- \`ready_for_submission=false\` maintenu par les invariants.

La plateforme reste un système de **pré-conformité**. Les validations juridique, conformité et fiscale, l'infrastructure de production, l'antivirus réel, le stockage objet réel, les secrets et l'autorisation de mise en production restent des gates externes/humains.`,

  "STATUS.md": `## Mise à jour LOOP-DEV-001 — Application Next.js / état 2026-08-17

- application : \`apps/web\` ;
- framework : Next.js App Router + React + TypeScript ;
- architecture UI : Atomic Design ;
- catalogue et questionnaire CIRC005 : \`IMPLEMENTED\` ;
- driver JSON local versionné : \`IMPLEMENTED_PROTOTYPE\` ;
- repository PostgreSQL transactionnel : \`IMPLEMENTED_AND_TESTED\` ;
- isolation RLS multi-tenant : \`PASS_CI\` ;
- OIDC : \`IMPLEMENTED_REQUIRES_REAL_CONFIGURATION\` ;
- RBAC et séparation des tâches : \`IMPLEMENTED_AND_TESTED\` ;
- revues humaines : \`IMPLEMENTED_WORKFLOW\` ;
- DOCX déterministe : \`PASS_CI\` ;
- PDF déterministe normalisé : \`PASS_CI\` ;
- package ZIP de revue : \`PASS_CI\` ;
- import sécurisé : \`IMPLEMENTED_STAGING_EXTRACTED_UNVERIFIED\` ;
- historique + diff de versions : \`IMPLEMENTED_READ_ONLY\` ;
- production : \`NOT_AUTHORIZED\` ;
- soumission réglementaire : \`DISABLED\` ;
- \`ready_for_submission\` : \`false\`.

Les travaux autonomes restants concernent notamment l'administration gouvernée des clauses/sources, l'industrialisation de l'import et les tests navigateur/accessibilité. Les activations réglementaires, validations juridiques/conformité/fiscales et la production restent soumises aux gates humains et externes.`,

  "SUIVI.md": `## 2026-08-17 — Réconciliation applicative Next.js

### Capacités consolidées

- App Router et TypeScript strict ;
- Atomic Design ;
- questionnaire réglementaire structuré ;
- stockage JSON local versionné ;
- PostgreSQL transactionnel et RLS multi-tenant ;
- identité OIDC côté serveur derrière configuration réelle ;
- RBAC et séparation des tâches ;
- workflow de revue humaine ;
- génération déterministe DOCX et PDF ;
- package ZIP de revue ;
- API de téléchargement d'artefacts avec vérification SHA-256 ;
- import sécurisé en statut \`EXTRACTED_UNVERIFIED\` ;
- historique de versions local/PostgreSQL et diff read-only ;
- gates de soumission maintenus fermés.

### Frontières maintenues

Aucun déploiement de production, aucune identité fictive, aucun secret inventé, aucune approbation juridique simulée et aucune activation automatique de clause réglementaire. \`ready_for_submission\` reste \`false\`.`,

  "TODO.md": `## Mise à jour opérationnelle — Application Next.js / 2026-08-17

- [x] Créer l'application Next.js App Router et Atomic Design.
- [x] Générer le catalogue web depuis les matrices réglementaires.
- [x] Structurer les collections répétables dans le modèle canonique.
- [x] Brancher la génération DOCX aux projets applicatifs.
- [x] Générer et valider le PDF déterministe.
- [x] Générer le package ZIP de revue.
- [x] Ajouter les tests HTTP d'intégration API.
- [x] Ajouter PostgreSQL et les migrations.
- [x] Implémenter le repository PostgreSQL transactionnel.
- [x] Ajouter RLS multi-tenant et concurrence optimiste.
- [x] Implémenter OIDC derrière configuration réelle.
- [x] Implémenter RBAC et séparation des tâches.
- [x] Implémenter les revues humaines et le gel interne gouverné.
- [x] Ajouter le stockage de preuves sécurisé en quarantaine.
- [x] Ajouter le service d'import sécurisé \`EXTRACTED_UNVERIFIED\`.
- [x] Ajouter l'historique de versions et le diff read-only.
- [ ] Construire l'administration gouvernée des clauses et sources sans activation automatique.
- [ ] Brancher un extracteur PDF/DOCX réel derrière quarantaine/antivirus et confirmation humaine.
- [ ] Effectuer la recette navigateur desktop/mobile et accessibilité.
- [ ] Configurer stockage objet, antivirus, secrets, sauvegarde et restauration sur infrastructure réelle.
- [ ] Configurer le fournisseur OIDC réel de l'environnement cible.
- [!] Obtenir les revues juridique, conformité et fiscale nécessaires.
- [!] Maintenir la production et la soumission désactivées jusqu'à décision explicite.`,

  "CHANGELOG.md": `## [Unreleased] — Consolidation applicative — 2026-08-17

### Added

- repository PostgreSQL transactionnel et isolation tenant ;
- identité OIDC vérifiée derrière configuration runtime ;
- RBAC, séparation des tâches et workflow de revue ;
- stockage de preuves sécurisé et import en quarantaine ;
- génération PDF déterministe et package ZIP de revue ;
- API d'artefacts avec SHA-256 et protections de chemin ;
- historique de versions local/PostgreSQL ;
- API et workspace de comparaison de versions en lecture seule.

### Changed

- documentation applicative réconciliée avec l'état réellement validé en CI ;
- les anciennes mentions « PostgreSQL/authentification/DOCX à faire » ne sont plus réinjectées par le générateur documentaire.

### Security

- \`ready_for_submission=false\` demeure invariant ;
- aucune action de soumission n'est autorisée ;
- aucune activation automatique de clause n'est introduite ;
- les services de production non configurés ne sont jamais présentés comme opérationnels.`,

  "CURRENT_ITERATION.md": `## Résultat courant — Application de pré-conformité

La tranche applicative couvre désormais le questionnaire, les contrôles, la génération déterministe, les revues humaines, PostgreSQL/RLS, la sécurité des preuves et l'historique de versions.

### Critères atteints

- App Router / Atomic Design ;
- Server Components par défaut ;
- catalogue réglementaire structuré ;
- persistance locale et PostgreSQL ;
- RLS, OIDC, RBAC et séparation des tâches ;
- DOCX/PDF/ZIP déterministes ;
- API HTTP testée ;
- import sécurisé non vérifié ;
- versions et diff read-only ;
- CI Regulatory et Security actives.

### Gates restant externes ou humains

- fournisseur OIDC réellement configuré ;
- stockage objet et antivirus réels ;
- sauvegarde/restauration ;
- recette navigateur/accessibilité/sécurité d'exploitation ;
- validation juridique, conformité et fiscale ;
- décision de production ;
- soumission réglementaire, toujours désactivée.`,

  "LOOP_STATE.md": `## État applicatif de LOOP-DEV-001 — 2026-08-17

- Next.js App Router : \`IMPLEMENTED\` ;
- Atomic Design : \`IMPLEMENTED\` ;
- catalogue/questionnaire : \`IMPLEMENTED\` ;
- PostgreSQL transactionnel : \`IMPLEMENTED_AND_TESTED\` ;
- RLS multi-tenant : \`PASS_CI\` ;
- OIDC : \`IMPLEMENTED_CONFIGURATION_REQUIRED\` ;
- RBAC/workflow : \`PASS_CI\` ;
- DOCX/PDF/ZIP : \`PASS_CI\` ;
- import sécurisé : \`IMPLEMENTED_GATED\` ;
- historique/diff : \`IMPLEMENTED_READ_ONLY\` ;
- production : \`NOT_AUTHORIZED\` ;
- soumission : \`DISABLED\` ;
- prochaine tranche autonome : administration gouvernée des clauses/sources et industrialisation contrôlée de l'import.`,

  "WORK_LOG.md": `## 2026-08-17 — LOOP-DEV-001 — Consolidation applicative

1. Réconciliation du produit réel avec les anciens TODO.
2. Confirmation des capacités PostgreSQL, RLS, OIDC, RBAC et revue.
3. Confirmation de la génération DOCX/PDF et du package ZIP déterministes.
4. Confirmation du service d'import sécurisé sans écriture canonique automatique.
5. Ajout en TDD de l'historique de versions et du diff read-only.
6. Ajout du repository historique pour JSON local et PostgreSQL en transaction \`READ ONLY\`.
7. Ajout des routes HTTP d'historique et de comparaison.
8. Ajout du workspace projet « Versions » en Server Component.
9. Maintien des gates \`ready_for_submission=false\`, soumission désactivée et activation réglementaire non automatique.
10. Réconciliation du générateur de documentation pour empêcher le retour d'états obsolètes.

Aucune nouvelle branche, aucun force-push, aucune approbation juridique simulée et aucune activation réglementaire automatique.`,

  "HANDOFF.md": `## Transmission — Application de pré-conformité / état 2026-08-17

### Entrées applicatives principales

- \`apps/web/src/app\` ;
- \`apps/web/src/components\` ;
- \`apps/web/src/domain\` ;
- \`apps/web/src/server\` ;
- \`apps/web/src/server/storage/project-version-repository.ts\` ;
- \`apps/web/src/server/project-version-diff.ts\` ;
- \`docs/04-development/PROJECT_VERSION_HISTORY.md\`.

### Vérifications obligatoires avant reprise

Exécuter les gates Regulatory CI et Security/Review Policy CI. Ne considérer aucun service externe de production comme disponible sans configuration et preuve runtime réelles.

### Limite de reprise

Ne pas activer de clause, ne pas marquer un dossier prêt pour soumission, ne pas simuler une validation juridique/conformité/fiscale et ne pas déployer sans recette et autorisation humaines explicites.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, blockId, markdown);
}

console.log(
  JSON.stringify(
    {
      updated_documents: Object.keys(blocks).length,
      application: "apps/web",
      architecture: "NEXTJS_ATOMIC_DESIGN",
      history: "IMPLEMENTED_READ_ONLY",
      ready_for_submission: false,
      next_action: "GOVERNED_CLAUSE_SOURCE_ADMINISTRATION",
    },
    null,
    2,
  ),
);

async function upsertBlock(relativePath, id, markdown) {
  const filePath = path.join(repoRoot, relativePath);
  const start = `<!-- AUTO:${id}:START -->`;
  const end = `<!-- AUTO:${id}:END -->`;
  const block = `${start}\n${markdown.trim()}\n${end}`;
  let current = await readFile(filePath, "utf8");
  const expression = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, "m");
  current = expression.test(current)
    ? current.replace(expression, block)
    : `${current.trimEnd()}\n\n${block}\n`;
  await writeFile(filePath, current, "utf8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
