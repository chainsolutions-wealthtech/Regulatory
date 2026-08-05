import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blockId = "LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN";

const blocks = {
  "README.md": `## 18. Application Next.js en Atomic Design — 2026-08-05

Une application exécutable est désormais disponible dans \`apps/web\`. Elle fournit le tableau de bord, la création d’un projet, un questionnaire dynamique en 18 groupes, l’auto-sauvegarde locale versionnée, les contrôles, la couverture CIRC005 et l’aperçu du prospectus.

L’architecture suit Atomic Design :

- \`atoms\` : primitives d’interface ;
- \`molecules\` : questions, alertes, statistiques et lignes de projet ;
- \`organisms\` : shell, navigation, wizard, contrôles et aperçu ;
- \`templates\` : compositions de pages ;
- \`app\` : routes App Router et API locale.

La documentation détaillée se trouve dans \`docs/04-development/NEXTJS_ATOMIC_DESIGN.md\`. La persistance JSON est locale et réservée au prototype. Aucune authentification, aucun multi-tenant, aucun déploiement et aucune soumission réglementaire ne sont activés.`,

  "STATUS.md": `## Mise à jour LOOP-DEV-001 — Next.js et Atomic Design

- application : \`apps/web\` ;
- framework : Next.js App Router + React + TypeScript ;
- architecture UI : Atomic Design ;
- groupes de questionnaire : \`18\` ;
- API locale : projets, questions, réponses et génération ;
- persistance : JSON local versionné avec audit NDJSON ;
- build : vérifié par GitHub Actions ;
- authentification : non implémentée ;
- production : interdite ;
- soumission réglementaire : interdite.

La prochaine étape porte sur la connexion exhaustive du catalogue web au moteur réglementaire, la généralisation de la génération DOCX et les tests d’intégration.`,

  "SUIVI.md": `## 2026-08-05 — Première application Next.js en Atomic Design

### Réalisé

- création de \`apps/web\` ;
- App Router et TypeScript strict ;
- composants répartis en atoms, molecules, organisms et templates ;
- tableau de bord et liste des projets ;
- création d’un projet ;
- questionnaire adaptatif en 18 groupes ;
- sauvegarde locale versionnée ;
- journal d’audit ;
- contrôles de complétude et de cohérence ;
- couverture CIRC005 ;
- aperçu du prospectus ;
- API locale ;
- vérification TypeScript et build de production dans la CI.

### Limites

La persistance n’est pas transactionnelle, l’authentification et le RBAC ne sont pas présents, et le catalogue de questions TypeScript est encore un adaptateur provisoire. L’application reste un prototype local de pré-conformité.`,

  "TODO.md": `## Mise à jour opérationnelle — Next.js / Atomic Design

- [x] Créer l’application Next.js App Router.
- [x] Structurer les composants selon Atomic Design.
- [x] Créer le tableau de bord et les projets.
- [x] Créer le questionnaire en 18 groupes.
- [x] Ajouter la persistance locale versionnée et l’audit.
- [x] Ajouter les Route Handlers projets, questions, réponses et génération.
- [x] Ajouter les contrôles et l’aperçu.
- [x] Ajouter le typecheck et le build Next.js à la CI.
- [ ] Générer le catalogue web directement depuis les matrices réglementaires.
- [ ] Généraliser le moteur documentaire à tous les projets.
- [ ] Brancher l’export DOCX sur les projets créés dans l’interface.
- [ ] Ajouter les tests d’intégration des API.
- [ ] Ajouter PostgreSQL et les migrations.
- [ ] Ajouter authentification, RBAC et séparation tenant.
- [ ] Effectuer la recette navigateur desktop et mobile.
- [ ] Reprendre l’atomisation de l’Instruction n°66/2021.`,

  "CHANGELOG.md": `## [Unreleased] — Application Next.js / Atomic Design — 2026-08-05

### Added

- application \`apps/web\` avec Next.js App Router ;
- composants Atomic Design ;
- tableau de bord, projets, questionnaire, contrôles et aperçu ;
- API locale et persistance JSON versionnée ;
- catalogue initial de questions couvrant 18 groupes ;
- validation TypeScript et build Next.js en CI ;
- ADR-0008 et documentation d’architecture front-end.

### Security

L’application est explicitement locale. Aucune authentification fictive n’est présentée comme sécurisée et aucun déploiement n’est autorisé dans cette tranche.`,

  "CURRENT_ITERATION.md": `## Résultat de l’itération Next.js

La première tranche applicative est implémentée : création de projet, questionnaire guidé, sauvegarde, contrôles et aperçu. Le moteur historique reste la source de vérité réglementaire ; l’application utilise des adaptateurs et ne duplique pas les identifiants CIRC005.

### Critères atteints

- structure Atomic Design ;
- App Router ;
- Server Components par défaut ;
- interactions limitées aux Client Components nécessaires ;
- persistance locale versionnée ;
- API locale ;
- build de production dans la CI.

### Critères non atteints

- PostgreSQL ;
- authentification et RBAC ;
- multi-tenant ;
- tests navigateur ;
- export DOCX générique ;
- validation juridique, conformité et fiscale.`,

  "LOOP_STATE.md": `## État applicatif de LOOP-DEV-001

- Next.js App Router : \`IMPLEMENTED\` ;
- Atomic Design : \`IMPLEMENTED\` ;
- questionnaire local : \`IMPLEMENTED_V0_1\` ;
- API locale : \`IMPLEMENTED_V0_1\` ;
- persistance locale : \`IMPLEMENTED_PROTOTYPE\` ;
- build CI : \`ENABLED\` ;
- production : \`FORBIDDEN\` ;
- prochaine tranche : intégration moteur, tests API et DOCX générique.`,

  "WORK_LOG.md": `## 2026-08-05 — LOOP-DEV-001 — Next.js et Atomic Design

1. Audit du dépôt, de la branche et des derniers commits.
2. Conservation de l’unique branche \`main\`.
3. Création de l’application sous \`apps/web\`.
4. Décomposition Atomic Design.
5. Implémentation de 18 groupes de questionnaire et de leurs conditions.
6. Implémentation de la persistance JSON versionnée et du journal d’audit.
7. Implémentation de six Route Handlers locaux.
8. Implémentation des contrôles, de la couverture et de l’aperçu.
9. Ajout du build Next.js à la CI.
10. Création de l’ADR et de la documentation.

Aucun déploiement, aucune nouvelle branche, aucun force-push et aucune activation de clause juridique n’ont été réalisés.`,

  "HANDOFF.md": `## Transmission — Application Next.js V0.1

### Entrées principales

- \`apps/web/src/app\` ;
- \`apps/web/src/components\` ;
- \`apps/web/src/domain\` ;
- \`apps/web/src/server\` ;
- \`docs/04-development/NEXTJS_ATOMIC_DESIGN.md\` ;
- \`docs/adr/ADR-0008-nextjs-atomic-design-frontend.md\`.

### Commandes

\`npm run web:install\`, \`npm run web:dev\`, \`npm run web:typecheck\` et \`npm run web:build\`.

### Limite de reprise

Ne pas déployer ou présenter l’application comme sécurisée avant la base transactionnelle, l’authentification, le RBAC, la séparation tenant, les tests d’intégration et la revue sécurité.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, blockId, markdown);
}

await writeFile(path.join(repoRoot, "NEXT_ACTION.md"), `# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** \`READY\`  
> **Boucle :** \`LOOP-DEV-001\`

## Action

Connecter l’application Next.js au catalogue réglementaire exécutable du dépôt afin que les groupes, questions, conditions, champs, exigences et statuts de couverture soient générés depuis les matrices et registres canoniques plutôt que maintenus dans un catalogue TypeScript provisoire.

## Résultat attendu

- adaptateur matrice → catalogue web ;
- aucun identifiant CIRC005 dupliqué ;
- questions regroupées et ordonnées depuis les données canoniques ;
- conditions et effets testés ;
- invalidation des réponses devenues inapplicables ;
- tests d’intégration API ;
- génération d’un snapshot exploitable par le moteur DOCX ;
- documentation mise à jour ;
- \`ready_for_submission = false\` maintenu.

## Condition d’arrêt

L’application reste locale et non déployée. Ne pas ajouter d’authentification fictive, ne pas utiliser la persistance JSON comme base de production et ne pas déclarer le prospectus conforme ou prêt pour soumission.
`, "utf8");

console.log(JSON.stringify({
  updated_documents: Object.keys(blocks).length + 1,
  application: "apps/web",
  architecture: "NEXTJS_ATOMIC_DESIGN",
  next_action: "CONNECT_CANONICAL_REGULATORY_CATALOG",
}, null, 2));

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
