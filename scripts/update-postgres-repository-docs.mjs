import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectValidation = await readValidation("POSTGRESQL_REPOSITORY_VALIDATION.json");
const importValidation = await readValidation("POSTGRESQL_IMPORT_STAGING_VALIDATION.json");

const projectChecks = [
  "verifiedIdentityRequired",
  "organizationMembershipRequired",
  "tenantAIsolation",
  "tenantBIsolation",
  "versionPerWrite",
  "optimisticConcurrencyConflict",
  "canonicalSnapshotPerVersion",
  "normalizedAssetRanges",
  "normalizedValuationMethods",
  "generatedDocumentMetadata",
  "stagedArtifactCommit",
  "auditHashChain",
  "readyForSubmissionRemainsFalse",
];
const importChecks = [
  "cleanEvidenceRequired",
  "tenantIsolation",
  "crossTenantEvidenceRejected",
  "reviewerIdentityPersisted",
  "doubleReviewRejected",
  "canonicalWriteLockedFalse",
  "readyForSubmissionLockedFalse",
  "sourceDigestPreserved",
];

assertValidation(
  projectValidation,
  "POSTGRESQL_PROJECT_REPOSITORY_VALIDATION_V1",
  projectChecks,
  "La preuve du dépôt PostgreSQL transactionnel est incomplète.",
);
assertValidation(
  importValidation,
  "POSTGRESQL_IMPORT_STAGING_VALIDATION_V1",
  importChecks,
  "La preuve du staging PostgreSQL des imports est incomplète.",
);

const projectEvidence = `- dépôt PostgreSQL projet : \`IMPLEMENTED_AND_TESTED\` ;
- identité serveur vérifiée : \`REQUIRED\` ;
- appartenance organisation : \`REQUIRED\` ;
- isolation multi-tenant : \`PASS\` ;
- version par écriture : \`PASS\` ;
- concurrence optimiste : \`PASS\` ;
- snapshot canonique : \`PASS\` ;
- chaîne d’audit SHA-256 : \`PASS\` ;
- \`ready_for_submission\` : \`false\`.`;

const importEvidence = `- migration : \`database/migrations/0006_import_staging.sql\` ;
- staging PostgreSQL tenant-scopé : \`IMPLEMENTED_AND_TESTED\` ;
- preuve source CLEAN exigée : \`PASS\` ;
- liaison projet/version/preuve/SHA : \`PASS\` ;
- RLS tenant : \`PASS\` ;
- réutilisation cross-tenant d’une preuve : \`REJECTED\` ;
- revue humaine persistée avec identité : \`PASS\` ;
- seconde décision sur une valeur revue : \`REJECTED\` ;
- source extraite après staging : \`IMMUTABLE\` ;
- \`canonical_write_allowed\` : \`false\` verrouillé en base ;
- \`ready_for_submission\` : \`false\` verrouillé en base.`;

