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
  `- compositeur documentaire historique invoqué : \`${Boolean(apiValidation.checks?.historicalComposerInvoked)}\` ;`,
  `- bundle documentaire complet persisté : \`${Boolean(apiValidation.checks?.completeGenerationBundlePersisted)}\` ;`,
  `- DOCX déterministe validé : \`${Boolean(apiValidation.checks?.deterministicDocxValidated)}\` ;`,
  `- soumission automatique : \`false\`.`,
].join("\n");

const generationFlow =
  "`matrices CSV + registre YAML → catalogue JSON → questionnaire/API → canonical-snapshot.json → adaptateur web → compositeur historique → modèle documentaire + Markdown + concordance + contrôles + DOCX`";

const blocks = {
  "README.md": `## 19. Catalogue réglementaire et génération documentaire web — 2026-08-05

L’application Next.js consomme un catalogue déterministe construit depuis les quatre matrices CIRC005 et le registre YAML. Chaque projet web produit désormais un snapshot canonique versionné, transmis au compositeur documentaire historique par un adaptateur générique qui ne contient aucune exception propre au cas United Capital Diamond.

${summary}

Flux effectif : ${generationFlow}.

Les questions purement applicatives restent isolées sous des identifiants \`APP_*\`. Les éléments non mappés ou non confirmés sont conservés explicitement ; ils ne sont jamais supprimés ou considérés comme validés silencieusement.`,

  "IMPLEMENTATION.md": `## Adaptateur snapshot web → compositeur documentaire V0.1

Le contrat \`WEB_CANONICAL_SNAPSHOT_V1\` est validé avant composition. L’adaptateur conserve l’empreinte du catalogue, la version du projet, les chemins canoniques, les statuts de revue, les réponses historiques non mappées et la couverture déclarée par l’application.

${summary}

Pour chaque génération, le dossier versionné contient notamment \`canonical-snapshot.json\`, \`canonical-data.json\`, \`questionnaire-state.json\`, \`control-report.json\`, \`concordance.json\`, \`document-model.json\`, \`answer-log.json\`, \`generation-manifest.json\`, \`prospectus-draft.md\`, \`prospectus-draft.docx\`, \`docx-manifest.json\` et \`docx-validation.json\`.`,

  "STATUS.md": `## Mise à jour LOOP-DEV-001 — Compositeur générique depuis le snapshot web

${summary}

Le blocage « snapshot canonique non consommé par le moteur historique » est levé. La génération reste locale, pré-conformité et non déployée. Les champs répétables encore stockés sous une représentation provisoire doivent maintenant être remplacés par des composants structurés dédiés.`,

  "LOOP_STATE.md": `## État de LOOP-DEV-001 après connexion au compositeur

- matrices → catalogue web : \`IMPLEMENTED\` ;
- API catalogue et questionnaire : \`IMPLEMENTED\` ;
- migration non destructive des réponses : \`IMPLEMENTED\` ;
- snapshot canonique versionné : \`IMPLEMENTED\` ;
- adaptateur snapshot → compositeur historique : \`IMPLEMENTED_V0_1\` ;
- génération Markdown, concordance, contrôles et DOCX par projet : \`IMPLEMENTED_V0_1\` ;
- persistance du bundle versionné : \`IMPLEMENTED\` ;
- tests unitaires et HTTP : \`${apiValidation.status}\` ;
- prochaine tranche : composants structurés pour les données répétables ;
- production et soumission : \`FORBIDDEN\`.`,

  "CURRENT_ITERATION.md": `## Résultat de l’itération compositeur documentaire web

${summary}

Le même snapshot produit le même identifiant de génération et le même document. La traçabilité relie les réponses web, leurs champs canoniques, les exigences CIRC005, les composants du modèle documentaire et les fichiers générés. \`ready_for_submission\` reste forcé à \`false\` dans le snapshot, le manifeste de génération, le manifeste DOCX et l’API.`,

  "WORK_LOG.md": `## 2026-08-05 — LOOP-DEV-001 — Snapshot web vers compositeur historique

1. Création de \`src/adapters/web-canonical-snapshot-adapter.js\`.
2. Validation stricte du contrat \`WEB_CANONICAL_SNAPSHOT_V1\`.
3. Création de la CLI générique \`src/cli/generate-from-web-snapshot.js\`.
4. Suppression de la dépendance fonctionnelle au cas United Capital Diamond dans l’application web.
5. Branchement de l’API de génération Next.js sur le compositeur historique.
6. Génération et validation déterministes du DOCX pour tout projet web.
7. Persistance de tous les artefacts dans le dossier versionné de la génération.
8. Conservation des \`PENDING_REVIEW\` et des réponses historiques non mappées.
9. Ajout de tests unitaires et HTTP de bout en bout.
10. Maintien explicite de \`readyForSubmission: false\`.

${summary}`,

  "SUIVI.md": `## 2026-08-05 — Compositeur documentaire générique connecté à Next.js

### Objectif

Transformer chaque projet créé dans l’interface en livrables documentaires traçables sans recopier les règles réglementaires et sans logique réservée à un fonds d’exemple.

### Résultat

${summary}

### Limites restantes

Certains types de questions réglementaires utilisent encore une saisie générique et les chemins contenant \`[]\` sont conservés dans une zone répétable provisoire. L’Instruction n°66/2021 n’est pas entièrement atomisée. Aucun livrable n’est déclaré conforme, approuvé ou prêt pour soumission.`,

  "TODO.md": `## Mise à jour opérationnelle — génération documentaire web

- [x] Générer le catalogue web depuis les quatre matrices CIRC005.
- [x] Vérifier l’égalité exacte avec les 62 exigences du registre YAML.
- [x] Isoler les questions applicatives sous des identifiants \`APP_*\`.
- [x] Préserver et signaler les réponses historiques non mappées.
- [x] Générer un snapshot canonique versionné par projet.
- [x] Faire consommer le snapshot canonique par le compositeur documentaire historique.
- [x] Générer Markdown, concordance, contrôles et DOCX pour chaque projet web.
- [x] Persister le bundle complet dans le dossier versionné de génération.
- [x] Ajouter les tests unitaires et HTTP de bout en bout.
- [ ] Remplacer les saisies répétables provisoires par des composants dédiés et typés.
- [ ] Écrire les tableaux structurés directement dans les collections canoniques attendues par le compositeur.
- [ ] Ajouter une inspection visuelle automatisée du DOCX généré depuis un projet web générique.
- [ ] Reprendre l’atomisation de l’Instruction n°66/2021.
- [ ] Ajouter PostgreSQL, authentification, RBAC et séparation tenant avant tout déploiement.`,

  "CHANGELOG.md": `## [Unreleased] — Compositeur documentaire web V0.1 — 2026-08-05

### Added

- adaptateur générique \`WEB_CANONICAL_SNAPSHOT_V1\` → compositeur historique ;
- CLI de génération depuis un snapshot web ;
- génération DOCX déterministe et validation OOXML pour chaque projet ;
- persistance de treize artefacts de génération et de leurs chemins ;
- tests unitaires de déterminisme et test HTTP du bundle complet.

### Changed

L’API \`POST /api/projects/{projectId}/generate\` produit désormais le véritable modèle documentaire historique au lieu d’un aperçu constitué par concaténation des réponses.`,

  "HANDOFF.md": `## Transmission — compositeur documentaire web V0.1

${summary}

Fichiers prioritaires :

- \`src/adapters/web-canonical-snapshot-adapter.js\` ;
- \`src/cli/generate-from-web-snapshot.js\` ;
- \`apps/web/src/server/canonical-snapshot.ts\` ;
- \`apps/web/src/server/generation-adapter.ts\` ;
- \`apps/web/src/server/project-store.ts\` ;
- \`apps/web/src/app/api/projects/[projectId]/generate/route.ts\` ;
- \`test/web-canonical-snapshot-adapter.test.js\` ;
- \`scripts/test-web-api.mjs\` ;
- \`regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json\`.

Ne jamais réintroduire une génération spéciale réservée à United Capital Diamond. Ne jamais supprimer une réponse non mappée sans décision et journalisation explicites.`,

  "docs/ARCHITECTURE.md": `## Adaptateur du snapshot web vers le compositeur historique

Le flux exécutable est désormais :

${generationFlow}.

L’adaptateur se situe dans la couche \`src/adapters\`. Le compositeur historique reste responsable des clauses, sections, règles, contrôles et concordances. Next.js orchestre la création du snapshot et la persistance des artefacts, sans devenir une seconde implémentation des règles réglementaires.`,

  "docs/PROSPECTUS_ENGINE_SPEC.md": `## Contrat d’entrée web du moteur documentaire

Le moteur accepte le contrat \`WEB_CANONICAL_SNAPSHOT_V1\`. Les invariants obligatoires sont : objet canonique présent, projet et version identifiés, 62 exigences, catalogue identifié, réponses et éléments historiques non mappés explicitement listés, et \`readyForSubmission = false\`.

La génération enrichit le manifeste avec l’empreinte du snapshot, l’identifiant et la version du projet web, la couverture web, les questions en attente de revue et les réponses non mappées.`,

  "docs/04-development/NEXTJS_ATOMIC_DESIGN.md": `## 10. Sortie documentaire réelle

Le parcours Atomic Design n’aboutit plus à un simple aperçu. L’action de génération construit un snapshot canonique, appelle le compositeur historique et persiste le bundle documentaire complet.

${summary}

La prochaine évolution doit remplacer les champs génériques représentant des tableaux et collections par des organismes dédiés : classes de parts, fourchettes d’actifs, frais, méthodes de valorisation, intervenants et autres listes répétables.`,

  "apps/web/README.md": `## Génération documentaire

\`POST /api/projects/{projectId}/generate\` construit le snapshot canonique puis exécute \`src/cli/generate-from-web-snapshot.js\`. Le compositeur historique génère le modèle, le Markdown, la concordance, les contrôles et le DOCX déterministe.

Les artefacts sont enregistrés sous \`.local-data/projects/{projectId}/generations/{generationId}/\`. Cette persistance est locale et ne constitue pas une architecture de production.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-REGULATORY-CATALOG", markdown);
}



console.log(
  JSON.stringify(
    {
      updatedDocuments: Object.keys(blocks).length,
      catalogDigest: catalogValidation.catalogDigest,
      requirementCount: catalogValidation.requirementCount,
      apiIntegrationStatus: apiValidation.status,
      historicalComposerInvoked: Boolean(apiValidation.checks?.historicalComposerInvoked),
      completeGenerationBundlePersisted: Boolean(
        apiValidation.checks?.completeGenerationBundlePersisted,
      ),
      nextAction: "STRUCTURED_REPEATABLE_QUESTION_COMPONENTS",
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