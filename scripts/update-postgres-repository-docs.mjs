import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectValidation = await readValidation("POSTGRESQL_REPOSITORY_VALIDATION.json");
const importValidation = await readValidation("POSTGRESQL_IMPORT_STAGING_VALIDATION.json");
const importQueryValidation = await readValidation("POSTGRESQL_IMPORT_STAGING_QUERY_VALIDATION.json");
const promotionValidation = await readValidation("POSTGRESQL_IMPORT_PROMOTION_VALIDATION.json");
const evidenceValidation = await readValidation("POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION.json");

assertValidation(
  projectValidation,
  "POSTGRESQL_PROJECT_REPOSITORY_VALIDATION_V1",
  [
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
  ],
  "La preuve du dépôt PostgreSQL transactionnel est incomplète.",
);
assertValidation(
  importValidation,
  "POSTGRESQL_IMPORT_STAGING_VALIDATION_V1",
  [
    "cleanEvidenceRequired",
    "tenantIsolation",
    "crossTenantEvidenceRejected",
    "reviewerIdentityPersisted",
    "doubleReviewRejected",
    "canonicalWriteLockedFalse",
    "readyForSubmissionLockedFalse",
    "sourceDigestPreserved",
  ],
  "La preuve du staging PostgreSQL des imports est incomplète.",
);
assertValidation(
  importQueryValidation,
  "POSTGRESQL_IMPORT_STAGING_QUERY_VALIDATION_V1",
  [
    "readOnlyProjectListing",
    "reviewCounters",
    "tenantIsolation",
    "canonicalWriteRemainsFalse",
    "readyForSubmissionRemainsFalse",
  ],
  "La preuve du listing read-only du staging est incomplète.",
);
assertValidation(
  promotionValidation,
  "POSTGRESQL_IMPORT_PROMOTION_VALIDATION_V1",
  [
    "answerWriteAuthorizationRequired",
    "explicitQuestionTargetRequired",
    "humanConfirmationRequired",
    "optimisticConcurrencyRequired",
    "tenantIsolation",
    "duplicatePromotionRejected",
    "exactlyOneProjectVersionCreated",
    "immutableSourceProvenancePersisted",
    "reviewerAndPromoterIdentityPersisted",
    "appendOnlyPromotionReceipt",
    "readyForSubmissionRemainsFalse",
  ],
  "La preuve de promotion explicite vers le canonique est incomplète.",
);
assertValidation(
  evidenceValidation,
  "POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION_V1",
  [
    "binaryAndMetadataTrackedTogether",
    "quarantinedPendingPersisted",
    "cleanScanDoesNotAutoRelease",
    "explicitReleasePersisted",
    "releasedBinaryDigestPreserved",
    "metadataReadTenantScoped",
    "crossTenantReadBlockedByRls",
    "importStagingCleanEvidenceCompatible",
    "productionReadinessNotClaimed",
  ],
  "La preuve du store d'evidence PostgreSQL est incomplète.",
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

const importEvidence = `- staging PostgreSQL tenant-scopé : \`IMPLEMENTED_AND_TESTED\` ;
- listing read-only tenant-scopé : \`PASS\` ;
- preuve source CLEAN exigée : \`PASS\` ;
- liaison projet/version/preuve/SHA : \`PASS\` ;
- revue humaine persistée avec identité : \`PASS\` ;
- seconde décision sur une valeur revue : \`REJECTED\` ;
- promotion canonique : \`EXPLICIT_ONLY\` ;
- rôle \`ANSWER_WRITE\` requis : \`PASS\` ;
- cible de question choisie explicitement : \`PASS\` ;
- concurrence optimiste \`expectedVersion\` : \`PASS\` ;
- reçu de promotion : \`APPEND_ONLY\` ;
- promotion automatique : \`FORBIDDEN\` ;
- \`ready_for_submission\` : \`false\`.`;

const evidenceEvidence = `- upload : \`QUARANTINE_ONLY\` ;
- métadonnées : PostgreSQL + RLS tenant ;
- octets : store binaire privé derrière abstraction ;
- scan CLEAN : ne libère jamais automatiquement ;
- release : acte séparé et explicite ;
- lecture metadata : tenant-scopée ;
- compatibilité avec le staging import : \`PASS\` ;
- verdict antivirus fourni par navigateur : \`FORBIDDEN\` ;
- stockage objet/KMS/antivirus de production : \`NOT_PROVISIONED\` ;
- prétention production-ready : \`FORBIDDEN\`.`;

const blocks = {
  "STATUS.md": `## PostgreSQL, preuves et import gouverné — état 2026-08-19

${projectEvidence}

### Import prospectus

${importEvidence}

### Preuves documentaires

${evidenceEvidence}

Le flux applicatif est désormais : upload en quarantaine → scan serveur de confiance → release explicite → extraction vers staging non vérifié → revue humaine → promotion canonique explicite et versionnée. Aucune étape ne rend le dossier prêt pour soumission.`,

  "LOOP_STATE.md": `## LOOP-DEV-001 — Persistance, preuves et import gouverné

${projectEvidence}

${importEvidence}

${evidenceEvidence}

- activation automatique de données extraites : \`FORBIDDEN\` ;
- promotion automatique vers les réponses projet : \`FORBIDDEN\` ;
- soumission : \`DISABLED\`.`,

  "CURRENT_ITERATION.md": `## Résultat — chaîne preuve → staging → revue → promotion

Les repositories projet, preuves et import sont validés sur PostgreSQL 17 en CI, avec séparation explicite des responsabilités et RLS tenant.

${projectEvidence}

${importEvidence}

${evidenceEvidence}

Prochaine tranche autonome : durcir l’idempotence des transitions de preuve, enrichir les validations E2E/accessibilité et poursuivre les adaptateurs d’infrastructure sans jamais simuler les services de production absents.`,

  "WORK_LOG.md": `## 2026-08-19 — Fermeture de la chaîne preuve/import

1. Persistance du listing read-only import dans une validation machine.
2. Store preuve PostgreSQL synchronisé avec le store binaire.
3. Métadonnées de preuve tenant-scopées et non sensibles côté API.
4. Release explicite séparée du scan CLEAN.
5. API projet sans UUID technique fourni par le navigateur.
6. Workspace Preuves : upload, états, release et extraction.
7. Promotion canonique explicite avec \`ANSWER_WRITE\`, cible humaine et \`expectedVersion\`.
8. Promotion automatique et soumission maintenues interdites.

${evidenceEvidence}

${importEvidence}`,

  "SUIVI.md": `## 2026-08-19 — Chaîne preuve/import gouvernée

Le parcours applicatif de preuve et d’import est maintenant relié de bout en bout au runtime PostgreSQL sans contourner le canonique.

${evidenceEvidence}

${importEvidence}

Les dépendances production (stockage objet, KMS/secrets, antivirus réel, OIDC réel, observabilité et sauvegarde/restauration cible) restent explicitement externes et ne doivent jamais être simulées comme opérationnelles.`,

  "TODO.md": `## Import et preuves — état courant

- [x] Upload PDF/DOCX uniquement en quarantaine.
- [x] Métadonnées de preuve persistées en PostgreSQL sous RLS.
- [x] Interdire tout verdict antivirus fourni par le navigateur.
- [x] Exiger un scan CLEAN avant release.
- [x] Séparer scan CLEAN et release explicite.
- [x] Lire les métadonnées sans exposer références de stockage/KMS.
- [x] Exposer le staging via factory runtime et API gouvernée.
- [x] Construire l’écran de revue des propositions importées.
- [x] Construire l’espace projet Preuves.
- [x] Ajouter le listing read-only tenant-scopé des imports.
- [x] Promouvoir une valeur confirmée uniquement par commande explicite \`ANSWER_WRITE\` + cible + \`expectedVersion\`.
- [x] Persister un reçu de promotion append-only.
- [ ] Durcir l’idempotence/recovery de la release en cas de panne entre store binaire et commit PostgreSQL.
- [ ] Ajouter des E2E navigateur et contrôles d’accessibilité.
- [ ] Configurer stockage objet privé de production.
- [ ] Configurer antivirus réel et workflow de scan serveur.
- [ ] Configurer KMS/secrets/chiffrement de production.
- [ ] Configurer OIDC réel, monitoring et sauvegarde/restauration de la cible.`,

  "CHANGELOG.md": `## [Unreleased] — Chaîne preuve/import gouvernée — 2026-08-19

### Added

- store de preuve suivi en PostgreSQL ;
- lecture metadata tenant-scopée ;
- API de release explicite ;
- API projet de preuves sans UUID de version client ;
- workspace projet Preuves ;
- validation persistée du listing import ;
- promotion explicite vers une réponse avec reçu append-only.

### Security

- aucun verdict antivirus navigateur ;
- aucune référence de stockage/KMS exposée par l’API metadata ;
- scan CLEAN distinct de la release ;
- RLS tenant sur preuves/imports ;
- promotion automatique interdite ;
- \`ready_for_submission=false\` maintenu.`,

  "HANDOFF.md": `## Transmission — chaîne preuve/import gouvernée

Fichiers prioritaires :

- \`apps/web/src/server/evidence/postgres-tracked-evidence-store.ts\` ;
- \`apps/web/src/server/evidence/postgres-tracked-evidence-store.integration.ts\` ;
- \`apps/web/src/server/evidence/evidence-descriptor-service.ts\` ;
- \`apps/web/src/server/import/postgres-import-staging-repository.ts\` ;
- \`apps/web/src/server/import/postgres-import-promotion-repository.ts\` ;
- \`apps/web/src/components/organisms/EvidenceWorkspacePanel.tsx\` ;
- \`apps/web/src/components/organisms/ImportStagingReviewPanel.tsx\`.

${evidenceEvidence}

${importEvidence}

Ne jamais transformer une confirmation d’extraction ou un scan CLEAN en activation, promotion ou soumission implicite.`,

  "docs/ARCHITECTURE.md": `## Chaîne preuve et import prospectus

La preuve binaire et ses métadonnées sont séparées : le store binaire conserve les octets privés tandis que PostgreSQL porte les métadonnées, la portée tenant, le SHA et les états de cycle de vie. Le staging import n’accepte qu’une preuve réellement CLEAN. Les valeurs extraites restent non vérifiées jusqu’à revue humaine et la promotion vers le canonique reste une commande distincte, autorisée, versionnée et auditée.

${evidenceEvidence}

${importEvidence}`,

  "apps/web/README.md": `## Preuves et imports gouvernés

Le runtime PostgreSQL expose un store de preuve tenant-scopé, un staging import, un listing read-only, une revue humaine et une promotion explicite.

${evidenceEvidence}

${importEvidence}

Le mode local-json ne simule ni OIDC, ni scanner, ni KMS, ni object store de production.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-POSTGRES-REPOSITORY-V1", markdown);
}

console.log(JSON.stringify({
  updatedDocuments: Object.keys(blocks).length,
  projectRepository: projectValidation.status,
  importStaging: importValidation.status,
  importListing: importQueryValidation.status,
  importPromotion: promotionValidation.status,
  evidenceStore: evidenceValidation.status,
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
