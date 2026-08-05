import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogValidation = await readJson(
  "regulatory/validation/CIRC005_WEB_CATALOG_VALIDATION.json",
);
const apiValidation = await readJson(
  "regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json",
);

const summary = [
  `- exigences chargées depuis les matrices : \`${catalogValidation.requirementCount}\` ;`,
  `- questions réglementaires interactives : \`${catalogValidation.interactiveQuestionCount}\` ;`,
  `- questions système : \`${catalogValidation.systemQuestionCount}\` ;`,
  `- groupes réglementaires générés : \`${catalogValidation.groupCount}\` ;`,
  `- identifiants d’exigence uniques : \`${catalogValidation.uniqueRequirementIdCount}\` ;`,
  `- identifiants de question uniques : \`${catalogValidation.uniqueQuestionIdCount}\` ;`,
  `- empreinte du catalogue : \`${catalogValidation.catalogDigest}\` ;`,
  `- test d’intégration API : \`${apiValidation.status}\` ;`,
  `- soumission automatique : \`false\`.`,
].join("\n");

const blocks = {
  "README.md": `## 19. Catalogue réglementaire exécutable dans Next.js — 2026-08-05

L’application Next.js ne maintient plus une copie manuelle des questions réglementaires. Le script \`scripts/generate-web-regulatory-catalog.mjs\` transforme les quatre matrices CIRC005 et le registre YAML en catalogue JSON déterministe consommé par l’interface, l’API et le snapshot canonique.

${summary}

Les questions purement applicatives sont isolées sous des identifiants \`APP_*\`. Les questions encore dépendantes de l’Instruction 66 sont explicitement marquées \`PENDING_REGULATORY_MAPPING\` et ne sont jamais présentées comme exigences CIRC005 validées.`,

  "IMPLEMENTATION.md": `## Adaptateur matrices CIRC005 → application web V0.1

La génération du catalogue précède \`dev\`, \`typecheck\` et \`build\`. Elle contrôle l’égalité exacte entre les 62 identifiants des matrices CSV et ceux du registre YAML, l’unicité des identifiants et la présence des champs canoniques, rôles et références sources.

${summary}

À chaque génération utilisateur, l’application écrit désormais un \`canonical-snapshot.json\` versionné contenant les réponses structurées, les chemins canoniques, les exigences, les statuts de revue, les réponses historiques non mappées et l’empreinte du catalogue.`,

  "STATUS.md": `## Mise à jour LOOP-DEV-001 — Catalogue réglementaire web

${summary}

Le catalogue TypeScript réglementaire manuel est remplacé par un adaptateur généré. La persistance reste locale et le snapshot canonique n’est pas encore consommé par le moteur documentaire historique pour produire un DOCX générique.`,

  "LOOP_STATE.md": `## État catalogue réglementaire de LOOP-DEV-001

- matrices → catalogue web : \`IMPLEMENTED\` ;
- registre YAML rapproché des matrices : \`PASS\` ;
- API catalogue : \`IMPLEMENTED\` ;
- migration non destructive des anciennes réponses : \`IMPLEMENTED\` ;
- snapshot canonique par génération : \`IMPLEMENTED_V0_1\` ;
- tests HTTP de l’API : \`${apiValidation.status}\` ;
- prochaine tranche : moteur documentaire générique depuis le snapshot canonique ;
- production et soumission : \`FORBIDDEN\`.`,

  "CURRENT_ITERATION.md": `## Résultat de l’itération catalogue réglementaire

${summary}

Les composants Atomic Design continuent de consommer des objets \`ProspectusQuestion\`, mais ces objets sont maintenant construits depuis les matrices canoniques. Les anciennes réponses sont migrées lorsqu’un alias sûr existe et conservées, sans suppression silencieuse, lorsqu’elles nécessitent une reprise humaine.`,

  "WORK_LOG.md": `## 2026-08-05 — LOOP-DEV-001 — Connexion Next.js aux matrices CIRC005

1. Lecture des quatre matrices et du registre YAML.
2. Création d’un générateur déterministe et d’un rapport de validation.
3. Remplacement du catalogue réglementaire manuel par un adaptateur généré.
4. Isolation des questions \`APP_*\` non réglementaires.
5. Ajout de la migration non destructive des anciennes réponses.
6. Ajout du snapshot canonique versionné à chaque génération.
7. Ajout de l’endpoint \`GET /api/regulatory/catalog\`.
8. Ajout de tests HTTP réels sur le serveur Next.js construit.
9. Maintien explicite de \`readyForSubmission: false\`.

${summary}`,

  "SUIVI.md": `## 2026-08-05 — Catalogue CIRC005 généré pour l’application Next.js

### Objectif

Supprimer la duplication réglementaire entre les matrices du dépôt et le catalogue TypeScript provisoire de l’application.

### Résultat

${summary}

### Limites

Les composants structurés spécialisés restent provisoires pour certains types de questions. L’Instruction 66 n’est pas complètement atomisée. Le snapshot canonique doit encore être branché au compositeur historique pour générer les livrables DOCX de tous les projets.`,

  "TODO.md": `## Mise à jour opérationnelle — catalogue réglementaire web

- [x] Générer le catalogue web depuis les quatre matrices CIRC005.
- [x] Vérifier l’égalité exacte avec les 62 exigences du registre YAML.
- [x] Éliminer la copie manuelle des questions réglementaires.
- [x] Isoler les questions applicatives sous des identifiants \`APP_*\`.
- [x] Préserver et signaler les réponses historiques non mappées.
- [x] Ajouter l’API de lecture du catalogue.
- [x] Générer un snapshot canonique par projet.
- [x] Ajouter les tests d’intégration HTTP.
- [ ] Faire consommer le snapshot canonique par le compositeur documentaire historique.
- [ ] Générer Markdown, concordance, contrôles et DOCX pour chaque projet web.
- [ ] Remplacer les saisies structurées provisoires par des composants dédiés.
- [ ] Reprendre l’atomisation de l’Instruction n°66/2021.
- [ ] Ajouter PostgreSQL, authentification, RBAC et séparation tenant avant tout déploiement.`,

  "CHANGELOG.md": `## [Unreleased] — Catalogue réglementaire web V0.1 — 2026-08-05

### Added

- générateur matrices/registre → catalogue Next.js ;
- validation déterministe des 62 exigences ;
- endpoint de catalogue réglementaire ;
- migration non destructive des réponses historiques ;
- snapshot canonique par génération ;
- test d’intégration HTTP de l’API.

### Changed

Le catalogue réglementaire TypeScript manuel devient un simple adaptateur de compatibilité. Les questions non issues des matrices sont identifiées par \`APP_*\` ou \`PENDING_REGULATORY_MAPPING\`.`,

  "HANDOFF.md": `## Transmission — catalogue réglementaire web V0.1

${summary}

Fichiers prioritaires :

- \`scripts/generate-web-regulatory-catalog.mjs\` ;
- \`apps/web/src/domain/regulatory-catalog.ts\` ;
- \`apps/web/src/domain/application-questions.ts\` ;
- \`apps/web/src/server/canonical-snapshot.ts\` ;
- \`scripts/test-web-api.mjs\` ;
- \`regulatory/validation/CIRC005_WEB_CATALOG_VALIDATION.json\` ;
- \`regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json\`.

Ne jamais réintroduire une liste réglementaire manuelle dans React ou dans un autre catalogue parallèle.`,

  "docs/ARCHITECTURE.md": `## Adaptateur réglementaire de l’application Next.js

Le flux exécutable est désormais :

\`matrices CSV + registre YAML → catalogue JSON généré → adaptateur TypeScript → questionnaire/API → snapshot canonique → moteur documentaire\`.

Le catalogue JSON est un artefact de build non éditable. Les matrices et le registre restent les sources de vérité. Les questions applicatives sans exigence directe sont isolées et ne portent aucun identifiant CIRC005.`,

  "docs/PROSPECTUS_ENGINE_SPEC.md": `## Entrée web canonique du moteur documentaire

Chaque génération depuis l’application produit un \`canonical-snapshot.json\` contenant l’empreinte du catalogue, les chemins canoniques, les réponses, les exigences, les statuts de revue, les contrôles et les éléments historiques non mappés.

Ce snapshot devient le contrat d’entrée de la prochaine tranche du compositeur. Il ne peut jamais porter \`readyForSubmission: true\` sans workflow humain distinct.`,

  "docs/04-development/NEXTJS_ATOMIC_DESIGN.md": `## 9. Catalogue réglementaire généré

Les composants Atomic Design ne dépendent plus d’un tableau réglementaire écrit manuellement en TypeScript. Le catalogue est généré avant le développement, le typecheck et le build depuis les quatre matrices CIRC005 et le registre YAML.

${summary}

Les objets de présentation conservent les identifiants, champs canoniques, effets, contrôles, preuves, rôles, sections et références sources. Les composants spécialisés encore absents utilisent une saisie provisoire explicitement signalée.`,

  "apps/web/README.md": `## Catalogue réglementaire

Avant \`dev\`, \`typecheck\` et \`build\`, l’application exécute \`scripts/generate-web-regulatory-catalog.mjs\`. Le fichier généré sous \`src/generated\` ne doit jamais être modifié à la main.

L’API \`GET /api/regulatory/catalog\` expose les métadonnées et les 62 exigences. Chaque génération de projet écrit aussi un snapshot canonique versionné.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-REGULATORY-CATALOG", markdown);
}

await writeFile(
  path.join(repoRoot, "NEXT_ACTION.md"),
  `# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** \`READY\`
> **Boucle :** \`LOOP-DEV-001\`

## Action

Faire consommer le \`canonical-snapshot.json\` de chaque projet Next.js par le compositeur documentaire historique afin de produire, pour tout projet web, le modèle documentaire, le prospectus Markdown, la table de concordance, le rapport de contrôles et le DOCX déterministe.

## Résultat attendu

- contrat d’adaptation snapshot web → données du compositeur ;
- aucune logique propre au seul cas United Capital Diamond ;
- génération déterministe pour un même snapshot ;
- traçabilité question → champ → exigence → composant → document ;
- conservation des \`PENDING_REVIEW\` et des réponses historiques non mappées ;
- sorties versionnées dans le dossier de génération du projet ;
- tests de non-régression et d’intégration ;
- documentation et preuves mises à jour ;
- \`ready_for_submission = false\` maintenu.

## Condition d’arrêt

Ne pas déployer, ne pas créer d’authentification fictive et ne pas présenter les livrables comme conformes, visés, approuvés ou prêts pour soumission.
`,
  "utf8",
);

console.log(
  JSON.stringify(
    {
      updatedDocuments: Object.keys(blocks).length + 1,
      catalogDigest: catalogValidation.catalogDigest,
      requirementCount: catalogValidation.requirementCount,
      apiIntegrationStatus: apiValidation.status,
      nextAction: "GENERIC_DOCUMENT_COMPOSER_FROM_CANONICAL_SNAPSHOT",
    },
    null,
    2,
  ),
);

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
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
