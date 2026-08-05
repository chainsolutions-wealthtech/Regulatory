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

const requiredChecks = [
  "structuredQuestionTypesExposed",
  "invalidStructuredRowsRejected",
  "shareClassesWrittenToCanonicalArray",
  "assetRangesWrittenToCanonicalArray",
  "feesWrittenToCanonicalArrays",
  "valuationMethodsWrittenToCanonicalArray",
  "governanceWrittenToCanonicalArray",
  "serviceProvidersWrittenToCanonicalArray",
  "risksWrittenToCanonicalArray",
  "countryArrangementsWrittenToCanonicalArray",
  "evidenceWrittenToCanonicalArray",
  "legacyRepeatingBucketsAvoided",
  "historicalComposerInvoked",
  "deterministicDocxValidated",
  "readyForSubmissionRemainsFalse",
];

if (
  validation.status !== "PASS" ||
  validation.validationId !== "CIRC005_WEB_API_INTEGRATION_VALIDATION_V4" ||
  validation.structuredCollectionCount !== 10 ||
  requiredChecks.some((check) => validation.checks?.[check] !== true)
) {
  throw new Error("La preuve des collections canoniques structurées n’est pas complète.");
}

const evidence = `- collections structurées testées : \`${validation.structuredCollectionCount}\` ;
- classes de parts : \`share_classes[]\` ;
- fourchettes d’allocation : \`investment_policy.asset_class_ranges[]\` ;
- frais transactionnels : \`fees.transaction[]\` ;
- rémunérations : \`remunerations[]\` ;
- méthodes de valorisation : \`valuation.methods[]\` ;
- gouvernance : \`manager.governance_members[]\` ;
- intervenants : \`service_providers[]\` ;
- risques : \`risks[]\` ;
- dispositifs pays : \`distribution_countries[]\` ;
- justificatifs : \`evidence[]\` ;
- repli de ces collections dans \`_repeating\` : \`REMOVED\` ;
- test HTTP complet : \`PASS\` ;
- compositeur historique et DOCX déterministe : \`PASS\` ;
- \`ready_for_submission\` : \`false\`.`;

