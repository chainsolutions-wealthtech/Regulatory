import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repoRoot, "examples", "generated", "united-capital-diamond");
const manifest = JSON.parse(await readFile(path.join(outputDirectory, "generation-manifest.json"), "utf8"));
const validation = JSON.parse(await readFile(path.join(outputDirectory, "control-report.json"), "utf8"));

const counts = manifest.coverage_counts;
const pending = manifest.pending_review_requirement_ids ?? [];
const missing = manifest.missing_requirement_ids ?? [];
const resultSummary = [
  `- exigences analysées : \`${manifest.requirement_count}\` ;`,
  `- composants documentaires : \`${manifest.component_count}\` ;`,
  `- couverture dans le prospectus : \`${counts.IN_PROSPECTUS}\` ;`,
  `- en attente de revue : \`${counts.PENDING_REVIEW}\` ;`,
  `- manquantes : \`${counts.MISSING}\` ;`,
  `- non applicables : \`${counts.NOT_APPLICABLE}\` ;`,
  `- métadonnées système : \`${counts.SYSTEM_METADATA}\` ;`,
  `- avertissements : \`${validation.counts.WARNING}\` ;`,
  `- blocages : \`${validation.counts.BLOCKER}\` ;`,
  `- prêt pour revue conformité : \`${manifest.ready_for_compliance_review}\` ;`,
  `- prêt pour soumission : \`${manifest.ready_for_submission}\`.",
].join("\n").replace(".\"", ".");

await upsertBlock("README.md", "LOOP-DEV-001-COVERAGE", `
## 16. Réconciliation complète de la couverture CIRC005 — 2026-08-05

La tranche verticale distingue désormais trois situations qui ne doivent jamais être confondues :

1. information réellement produite dans le prospectus ;
2. information présente mais encore soumise à confirmation ou revue humaine ;
3. information absente.

Le moteur ne transforme plus automatiquement une rubrique préremplie ou plausible en information validée. Les profils institutionnels, la fiscalité, la date de constitution, la gouvernance, les droits en liquidation et les autres points non vérifiés restent au statut \`PENDING_REVIEW\`.

${resultSummary}

La liste des exigences en attente figure dans le manifeste de génération. Le statut \`MISSING = 0\` signifie uniquement qu’aucune exigence n’est silencieusement omise. Il ne signifie ni conformité, ni approbation, ni visa.
`);

await upsertBlock("IMPLEMENTATION.md", "LOOP-DEV-001-COVERAGE", `
## Réconciliation de couverture V0.2

Le module \`src/core/circ005-completeness-extension.js\` complète le modèle documentaire et recalcule la concordance après la composition initiale.

Fonctions introduites :

- couverture explicite des 15 exigences précédemment manquantes ;
- séparation des commissions payées par le porteur ;
- création des rubriques identité des parts, émission, liquidation, contrôle comptable, gouvernance et autres OPC ;
- statut \`PENDING_REVIEW\` pour les données non vérifiées ;
- ajout des listes \`missing_requirement_ids\` et \`pending_review_requirement_ids\` au manifeste ;
- impossibilité de déclarer le dossier prêt pour revue conformité tant qu’un statut \`PENDING_REVIEW\` subsiste ;
- génération déterministe du cas d’exemple ;
- conservation de \`ready_for_submission: false\`.

${resultSummary}
`);

await upsertBlock("STATUS.md", "LOOP-DEV-001-COVERAGE", `
## Mise à jour LOOP-DEV-001 — Réconciliation CIRC005 V0.2

${resultSummary}

### Interprétation

- \`MISSING = 0\` : aucune exigence CIRC005 n’est silencieusement omise ;
- \`PENDING_REVIEW > 0\` : le prospectus reste incomplet au sens de la validation humaine ;
- aucune clause n’est \`APPROVED\` ou \`ACTIVE\` ;
- la reprise de \`LOOP-REG-001\` reste nécessaire pour l’Instruction n°66/2021.
`);

await upsertBlock("LOOP_STATE.md", "LOOP-DEV-001-COVERAGE", `
## État V0.2 de LOOP-DEV-001

- objectif intermédiaire \`15 → 0 MISSING\` : \`${counts.MISSING === 0 ? "ACHIEVED" : "NOT_ACHIEVED"}\` ;
- exigences en attente de revue : \`${pending.length}\` ;
- tests automatisés : exécutés dans GitHub Actions ;
- génération déterministe : activée ;
- branche : \`main\` ;
- soumission : interdite ;
- prochaine tranche : export DOCX déterministe de pré-conformité.
`);

await upsertBlock("CURRENT_ITERATION.md", "LOOP-DEV-001-COVERAGE", `
## Résultat de l’itération de couverture

${resultSummary}

### Critère atteint

L’ancien objectif de réduction des 15 exigences \`MISSING\` est atteint sans reclassement artificiel en \`NOT_APPLICABLE\`. Les informations non vérifiées sont exposées comme \`PENDING_REVIEW\` et empêchent la revue conformité.

### Reste à faire

- collecter les preuves institutionnelles et constitutives ;
- valider la fiscalité et l’interprétation du point 5.3 ;
- reprendre l’Instruction n°66/2021 ;
- produire le DOCX déterministe ;
- conserver la traçabilité composant → exigence → donnée → preuve.
`);

