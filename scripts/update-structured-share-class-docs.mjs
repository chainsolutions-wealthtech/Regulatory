import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validation = JSON.parse(
  await readFile(
    path.join(repoRoot, "regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json"),
    "utf8",
  ),
);

if (
  validation.status !== "PASS" ||
  validation.checks?.structuredShareClassQuestionExposed !== true ||
  validation.checks?.structuredShareClassesPersisted !== true ||
  validation.checks?.shareClassesWrittenToCanonicalArray !== true
) {
  throw new Error("La preuve structurée des classes de parts n’est pas complète.");
}

const evidence = `- composant dédié : \`SHARE_CLASS_COLLECTION\` ;
- question canonique conservée : \`Q_SHARE_CLASSES_COUNT\` ;
- exigence conservée : \`CIRC005_1_10_FCP_PARTS_CHARACTERISTICS\` ;
- validation ligne par ligne et unicité des identifiants : \`PASS\` ;
- migration non destructive des anciennes valeurs booléennes : \`IMPLEMENTED\` ;
- écriture directe dans \`canonicalData.share_classes[]\` : \`PASS\` ;
- stockage provisoire dans \`_repeating.share_classes\` : \`REMOVED\` ;
- génération par le compositeur historique et DOCX déterministe : \`PASS\` ;
- \`ready_for_submission\` : \`false\`.`;

