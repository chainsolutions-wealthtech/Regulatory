import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validationPath = path.join(repoRoot, "regulatory", "validation", "MULTI_PROFILE_REGRESSION_CORPUS_VALIDATION.json");
const validation = JSON.parse(await readFile(validationPath, "utf8"));

const requiredChecks = [
  "deterministicGenerationIds",
  "deterministicDocumentHashes",
  "distinctProfilesProduceDistinctGenerationIds",
  "distinctProfilesProduceDistinctDocumentHashes",
  "circ005ConcordanceRemains62",
  "readyForSubmissionRemainsFalse",
  "noRegulatoryTruthIntroduced",
];
if (
  validation.status !== "PASS" ||
  validation.validationId !== "MULTI_PROFILE_REGRESSION_CORPUS_VALIDATION_V1" ||
  validation.syntheticFixtureOnly !== true ||
  validation.profileCount < 4 ||
  requiredChecks.some((check) => validation.checks?.[check] !== true)
) {
  throw new Error("MULTI_PROFILE_REGRESSION_VALIDATION_REQUIRED");
}
if (validation.profiles.some((profile) => profile.ready_for_submission !== false || profile.requirement_count !== 62)) {
  throw new Error("MULTI_PROFILE_REGRESSION_PROFILE_INVARIANT_FAILED");
}

const profileTable = validation.profiles
  .map((profile) => `| \`${profile.profile}\` | \`${profile.generation_id}\` | \`${profile.prospectus_markdown_sha256}\` | \`${profile.ready_for_submission}\` |`)
  .join("\n");

const evidence = `## Corpus de régression multi-profils — preuve exécutée

Validation : \`${validation.validationId}\` = \`PASS\`.

| Profil synthétique | generation_id | SHA-256 Markdown | ready_for_submission |
| --- | --- | --- | --- |
${profileTable}

Invariants : déterminisme intra-profil \`PASS\`, unicité inter-profils \`PASS\`, concordance CIRC005 = \`62\` pour chaque profil, \`ready_for_submission=false\` pour chaque profil. Les fixtures sont strictement synthétiques et ne constituent aucune vérité réglementaire, approbation juridique ou acceptation production.`;

await upsertBlock("STATUS.md", "LOOP-DEV-001-MULTI-PROFILE-CORPUS", evidence);
await upsertBlock("SUIVI.md", "LOOP-DEV-001-MULTI-PROFILE-CORPUS", evidence);
await upsertBlock(
  "TODO.md",
  "LOOP-DEV-001-MULTI-PROFILE-CORPUS",
  `## Recette multi-profils — état courant\n\n- [x] Ajouter au moins quatre profils synthétiques distincts.\n- [x] Vérifier le déterminisme des generation IDs.\n- [x] Vérifier le déterminisme des hashes documentaires.\n- [x] Vérifier l’unicité inter-profils.\n- [x] Conserver les 62 exigences CIRC005 dans chaque concordance.\n- [x] Mutation-tester l’invariant \`ready_for_submission=false\`.\n- [x] Générer la preuve machine depuis le runtime qui exécute les tests.\n- [x] Persister les hashes exécutés dans les documents de gouvernance.\n- [ ] Promouvoir des hashes en golden masters immuables uniquement après un run CI attesté du HEAD exact.`,
);
await upsertBlock(
  "CHANGELOG.md",
  "LOOP-DEV-001-MULTI-PROFILE-CORPUS",
  `## [Unreleased] — Corpus de régression multi-profils\n\n### Added\n\n- quatre profils de test synthétiques ;\n- tests de déterminisme et unicité des sorties ;\n- mutation tests contre l’activation implicite de la soumission ;\n- preuve machine avec hashes calculés à l’exécution ;\n- persistance documentaire des hashes exécutés.\n\n### Safety\n\n- aucune fixture synthétique n’est une donnée réglementaire ;\n- aucun hash n’est inventé à la main ;\n- \`ready_for_submission=false\` reste obligatoire.`,
);

console.log(JSON.stringify({
  validationId: validation.validationId,
  status: validation.status,
  profiles: validation.profileCount,
  updatedDocuments: 4,
  readyForSubmission: false,
}, null, 2));

async function upsertBlock(relativePath, id, markdown) {
  const filePath = path.join(repoRoot, relativePath);
  const start = `<!-- AUTO:${id}:START -->`;
  const end = `<!-- AUTO:${id}:END -->`;
  const block = `${start}\n${markdown.trim()}\n${end}`;
  let current = await readFile(filePath, "utf8");
  const expression = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, "m");
  current = expression.test(current) ? current.replace(expression, block) : `${current.trimEnd()}\n\n${block}\n`;
  await writeFile(filePath, current, "utf8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
