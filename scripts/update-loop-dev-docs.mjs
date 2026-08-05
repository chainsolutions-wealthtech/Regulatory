import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedRoot = path.join(repoRoot, "examples", "generated", "united-capital-diamond");
const manifest = await readJson(path.join(generatedRoot, "generation-manifest.json"));
const validation = await readJson(path.join(generatedRoot, "control-report.json"));
const counts = manifest.coverage_counts;
const pending = manifest.pending_review_requirement_ids ?? [];
const missing = manifest.missing_requirement_ids ?? [];

const summary = [
  `- exigences analysées : \`${manifest.requirement_count}\` ;`,
  `- composants documentaires : \`${manifest.component_count}\` ;`,
  `- couvertes dans le prospectus : \`${counts.IN_PROSPECTUS}\` ;`,
  `- en attente de revue : \`${counts.PENDING_REVIEW}\` ;`,
  `- manquantes : \`${counts.MISSING}\` ;`,
  `- non applicables : \`${counts.NOT_APPLICABLE}\` ;`,
  `- métadonnées système : \`${counts.SYSTEM_METADATA}\` ;`,
  `- avertissements : \`${validation.counts.WARNING}\` ;`,
  `- blocages : \`${validation.counts.BLOCKER}\` ;`,
  `- prêt pour revue conformité : \`${manifest.ready_for_compliance_review}\` ;`,
  `- prêt pour soumission : \`${manifest.ready_for_submission}\`.`,
].join("\n");

const blocks = {
  "README.md": `## 16. Réconciliation complète de la couverture CIRC005 — 2026-08-05

Le moteur distingue désormais les informations effectivement produites, les informations encore soumises à confirmation ou revue humaine, et les informations absentes. Il ne transforme plus une donnée plausible ou préremplie en information validée.

${summary}

\`MISSING = 0\` signifie qu’aucune exigence n’est silencieusement omise. Cela ne signifie ni conformité, ni approbation, ni visa. Les exigences non vérifiées restent \`PENDING_REVIEW\` et empêchent la revue conformité ainsi que la soumission.`,

  "IMPLEMENTATION.md": `## Réconciliation de couverture V0.2

Le module \`src/core/circ005-completeness-extension.js\` complète le modèle documentaire et recalcule la concordance après la composition initiale.

Il couvre les 15 exigences précédemment manquantes, sépare les frais directement supportés par le porteur, ajoute les listes \`missing_requirement_ids\` et \`pending_review_requirement_ids\`, corrige les sur-couvertures non soutenues par des données vérifiées et maintient \`ready_for_submission: false\`.

${summary}`,

  "STATUS.md": `## Mise à jour LOOP-DEV-001 — Réconciliation CIRC005 V0.2

${summary}

Le prospectus reste un projet de pré-conformité. Les profils institutionnels, la fiscalité, la constitution du Fonds, la gouvernance, le dépositaire, la liquidation et les autres rubriques non vérifiées restent en attente de revue.`,

  "LOOP_STATE.md": `## État V0.2 de LOOP-DEV-001

- objectif intermédiaire \`15 → 0 MISSING\` : \`${counts.MISSING === 0 ? "ACHIEVED" : "NOT_ACHIEVED"}\` ;
- exigences en attente de revue : \`${pending.length}\` ;
- génération déterministe : activée ;
- branche conservée : \`main\` ;
- soumission : interdite ;
- prochaine tranche : export DOCX déterministe de pré-conformité.`,

  "CURRENT_ITERATION.md": `## Résultat de l’itération de couverture

${summary}

L’objectif de réduction des 15 exigences \`MISSING\` est atteint sans faux reclassement en \`NOT_APPLICABLE\`. Les informations non vérifiées sont exposées comme \`PENDING_REVIEW\`.

Reste à collecter les preuves institutionnelles et constitutives, valider la fiscalité et le point 5.3, reprendre l’Instruction n°66/2021 et produire le DOCX déterministe.`,

  "WORK_LOG.md": `## 2026-08-05 — LOOP-DEV-001 — Réconciliation des exigences manquantes

1. Identification des 15 exigences précédemment \`MISSING\`.
2. Ajout d’une extension de couverture distincte du compositeur initial.
3. Création des composants relatifs aux droits des parts, à l’émission, aux frais porteur, au contrôle comptable, à la gouvernance et aux métadonnées réglementaires.
4. Correction des sur-couvertures historiques non soutenues par des données vérifiées.
5. Ajout de tests de non-régression et d’une génération déterministe.

${summary}

Aucune nouvelle branche, aucun force-push, aucune suppression d’identifiant CIRC005 et aucune activation de clause n’ont été réalisés.`,

  "SUIVI.md": `## 2026-08-05 — Réconciliation complète de la couverture CIRC005

### Objectif

Réduire les 15 exigences manquantes du cas United Capital Diamond sans inventer de données ni utiliser artificiellement \`NOT_APPLICABLE\`.

### Travail réalisé

- extension de couverture \`0.2.0\` ;
- concordance recalculée ;
- statuts \`PENDING_REVIEW\` explicites ;
- séparation des frais supportés par le porteur ;
- génération déterministe ;
- nouveaux tests de non-régression.

### Résultat

${summary}

### Limite

Le résultat est une pré-conformité technique qui exige toujours les validations juridique, conformité et fiscale.`,

  "TODO.md": `## Mise à jour opérationnelle — LOOP-DEV-001 V0.2

- [x] Identifier les 15 exigences CIRC005 manquantes.
- [x] Ramener \`MISSING\` à zéro sans faux \`NOT_APPLICABLE\`.
- [x] Ajouter les statuts \`PENDING_REVIEW\` au manifeste.
- [x] Séparer les dépenses directement supportées par le porteur.
- [x] Ajouter les tests de non-régression de couverture.
- [x] Rendre la génération du cas d’exemple déterministe.
- [ ] Confirmer les \`${pending.length}\` exigences en attente de revue.
- [ ] Produire un export DOCX déterministe de pré-conformité.
- [ ] Reprendre \`LOOP-REG-001\` et l’atomisation de l’Instruction n°66/2021.
- [ ] Obtenir les validations juridique, conformité et fiscale.`,

  "CHANGELOG.md": `## [Unreleased] — Réconciliation CIRC005 V0.2 — 2026-08-05

### Added

- extension de couverture CIRC005 ;
- composants pour les 15 exigences précédemment manquantes ;
- statuts \`PENDING_REVIEW\` ;
- listes des exigences manquantes et en attente dans le manifeste ;
- tests de non-régression ;
- génération déterministe.

### Changed

La préparation à la revue conformité exige désormais \`MISSING = 0\` et \`PENDING_REVIEW = 0\`. Les sur-couvertures non vérifiées sont rétrogradées en attente de revue.`,

  "HANDOFF.md": `## Transmission V0.2

${summary}

Fichiers prioritaires :

- \`src/core/circ005-completeness-extension.js\` ;
- \`examples/generated/united-capital-diamond/generation-manifest.json\` ;
- \`examples/generated/united-capital-diamond/concordance.json\` ;
- \`examples/generated/united-capital-diamond/control-report.json\` ;
- \`test/circ005-completeness-extension.test.js\`.

Ne jamais convertir les exigences en attente en informations validées sans pièce, source et revue compétente.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-COVERAGE", markdown);
}

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
  updated_documents: Object.keys(blocks).length + 1,
  missing_requirements: missing.length,
  pending_review_requirements: pending.length,
  next_action: "DETERMINISTIC_DOCX_EXPORT",
}, null, 2));

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

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
