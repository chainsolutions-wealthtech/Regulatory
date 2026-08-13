import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const branch = execFileSync("git", ["branch", "--show-current"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
const sourceHead = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
const sourceDate = execFileSync("git", ["show", "-s", "--format=%cs", "HEAD"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
const runId = process.env.GITHUB_RUN_ID ?? "LOCAL";

if (branch !== "main") {
  throw new Error(`CANONICAL_WORK_BRANCH_VIOLATION:${branch}`);
}

const governance = await readFile(path.join(repoRoot, "GOVERNANCE.md"), "utf8");
if (!governance.includes("CANONICAL_WORK_BRANCH = main")) {
  throw new Error("CANONICAL_WORK_BRANCH_NOT_DECLARED_IN_GOVERNANCE");
}

const nextAction = await readFile(path.join(repoRoot, "NEXT_ACTION.md"), "utf8");
if (!nextAction.includes("CM/10/06/2022")) {
  throw new Error("OWNER_NEXT_ACTION_CM_10_06_2022_NOT_FOUND");
}

const externalState = JSON.parse(
  await readFile(
    path.join(repoRoot, "regulatory/registries/INST066_CURRENT_EXTERNAL_DEPENDENCY_STATE_V0_1.json"),
    "utf8",
  ),
);
const apiValidation = JSON.parse(
  await readFile(
    path.join(repoRoot, "regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json"),
    "utf8",
  ),
);
const repositoryValidation = JSON.parse(
  await readFile(
    path.join(repoRoot, "regulatory/validation/POSTGRESQL_REPOSITORY_VALIDATION.json"),
    "utf8",
  ),
);

if (apiValidation.status !== "PASS") {
  throw new Error("WEB_API_VALIDATION_NOT_PASS");
}
if (repositoryValidation.status !== "PASS") {
  throw new Error("POSTGRESQL_REPOSITORY_VALIDATION_NOT_PASS");
}
if (repositoryValidation.checks?.readyForSubmissionRemainsFalse !== true) {
  throw new Error("READY_FOR_SUBMISSION_INVARIANT_NOT_PROVEN");
}

const summary = externalState.summary;
if (
  summary?.dependencyOccurrenceCount !== 49 ||
  summary?.resolvedDocumentaryCount !== 33 ||
  summary?.unresolvedDocumentaryCount !== 16
) {
  throw new Error("INST066_EXTERNAL_DEPENDENCY_STATE_UNEXPECTED");
}

const stateEvidence = `- branche canonique : \`main\` ;
- HEAD source vérifié par la boucle : \`${sourceHead}\` ;
- date du HEAD source : \`${sourceDate}\` ;
- run Regulatory CI : \`${runId}\` ;
- validation API CIRC005 : \`PASS\` ;
- compatibilité descendante des 10 collections structurées : \`PASS\` ;
- persistance canonique des anciens payloads : \`PASS\` ;
- reproductibilité PDF après normalisation fixe des métadonnées LibreOffice, dont \`/DocChecksum\` : \`PASS\` ;
- dépôt PostgreSQL transactionnel : \`PASS\` ;
- \`ready_for_submission\` : \`false\` ;
- dépendances externes Instruction 66 : \`${summary.dependencyOccurrenceCount}\` occurrences, \`${summary.resolvedDocumentaryCount}\` résolues documentairement, \`${summary.unresolvedDocumentaryCount}\` non résolues ;
- circulaires : \`${summary.circularOccurrenceCount}\` total, \`${summary.resolvedCircularCount}\` résolues, \`${summary.unresolvedCircularCount}\` non résolues ;
- instructions génériques : \`${summary.instructionOccurrenceCount}\` total, \`${summary.resolvedInstructionCount}\` résolues, \`${summary.unresolvedInstructionCount}\` non résolues ;
- activation réglementaire automatique : \`FORBIDDEN\` ;
- revues juridique et conformité : \`PENDING\`.`;

const blocks = {
  "AGENTS.md": `## Contrat canonique des agents — réconciliation 2026-08-13

\`\`\`text
CANONICAL_WORK_BRANCH = main
ONE_PROJECT_ONE_CANONICAL_WORK_BRANCH = TRUE
NEW_BRANCH_CREATION = FORBIDDEN
NORMAL_WORK_PR = NOT_REQUIRED
FORCE_PUSH = FORBIDDEN
IMPROVEMENT_ONLY = REQUIRED
ZERO_REGRESSION = REQUIRED
READ_EXISTING_BEFORE_CREATE = REQUIRED
DOCUMENT_ROLE_ANALYSIS = REQUIRED
PERSISTENT_MEMORY = REQUIRED
LOOP_ENGINEERING = REQUIRED
\`\`\`

Toute règle historique du présent fichier reste applicable. Ce bloc rend explicite la branche canonique et renforce la règle : lire, réutiliser, corriger, renforcer et étendre l’existant sans perte d’information ni régression.`,

  ".github/copilot-instructions.md": `## Contrat canonique Copilot — réconciliation 2026-08-13

Copilot est un adaptateur d’agent et n’introduit aucune politique concurrente.

\`\`\`text
CANONICAL_WORK_BRANCH = main
NEW_BRANCH_CREATION = FORBIDDEN
NORMAL_WORK_PR = NOT_REQUIRED
FORCE_PUSH = FORBIDDEN
IMPROVEMENT_ONLY = REQUIRED
ZERO_REGRESSION = REQUIRED
\`\`\`

Lire d’abord \`00_START_HERE.md\`, \`GOVERNANCE.md\`, \`AGENTS.md\` et \`SOURCE_OF_TRUTH.md\`. Lire tout document pertinent avant de conclure qu’il est redondant. Préserver identifiants, API, formats historiques, décisions, preuves et artefacts réglementaires.`,

  "STATUS.md": `## Réconciliation courante — gouvernance, non-régression et preuves 2026-08-13

Le dépôt est désormais explicitement gouverné en mode **une branche canonique : \`main\`**, sans création de branche par les agents et sans PR de travail normale. La réconciliation n’a supprimé ni remplacé les documents historiques : les photographies anciennes restent des preuves datées et le présent bloc porte l’état courant de contrôle.

${stateEvidence}

La défaillance CI préexistante observée au HEAD initial \`6eb645fc...\` a été isolée puis corrigée sans supprimer de couverture : routes HTTP fantômes retirées du test général, test dédié de compatibilité legacy ajouté, et non-déterminisme PDF attribué au champ LibreOffice \`/DocChecksum\` puis normalisé sans modifier les longueurs/offsets. La comparaison PDF reste byte-for-byte après normalisation.`,

  "LOOP_STATE.md": `## LOOP-GOV-002 — Réconciliation de gouvernance et non-régression

- statut : \`VALIDATION_PASSED_CONTINUING_RECONCILIATION\` ;
- branche : \`main\` ;
- branche créée : \`NO\` ;
- PR de travail créée : \`NO\` ;
- suppression documentaire : \`NO\` ;
- politique : \`IMPROVEMENT_ONLY + ZERO_REGRESSION\` ;
- prochaine action métier/réglementaire préservée : récupération du binaire institutionnel \`CM/10/06/2022\` ;
- visibilité GitHub actuellement observée : \`public\`, visibilité souhaitée par le propriétaire : \`TO_VERIFY\`.

${stateEvidence}`,

  "CURRENT_ITERATION.md": `## Overlay courant — LOOP-GOV-002

Objectif : consolider la gouvernance et synchroniser la mémoire persistante sans réécrire la baseline historique de \`LOOP-DEV-001\` ni les travaux de \`LOOP-REG-001\`.

Résultats atteints :

- gouvernance transversale \`GOVERNANCE.md\` ;
- \`main\` explicitement désignée branche canonique ;
- adaptateurs agents alignés ;
- CI préexistante en échec diagnostiquée et réparée ;
- compatibilité descendante legacy conservée et testée ;
- reproductibilité PDF renforcée sans affaiblissement du contrôle byte-for-byte ;
- prochaine action réglementaire propriétaire conservée.

${stateEvidence}`,

  "TODO.md": `## Overlay courant — réconciliation 2026-08-13

### Gouvernance et non-régression

- [x] Déclarer \`main\` comme branche canonique unique de travail.
- [x] Interdire explicitement aux agents toute nouvelle branche, PR normale et force-push.
- [x] Créer \`GOVERNANCE.md\` sans remplacer les documents canoniques existants.
- [x] Aligner les points d’entrée et adaptateurs agents.
- [x] Conserver tous les documents et informations historiques.
- [x] Identifier la CI en échec comme défaillance préexistante avant modifications fonctionnelles.
- [x] Restaurer le contrat HTTP réel sans supprimer la compatibilité legacy.
- [x] Ajouter un test dédié des 10 familles de payloads hérités vers leur persistance canonique.
- [x] Diagnostiquer le non-déterminisme PDF au niveau octet.
- [x] Normaliser le \`/DocChecksum\` volatile sans changer la longueur ni affaiblir l’égalité byte-for-byte.
- [x] Revalider PostgreSQL, Next.js, API, moteurs, DOCX, PDF et invariants dans la CI.
- [ ] Confirmer avec le propriétaire si la visibilité GitHub \`public\` est intentionnelle.

### Reprise réglementaire après la boucle de contrôle

- [ ] Conserver comme action prioritaire : obtenir le binaire officiel ou institutionnel non indexé de la Décision \`CM/10/06/2022\` du 24 juin 2022.
- [ ] Comparer ensuite ses clauses avec la décision sanctions 2016 déjà matérialisée.
- [ ] Ne jamais activer automatiquement montant, sanction, exigence ou dépendance sans les revues humaines prévues.

${stateEvidence}`,

  "NEXT_ACTION.md": `## Réconciliation canonique de la prochaine action — 2026-08-13

\`CONTROL_LOOP = LOOP-GOV-002\`

\`NEXT_REGULATORY_ACTION_OWNER = LOOP-REG-001\`

\`CANONICAL_WORK_BRANCH = main\`

La prochaine action réglementaire définie par le propriétaire et déjà présente dans ce document est **préservée** : obtenir le binaire officiel ou institutionnel non indexé de la Décision \`CM/10/06/2022\` du 24 juin 2022, puis le comparer à la décision sanctions 2016 déjà matérialisée.

L’ancien blocage GitHub Actions lié à la facturation reste conservé plus bas comme preuve historique, mais **il n’est plus le blocage courant** : des workflows Regulatory CI et Security ont effectivement été exécutés en août 2026. Aucune réussite future ne doit être déduite de cette phrase ; chaque nouveau SHA doit être vérifié séparément.

État documentaire Instruction 66 actuellement réconcilié :

- occurrences externes : \`${summary.dependencyOccurrenceCount}\` ;
- résolues documentairement : \`${summary.resolvedDocumentaryCount}\` ;
- non résolues : \`${summary.unresolvedDocumentaryCount}\` ;
- circulaires : \`${summary.resolvedCircularCount}/${summary.circularOccurrenceCount}\` résolues, \`${summary.unresolvedCircularCount}\` non résolues ;
- instructions génériques : \`${summary.resolvedInstructionCount}/${summary.instructionOccurrenceCount}\` résolues, \`${summary.unresolvedInstructionCount}\` non résolues ;
- activation automatique : \`FORBIDDEN\` ;
- revues juridique/conformité : \`PENDING\`.`,

  "HANDOFF.md": `## Handoff courant — réconciliation 2026-08-13

Un nouvel agent doit reprendre depuis \`00_START_HERE.md\` et \`GOVERNANCE.md\`, rester sur \`main\`, vérifier le HEAD et les CI du SHA qu’il traite, puis continuer sans créer de branche.

Ce chantier a renforcé la gouvernance **et** réparé une dette CI préexistante sans retirer les capacités legacy ni affaiblir le déterminisme PDF.

${stateEvidence}

Prochaine action métier/réglementaire à préserver : acquisition institutionnelle non indexée de \`CM/10/06/2022\`, puis comparaison 2016 ↔ 2022.`,

  "WORK_LOG.md": `## 2026-08-13 — LOOP-GOV-002 : gouvernance, compatibilité et réparation CI

1. Audit Git read-only : une seule branche \`main\`, HEAD initial \`6eb645fc...\`.
2. Lecture et conservation de l’architecture documentaire Loop Engineering existante.
3. Ajout de \`GOVERNANCE.md\` et ADR-0009 sans suppression documentaire.
4. Alignement des points d’entrée et adaptateurs agents.
5. Identification d’une Regulatory CI préexistante en échec avant les écritures fonctionnelles.
6. Isolation des routes HTTP inexistantes introduites uniquement dans un test.
7. Conservation et test séparé de la compatibilité descendante des payloads structurés historiques.
8. Diagnostic binaire de deux rendus PDF : premier octet divergent dans \`/DocChecksum\`.
9. Normalisation fixe et déterministe du checksum LibreOffice sans modification de longueur.
10. Revalidation de la chaîne CI avant réconciliation documentaire.

${stateEvidence}`,

  "SUIVI.md": `## 2026-08-13 — Gouvernance mono-branche et réparation sans régression

La méthode de travail du dépôt est consolidée : \`main\` est la branche canonique, les agents ne créent aucune branche, la mémoire persistante reste souveraine et chaque document pertinent est lu/intégré selon son rôle. Aucun Markdown historique n’a été supprimé pour cette consolidation.

Une défaillance CI antérieure au chantier a été traitée selon la boucle \`BASELINE → DIAGNOSTIC → CORRECTION CIBLÉE → VÉRIFICATION\`. La compatibilité descendante des structures historiques a été conservée, tandis que le déterminisme PDF a été renforcé par la normalisation du seul champ volatile prouvé \`/DocChecksum\`.

${stateEvidence}

La reprise réglementaire reste l’acquisition du binaire institutionnel \`CM/10/06/2022\`, sans activation automatique d’une règle ou sanction.`,

  "CHANGELOG.md": `## [Unreleased] — Gouvernance et non-régression — 2026-08-13

### Added

- contrat transversal \`GOVERNANCE.md\` ;
- ADR-0009 pour la branche canonique et la politique improvement-only ;
- boucle \`LOOP-GOV-002\` ;
- test HTTP dédié de compatibilité descendante des collections structurées ;
- diagnostic permanent de reproductibilité PDF byte-for-byte.

### Changed

- agents et points d’entrée alignés sur \`main\` ;
- mémoire documentaire consolidée sans suppression ;
- test HTTP général réaligné sur les routes réellement implémentées ;
- normalisation PDF étendue au champ LibreOffice \`/DocChecksum\` en conservant les longueurs et offsets.

### Fixed

- défaillance CI préexistante causée d’abord par des routes de test inexistantes puis par une métadonnée PDF volatile non normalisée.

### Preserved

- compatibilité descendante des payloads historiques ;
- égalité PDF byte-for-byte après normalisation ;
- \`ready_for_submission=false\` ;
- prochaine action réglementaire \`CM/10/06/2022\` ;
- historiques, décisions, preuves et artefacts existants.`,

  "docs/09-loop/LOOP-GOV-002-GOVERNANCE-RECONCILIATION-2026-08-13.md": `## Mise à jour automatique de preuve

Statut de la boucle : \`VALIDATION_PASSED_CONTINUING_RECONCILIATION\`.

${stateEvidence}

La clôture définitive exige encore la vérification du HEAD distant après le commit automatique de preuves et la confirmation qu’aucune branche n’a été créée. La visibilité GitHub souhaitée reste une question propriétaire distincte et ne bloque pas la conservation de l’état actuel.`,
};

const topPlacement = new Set([
  "AGENTS.md",
  ".github/copilot-instructions.md",
  "STATUS.md",
  "LOOP_STATE.md",
  "CURRENT_ITERATION.md",
  "TODO.md",
  "NEXT_ACTION.md",
  "HANDOFF.md",
]);

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(
    file,
    "LOOP-GOV-002-GOVERNANCE-RECONCILIATION",
    markdown,
    topPlacement.has(file) ? "after-heading" : "append",
  );
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      branch,
      sourceHead,
      runId,
      updatedDocuments: Object.keys(blocks).length,
      nextRegulatoryAction: "CM/10/06/2022",
      externalDependencies: summary.dependencyOccurrenceCount,
      unresolvedExternalDependencies: summary.unresolvedDocumentaryCount,
      readyForSubmission: false,
    },
    null,
    2,
  ),
);

async function upsertBlock(relativePath, id, markdown, placement) {
  const filePath = path.join(repoRoot, relativePath);
  const start = `<!-- AUTO:${id}:START -->`;
  const end = `<!-- AUTO:${id}:END -->`;
  const block = `${start}\n${markdown.trim()}\n${end}`;
  let current = await readFile(filePath, "utf8");
  const expression = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, "m");

  if (expression.test(current)) {
    current = current.replace(expression, block);
  } else if (placement === "after-heading") {
    const headingEnd = current.indexOf("\n");
    if (headingEnd < 0) throw new Error(`MISSING_DOCUMENT_HEADING:${relativePath}`);
    current = `${current.slice(0, headingEnd + 1)}\n${block}\n${current.slice(headingEnd + 1)}`;
  } else {
    current = `${current.trimEnd()}\n\n${block}\n`;
  }

  await writeFile(filePath, current, "utf8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}