const blocks = {
  "STATUS.md": `## Tranche structurée V1 — Collections canoniques

${evidence}

Les principales données répétables du parcours disposent désormais d’un éditeur Atomic Design partagé, d’une normalisation, d’une validation serveur, de contrôles intercollections et d’une écriture directe dans le snapshot canonique. Les lignes restent non confirmées tant qu’un rôle compétent ne les a pas revues.`,

  "LOOP_STATE.md": `## LOOP-DEV-001 — Collections répétables V1

- classes de parts : \`IMPLEMENTED_AND_VALIDATED\` ;
- fourchettes d’allocation : \`IMPLEMENTED_AND_VALIDATED\` ;
- commissions et frais : \`IMPLEMENTED_AND_VALIDATED\` ;
- méthodes de valorisation : \`IMPLEMENTED_AND_VALIDATED\` ;
- gouvernance et intervenants : \`IMPLEMENTED_AND_VALIDATED\` ;
- risques : \`IMPLEMENTED_AND_VALIDATED\` ;
- dispositifs pays : \`IMPLEMENTED_AND_VALIDATED\` ;
- justificatifs : \`IMPLEMENTED_AND_VALIDATED\` ;
- prochaine tranche : \`CANONICAL_SCHEMA_AND_POSTGRESQL\`.

${evidence}`,

  "CURRENT_ITERATION.md": `## Résultat — Dix collections canoniques structurées

${evidence}

Les contrôles couvrent notamment l’unicité des identifiants, les fourchettes \`0 ≤ minimum ≤ cible ≤ maximum ≤ 100\`, la cohérence des méthodes de valorisation, la présence du dépositaire, les dispositifs par pays et le statut des preuves.`,

  "WORK_LOG.md": `## 2026-08-05 — Généralisation des collections structurées

1. Généralisation du type de question répétable en huit familles de composants.
2. Création d’un éditeur Atomic Design partagé.
3. Ajout des types canoniques pour allocations, frais, valorisation, intervenants, risques, pays et justificatifs.
4. Normalisation et validation serveur de chaque ligne.
5. Écriture directe dans les dix collections canoniques.
6. Ajout de contrôles intercollections.
7. Adaptation vers le compositeur documentaire historique.
8. Test HTTP de bout en bout jusqu’au DOCX déterministe.
9. Correction d’une collision entre les codes pays sélectionnés et les dispositifs détaillés.

${evidence}`,

  "SUIVI.md": `## 2026-08-05 — Collections canoniques V1 terminées

Le questionnaire n’utilise plus de champs texte génériques pour les principales données répétables. Les identifiants CIRC005 sont conservés ; la structure de saisie et le modèle canonique deviennent assez précis pour alimenter le moteur documentaire.

${evidence}

Cette complétude technique ne constitue pas une validation juridique, conformité, fiscale ou réglementaire.`,

  "TODO.md": `## Collections structurées — état V1

- [x] Classes de parts.
- [x] Fourchettes d’allocation.
- [x] Frais et commissions.
- [x] Rémunérations des intervenants.
- [x] Méthodes de valorisation.
- [x] Gouvernance.
- [x] Prestataires et intervenants.
- [x] Facteurs de risque.
- [x] Dispositifs de commercialisation par pays.
- [x] Pièces justificatives et statut de vérification.
- [x] Contrôles intercollections.
- [x] Adaptation vers le compositeur et le DOCX.
- [ ] Publier le JSON Schema canonique V1.
- [ ] Créer le schéma PostgreSQL et les migrations.
- [ ] Remplacer la persistance JSON locale par une interface de stockage transactionnelle.
- [ ] Implémenter authentification, organisations, RBAC et audit immuable.
- [ ] Atomiser l’Instruction n°66 et compléter les règles.`,

  "CHANGELOG.md": `## [Unreleased] — Collections canoniques V1 — 2026-08-05

### Added

- éditeur Atomic Design partagé pour dix collections ;
- modèles canoniques des allocations, frais, valorisation, intervenants, risques, pays et preuves ;
- validations serveur et contrôles intercollections ;
- adaptation des collections vers le compositeur documentaire ;
- validation d’intégration V4 jusqu’au DOCX.

### Changed

Les principales données répétables sont désormais écrites directement dans leurs tableaux canoniques et ne sont plus rabattues dans \`_repeating\`.`,

  "HANDOFF.md": `## Transmission — Collections canoniques V1

${evidence}

Fichiers prioritaires :

- \`apps/web/src/domain/structured-answers.ts\` ;
- \`apps/web/src/components/molecules/StructuredCollectionField.tsx\` ;
- \`apps/web/src/server/canonical-snapshot.ts\` ;
- \`src/adapters/web-canonical-snapshot-adapter.js\` ;
- \`scripts/test-web-api.mjs\` ;
- \`regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json\`.

Ne pas considérer une ligne comme validée à cause de sa seule présence dans le snapshot.`,

  "docs/ARCHITECTURE.md": `## Pattern canonique des collections structurées V1

\`Question canonique → composant Atomic Design → normalisation → validation API → réponse versionnée → tableau canonique → contrôles intercollections → compositeur → DOCX\`.

Dix collections utilisent ce pattern. Les identifiants réglementaires et la traçabilité ne changent pas. Les données sélectionnées simples, telles que les codes pays, sont séparées des objets détaillés afin d’éviter toute collision canonique.`,

  "docs/04-development/NEXTJS_ATOMIC_DESIGN.md": `## 11. Éditeur partagé des collections canoniques

\`StructuredCollectionField\` rend les lignes d’allocation, frais, valorisation, intervenants, risques, pays et justificatifs depuis des définitions de champs typées. \`ShareClassCollectionField\` reste l’éditeur spécialisé des classes de parts.

${evidence}

Les validations décisives sont répétées côté serveur ; l’interface seule n’est jamais considérée comme une frontière de confiance.`,

  "apps/web/README.md": `## Collections structurées V1

Le questionnaire expose désormais dix collections canoniques éditables. L’API normalise et valide chaque ligne, rejette les doublons et incohérences, puis alimente directement le snapshot consommé par le compositeur documentaire.

${evidence}`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1", markdown);
}

await writeFile(
  path.join(repoRoot, "NEXT_ACTION.md"),
  `# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** \`READY\`
> **Boucle :** \`LOOP-DEV-001\`

## Action

Formaliser le modèle canonique V1 sous forme de JSON Schema et de schéma PostgreSQL versionné, puis introduire une interface de persistance transactionnelle sans déployer ni remplacer prématurément le stockage local de démonstration.

## Résultat attendu

- \`schemas/canonical/PROSPECTUS_CANONICAL_MODEL_V1.schema.json\` ;
- dictionnaire de données reliant objet, champ, type, cardinalité, unité, sensibilité, source et validations ;
- migration PostgreSQL initiale avec organisations, utilisateurs, projets, versions, réponses, snapshots, preuves, revues, approbations, documents générés et audit ;
- contraintes d’unicité et de cohérence pour les collections structurées ;
- politique de compatibilité et migrations de schéma ;
- abstraction de stockage utilisable par le stockage JSON local puis PostgreSQL ;
- tests de validation du schéma et de la migration ;
- aucune donnée de production, aucun secret et aucun déploiement ;
- \`ready_for_submission = false\` maintenu.

## Condition d’arrêt

Ne pas présenter le schéma technique comme une certification de sécurité ou de conformité. L’activation de PostgreSQL, de l’authentification et du multi-tenant exigera une revue d’architecture, de sécurité et d’exploitation.
`,
  "utf8",
);

console.log(
  JSON.stringify(
    {
      updatedDocuments: Object.keys(blocks).length + 1,
      structuredCollections: validation.structuredCollectionCount,
      integrationStatus: validation.status,
      nextAction: "CANONICAL_SCHEMA_AND_POSTGRESQL",
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
