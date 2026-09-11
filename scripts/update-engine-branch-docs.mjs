import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validation = JSON.parse(await readFile(path.join(repoRoot, "regulatory", "validation", "ENGINE_BRANCH_COVERAGE_VALIDATION.json"), "utf8"));
const requiredChecks = [
  "conditionCombinatorsCovered", "conditionOperatorsCovered", "unsupportedConditionRejected",
  "systemQuestionsExcludedFromInteractiveCatalog", "unknownQuestionRejected", "parentPathEscalationRejected",
  "explicitStructuredRootCompatibilityPreserved", "historicalExampleAnswersCompatible",
  "visibilityHiddenAndVisibleBranchesCovered", "validationPassedBranchCovered", "validationWarningBranchCovered",
  "validationFailedBranchCovered", "allocationBranchCovered", "redemptionBranchCovered", "suspensionBranchCovered",
  "feeBranchCovered", "warningsRemainNonBlocking", "readyForSubmissionRemainsFalse"
];
if (validation.status !== "PASS" || validation.validationId !== "ENGINE_BRANCH_COVERAGE_VALIDATION_V1" || requiredChecks.some((check) => validation.checks?.[check] !== true)) {
  throw new Error("ENGINE_BRANCH_COVERAGE_VALIDATION_REQUIRED");
}
const evidence = [
  "## Couverture des branches des moteurs — état courant",
  "",
  "Validation : `" + validation.validationId + "` = `PASS`.",
  "",
  "- catalogue interactif : `" + validation.questionCatalogCount + "` questions ;",
  "- réponses du cas historique rejouées : `" + validation.exampleAnswerCount + "` ;",
  "- combinateurs/opérateurs conditionnels : `PASS` ;",
  "- visibilité conditionnelle : `PASS` ;",
  "- rejet des questions inconnues : `PASS` ;",
  "- escalade d’écriture vers un chemin parent : `REJECTED` ;",
  "- racines structurées historiques explicitement autorisées : `PASS` ;",
  "- statuts `PASSED / PASSED_WITH_WARNINGS / VALIDATION_FAILED` : `PASS` ;",
  "- branches allocation/rachat/suspension/frais : `PASS` ;",
  "- warnings non bloquants : `PASS` ;",
  "- `ready_for_submission=false` : `PASS`.",
  "",
  "Cette preuve porte sur les branches logicielles déterministes ; elle ne remplace aucune revue juridique, conformité ou fiscale."
].join("\n");
await upsert("STATUS.md", evidence);
await upsert("SUIVI.md", evidence);
await upsert("CURRENT_ITERATION.md", evidence);
await upsert("TODO.md", [
  "## Couverture moteur — état courant",
  "",
  "- [x] Couvrir les combinateurs et opérateurs du moteur conditionnel.",
  "- [x] Couvrir les branches de visibilité du questionnaire.",
  "- [x] Rejeter les questions inconnues.",
  "- [x] Empêcher une question limitée à un champ enfant d’écrire son objet parent.",
  "- [x] Préserver explicitement les deux écritures structurées historiques nécessaires.",
  "- [x] Rejouer les 30 réponses du cas de référence contre le catalogue courant.",
  "- [x] Couvrir les trois statuts du rule engine.",
  "- [x] Couvrir les principales branches allocation, valorisation, rachat, suspension, frais et warnings.",
  "- [x] Produire une preuve machine versionnée.",
  "- [x] Maintenir `ready_for_submission=false`.",
  "- [ ] Poursuivre l’exhaustivité réglementaire uniquement depuis des sources officielles et revues humaines."
].join("\n"));
await upsert("CHANGELOG.md", [
  "## [Unreleased] — Couverture branches moteurs",
  "",
  "### Added",
  "",
  "- validation machine `ENGINE_BRANCH_COVERAGE_VALIDATION_V1` ;",
  "- couverture condition engine, questionnaire et rule engine ;",
  "- replay des 30 réponses historiques.",
  "",
  "### Fixed",
  "",
  "- suppression de l’autorisation générique permettant d’écrire un objet parent à partir d’un champ enfant autorisé ;",
  "- conservation des seules racines structurées historiques explicitement nécessaires.",
  "",
  "### Safety",
  "",
  "- aucun droit RBAC élargi ;",
  "- aucune règle réglementaire nouvelle activée ;",
  "- `ready_for_submission=false` maintenu."
].join("\n"));
console.log(JSON.stringify({ validationId: validation.validationId, status: validation.status, updatedDocuments: 5, readyForSubmission: false }, null, 2));

async function upsert(relativePath, markdown) {
  const id = "LOOP-DEV-001-ENGINE-BRANCH-COVERAGE-V1";
  const filePath = path.join(repoRoot, relativePath);
  const start = "<!-- AUTO:" + id + ":START -->";
  const end = "<!-- AUTO:" + id + ":END -->";
  const block = start + "\n" + markdown.trim() + "\n" + end;
  let current = await readFile(filePath, "utf8");
  const startIndex = current.indexOf(start);
  const endIndex = current.indexOf(end);
  if (startIndex >= 0 && endIndex >= startIndex) {
    current = current.slice(0, startIndex) + block + current.slice(endIndex + end.length);
  } else {
    current = current.trimEnd() + "\n\n" + block + "\n";
  }
  await writeFile(filePath, current, "utf8");
}