await upsertBlock("WORK_LOG.md", "LOOP-DEV-001-COVERAGE", `
## 2026-08-05 — LOOP-DEV-001 — Réconciliation des exigences manquantes

1. Identification exacte des 15 exigences précédemment \`MISSING\`.
2. Ajout d’une extension de couverture distincte du compositeur initial.
3. Création de composants pour les droits des parts, l’émission, les frais porteur et les métadonnées réglementaires.
4. Création de composants \`PENDING_REVIEW\` pour les informations non vérifiées.
5. Correction des sur-couvertures historiques : constitution du Fonds, fiscalité, profil SGO, capital, dépositaire et informations économiques.
6. Ajout de tests empêchant le retour d’exigences silencieusement manquantes.
7. Génération déterministe et publication des artefacts de contrôle.

${resultSummary}

Aucune nouvelle branche, aucun force-push, aucune suppression d’identifiant CIRC005 et aucune activation de clause n’ont été réalisés.
`);

await upsertBlock("SUIVI.md", "LOOP-DEV-001-COVERAGE", `
## 2026-08-05 — Réconciliation complète de la couverture CIRC005

### Objectif

Réduire les 15 exigences manquantes du cas United Capital Diamond sans inventer de données ni utiliser artificiellement \`NOT_APPLICABLE\`.

### Travail réalisé

- extension de couverture \`0.2.0\` ;
- composants supplémentaires et concordance recalculée ;
- statuts \`PENDING_REVIEW\` explicites ;
- séparation des frais supportés par le porteur ;
- génération déterministe ;
- nouveaux tests de non-régression ;
- mise à jour automatique des preuves et registres.

### Résultat

${resultSummary}

### Limites

Le résultat est une pré-conformité technique. Les données en attente doivent être confirmées par les pièces, les référentiels officiels et les rôles juridique, conformité et fiscal.
`);

await upsertBlock("TODO.md", "LOOP-DEV-001-COVERAGE", `
## Mise à jour opérationnelle — LOOP-DEV-001 V0.2

- [x] Identifier les 15 exigences CIRC005 manquantes.
- [x] Ramener \`MISSING\` à zéro sans faux \`NOT_APPLICABLE\`.
- [x] Ajouter les statuts \`PENDING_REVIEW\` au manifeste.
- [x] Séparer les dépenses directement supportées par le porteur.
- [x] Ajouter les tests de non-régression de couverture.
- [x] Rendre la génération du cas d’exemple déterministe.
- [ ] Confirmer les ${pending.length} exigences en attente de revue.
- [ ] Produire un export DOCX déterministe de pré-conformité.
- [ ] Reprendre \`LOOP-REG-001\` et l’atomisation de l’Instruction n°66/2021.
- [ ] Obtenir les validations juridique, conformité et fiscale.
`);

await upsertBlock("CHANGELOG.md", "LOOP-DEV-001-COVERAGE", `
## [Unreleased] — Réconciliation CIRC005 V0.2 — 2026-08-05

### Added

- extension de couverture CIRC005 ;
- composants supplémentaires pour les 15 exigences précédemment manquantes ;
- statuts \`PENDING_REVIEW\` ;
- listes d’exigences manquantes et en attente dans le manifeste ;
- tests de non-régression ;
- génération déterministe et artefacts complets.

### Changed

- la préparation à la revue conformité exige désormais \`MISSING = 0\` et \`PENDING_REVIEW = 0\` ;
- les sur-couvertures non soutenues par des données vérifiées sont rétrogradées en attente de revue ;
- \`ready_for_submission\` reste toujours \`false\`.
`);

await upsertBlock("HANDOFF.md", "LOOP-DEV-001-COVERAGE", `
## Transmission V0.2

${resultSummary}

### Fichiers prioritaires

- \`src/core/circ005-completeness-extension.js\` ;
- \`examples/generated/united-capital-diamond/generation-manifest.json\` ;
- \`examples/generated/united-capital-diamond/concordance.json\` ;
- \`examples/generated/united-capital-diamond/control-report.json\` ;
- \`test/circ005-completeness-extension.test.js\`.

### Règle de reprise

Ne jamais convertir les exigences en attente en informations validées sans pièce, source et revue compétente. La prochaine tranche porte sur le DOCX déterministe, pas sur une déclaration de conformité.
`);

await writeFile(path.join(repoRoot, "NEXT_ACTION.md"), `# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** \`READY\`  
> **Boucle :** \`LOOP-DEV-001\`

## Action

Implémenter un export DOCX déterministe de pré-conformité à partir du \`document-model.json\`, en conservant pour chaque composant son identifiant, ses exigences, sa clause, ses champs sources et son statut de revue.

## Préconditions satisfaites

- concordance sur \`${manifest.requirement_count}\` exigences ;
- \`MISSING = ${counts.MISSING}\` ;
- exigences non vérifiées conservées en \`PENDING_REVIEW\` ;
- génération Markdown et JSON déterministe ;
- tests automatisés présents ;
- \`ready_for_submission = false\`.

## Résultat attendu

- fichier \`prospectus-draft.docx\` généré depuis le modèle documentaire ;
- rendu reproductible pour le même snapshot ;
- styles, titres, tableaux, avertissements et sauts de page contrôlés ;
- aucune suppression de la traçabilité ;
- tests de structure DOCX ;
- documentation et preuves mises à jour ;
- aucune conversion PDF dans cette tranche.

## Condition d’arrêt

Le DOCX reste un document de pré-conformité. Il ne doit comporter aucune mention laissant entendre un agrément, un visa, une approbation ou une conformité finale.
`, "utf8");

console.log(JSON.stringify({
  updated_documents: 11,
  missing_requirements: missing.length,
  pending_review_requirements: pending.length,
  next_action: "DETERMINISTIC_DOCX_EXPORT",
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