const blocks = {
  "STATUS.md": `## Tranche structurée 1 — Classes de parts

${evidence}

La première donnée répétable du questionnaire n’est plus saisie sous forme de booléen ou de texte générique. Elle dispose d’un éditeur Atomic Design, d’une validation serveur et d’une collection canonique directement consommable par le compositeur.`,

  "LOOP_STATE.md": `## LOOP-DEV-001 — Collections répétables

- classes de parts : \`IMPLEMENTED_AND_VALIDATED\` ;
- fourchettes d’allocation : \`NEXT\` ;
- commissions et frais : \`PENDING\` ;
- méthodes de valorisation : \`PENDING\` ;
- gouvernance et intervenants : \`PENDING\` ;
- documents et listes diverses : \`PENDING\`.

${evidence}`,

  "CURRENT_ITERATION.md": `## Résultat — Éditeur structuré des classes de parts

${evidence}

Les anciennes réponses \`false\` et \`true\` restent lisibles et sont transformées respectivement en une ou deux classes par défaut lors de la construction du snapshot. Une nouvelle réponse enregistrée est obligatoirement une collection validée.`,

  "WORK_LOG.md": `## 2026-08-05 — Donnée répétable structurée : classes de parts

1. Ajout du type \`SHARE_CLASS_COLLECTION\`.
2. Ajout de l’organisme \`ShareClassCollectionField\` et de ses styles isolés.
3. Ajout des types canoniques des classes de parts.
4. Ajout de la normalisation des valeurs historiques booléennes.
5. Ajout des contrôles : nombre de lignes, identifiant stable et unique, devise, politique de revenus, VL d’origine, minimum de souscription et décimalisation.
6. Rejet API des lignes invalides.
7. Écriture directe dans \`share_classes[]\`.
8. Test HTTP de bout en bout jusqu’au DOCX.

${evidence}`,

  "SUIVI.md": `## 2026-08-05 — Première collection canonique éditable

La gestion des classes de parts est désormais complète de l’interface au document généré. La question CIRC005 conserve son identifiant et sa traçabilité, mais son composant d’interface est maintenant adapté à la structure réelle des données.

${evidence}

Aucune conclusion de conformité ou de préparation à la soumission n’en découle.`,

  "TODO.md": `## Collections structurées — état détaillé

- [x] Créer le type \`SHARE_CLASS_COLLECTION\`.
- [x] Créer l’éditeur réutilisable des classes de parts.
- [x] Valider chaque classe avant persistance.
- [x] Garantir des identifiants de classe stables et uniques.
- [x] Migrer les anciennes réponses booléennes sans perte.
- [x] Alimenter directement \`share_classes[]\`.
- [x] Tester le flux questionnaire → snapshot → compositeur → DOCX.
- [ ] Structurer les fourchettes d’allocation par classe d’actifs.
- [ ] Structurer les commissions et frais.
- [ ] Structurer les méthodes de valorisation.
- [ ] Structurer les intervenants et la gouvernance.`,

  "CHANGELOG.md": `## [Unreleased] — Collections structurées V0.1 — 2026-08-05

### Added

- type de question \`SHARE_CLASS_COLLECTION\` ;
- éditeur Atomic Design pour une à vingt classes de parts ;
- validation serveur des lignes et identifiants ;
- migration des anciennes réponses booléennes ;
- test d’intégration vérifiant \`share_classes[]\` et l’absence de repli dans \`_repeating\`.

### Changed

La question \`Q_SHARE_CLASSES_COUNT\` produit désormais la collection canonique détaillée des classes au lieu d’une simple indication oui/non.`,

  "docs/ARCHITECTURE.md": `## Pattern des collections structurées

La première implémentation de référence est \`share_classes[]\` :

\`Question CIRC005 → composant structuré → validation serveur → réponse versionnée → collection canonique → compositeur historique → DOCX\`.

Le même pattern doit être réutilisé pour les fourchettes d’allocation, frais, méthodes de valorisation et intervenants. Les identifiants CIRC005 ne changent pas ; seul le composant de saisie devient plus précis.`,

  "docs/04-development/NEXTJS_ATOMIC_DESIGN.md": `## 11. Organisme répétable de référence : classes de parts

\`ShareClassCollectionField\` gère l’ajout, la suppression et la validation de lignes contenant : identifiant, devise, politique de revenus, VL d’origine, minimum initial de souscription et règle de décimalisation.

${evidence}

Ce composant constitue la référence pour les prochains tableaux éditables.`,

  "apps/web/README.md": `## Classes de parts structurées

La question \`Q_SHARE_CLASSES_COUNT\` utilise maintenant un éditeur de collection. L’API rejette les identifiants dupliqués et les lignes incomplètes, migre les anciennes valeurs booléennes et écrit les données validées dans \`canonicalData.share_classes[]\`.

Le comportement est couvert par le test HTTP du flux de génération complet.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-STRUCTURED-SHARE-CLASSES", markdown);
}

await writeFile(
  path.join(repoRoot, "NEXT_ACTION.md"),
  `# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** \`READY\`
> **Boucle :** \`LOOP-DEV-001\`

## Action

Créer le composant structuré des fourchettes d’allocation par classe d’actifs et écrire ses lignes directement dans \`investment_policy.asset_class_ranges[]\`.

## Résultat attendu

- lignes répétables avec identifiant stable ;
- classe d’actifs normalisée ;
- minimum, cible et maximum exprimés en pourcentage ;
- contrôle \`0 ≤ minimum ≤ cible ≤ maximum ≤ 100\` ;
- détection des classes d’actifs dupliquées ;
- reprise non destructive des anciennes réponses provisoires ;
- aucune écriture dans \`_repeating\` pour cette collection ;
- restitution dans la politique d’investissement et le DOCX ;
- tests unitaires, TypeScript, build et test HTTP de bout en bout ;
- documentation et preuves mises à jour ;
- \`ready_for_submission = false\` maintenu.

## Condition d’arrêt

Ne pas déployer, ne pas inventer de limites réglementaires et ne pas présenter les fourchettes saisies ou le document généré comme validés juridiquement, approuvés ou prêts pour soumission.
`,
  "utf8",
);

console.log(
  JSON.stringify(
    {
      updatedDocuments: Object.keys(blocks).length + 1,
      structuredShareClasses: "PASS",
      nextAction: "STRUCTURED_ASSET_CLASS_RANGES",
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