const blocks = {
  "STATUS.md": `## PostgreSQL transactionnel et staging d’import — état 2026-08-17

${projectEvidence}

### Import prospectus

${importEvidence}

La confirmation humaine d’une valeur extraite ne constitue **jamais** une écriture dans le modèle canonique. Le passage vers une réponse projet devra rester une commande distincte, versionnée, autorisée et auditée.`,

  "LOOP_STATE.md": `## LOOP-DEV-001 — PostgreSQL projet + staging import

${projectEvidence}

${importEvidence}

- activation automatique de données extraites : \`FORBIDDEN\` ;
- copie automatique vers les réponses projet : \`FORBIDDEN\` ;
- soumission : \`DISABLED\`.` ,

  "CURRENT_ITERATION.md": `## Résultat — persistance PostgreSQL et import gouverné

Le repository projet et le staging d’import sont tous deux validés sur PostgreSQL 17 en CI.

${projectEvidence}

${importEvidence}

Prochaine tranche autonome : exposer le staging via un port runtime/API gouverné puis une interface de revue, sans écrire automatiquement dans le canonique.`,

  "WORK_LOG.md": `## 2026-08-17 — Staging PostgreSQL des imports prospectus

1. Spécification RED du repository de staging.
2. Observation du RED au typecheck sur le module absent.
3. Ajout de \`0006_import_staging.sql\`.
4. Ajout de \`PostgresImportStagingRepository\`.
5. Ajout des contraintes base \`canonical_write_allowed=false\` et \`ready_for_submission=false\`.
6. Ajout des contrôles de portée projet/version/preuve CLEAN/SHA.
7. Ajout RLS sur batches et valeurs importées.
8. Persistance de la décision humaine, du reviewer et de l’horodatage.
9. Refus d’une seconde décision et de la mutation de la source extraite.
10. Validation PostgreSQL 17, Security CI et Regulatory CI.

${importEvidence}`,

  "SUIVI.md": `## 2026-08-17 — Import prospectus : staging transactionnel

Le service d’extraction \`EXTRACTED_UNVERIFIED\` dispose désormais d’un staging PostgreSQL auditable. Les propositions et décisions humaines peuvent être persistées sans contourner le modèle canonique.

${importEvidence}

La prochaine évolution doit conserver la séparation : extraction → staging → revue humaine → éventuelle commande explicite de copie vers une réponse projet.`,

  "TODO.md": `## Import prospectus — état courant

- [x] Accepter uniquement une preuve CLEAN et un média PDF/DOCX supporté.
- [x] Produire des propositions \`EXTRACTED_UNVERIFIED\` avec provenance.
- [x] Implémenter confirmation/rejet humain sans écriture canonique.
- [x] Ajouter le staging PostgreSQL tenant-scopé.
- [x] Ajouter RLS et contrôles de portée projet/version/preuve.
- [x] Verrouiller \`canonical_write_allowed=false\` en base.
- [x] Verrouiller \`ready_for_submission=false\` en base.
- [x] Refuser la double revue et la mutation de la source extraite.
- [ ] Exposer le staging via le factory runtime et une API gouvernée.
- [ ] Construire l’écran de revue des propositions importées.
- [ ] Brancher un extracteur PDF/DOCX réel derrière quarantaine et antivirus réels.
- [ ] Concevoir la commande explicite de copie d’une valeur confirmée vers une réponse projet avec \`ANSWER_WRITE\`, \`expectedVersion\` et audit de provenance.
- [ ] Configurer stockage objet, antivirus, KMS/secrets et rétention sur l’infrastructure cible.`,

  "CHANGELOG.md": `## [Unreleased] — Import staging PostgreSQL — 2026-08-17

### Added

- migration \`0006_import_staging.sql\` ;
- tables \`prospectus_import_batches\` et \`prospectus_import_values\` ;
- RLS tenant sur le staging d’import ;
- repository PostgreSQL transactionnel de staging ;
- revue humaine persistée et traçable ;
- validation \`POSTGRESQL_IMPORT_STAGING_VALIDATION_V1\`.

### Security

- preuve CLEAN exigée ;
- SHA et portée projet/version contrôlés ;
- source extraite immuable ;
- double décision refusée ;
- écriture canonique et soumission verrouillées à \`false\` par PostgreSQL.`,

  "HANDOFF.md": `## Transmission — staging PostgreSQL import prospectus

Fichiers prioritaires :

- \`database/migrations/0006_import_staging.sql\` ;
- \`apps/web/src/server/import/postgres-import-staging-repository.ts\` ;
- \`apps/web/src/server/import/postgres-import-staging-repository.integration.ts\` ;
- \`apps/web/src/domain/prospectus-import.ts\` ;
- \`apps/web/src/domain/prospectus-import-review.integration.ts\` ;
- \`docs/04-development/PROSPECTUS_IMPORT_STAGING.md\`.

${importEvidence}

Ne jamais transformer une confirmation d’extraction en écriture canonique implicite.`,

  "docs/ARCHITECTURE.md": `## Staging PostgreSQL des imports prospectus

La chaîne d’import est séparée du repository canonique : une preuve CLEAN est extraite vers des propositions non vérifiées, persistée dans un staging RLS, puis chaque proposition reçoit éventuellement une décision humaine. Même après confirmation humaine, aucune donnée n’est copiée automatiquement vers \`project_answers\`.

${importEvidence}`,

  "apps/web/README.md": `## Staging PostgreSQL des imports

\`createPostgresImportStagingRepository\` persiste des batches d’extraction et leurs décisions humaines sous identité serveur vérifiée et contexte tenant.

${importEvidence}

Ce repository n’expose aucune opération de copie vers le modèle canonique.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-POSTGRES-REPOSITORY-V1", markdown);
}

console.log(JSON.stringify({
  updatedDocuments: Object.keys(blocks).length,
  projectRepository: projectValidation.status,
  importStaging: importValidation.status,
  readyForSubmission: false,
  nextActionOwnership: "PRESERVED_FROM_CANONICAL_LOOP_CONTROL",
}, null, 2));

async function readValidation(fileName) {
  return JSON.parse(await readFile(path.join(repoRoot, "regulatory/validation", fileName), "utf8"));
}

function assertValidation(validation, id, checks, message) {
  if (
    validation.status !== "PASS" ||
    validation.validationId !== id ||
    checks.some((check) => validation.checks?.[check] !== true)
  ) throw new Error(message);
}

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
