import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectValidation = await readValidation("POSTGRESQL_REPOSITORY_VALIDATION.json");
const importValidation = await readValidation("POSTGRESQL_IMPORT_STAGING_VALIDATION.json");
const importQueryValidation = await readValidation("POSTGRESQL_IMPORT_STAGING_QUERY_VALIDATION.json");
const promotionValidation = await readValidation("POSTGRESQL_IMPORT_PROMOTION_VALIDATION.json");
const evidenceValidation = await readValidation("POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION.json");
const scanQueueValidation = await readValidation("POSTGRESQL_EVIDENCE_SCAN_QUEUE_VALIDATION.json");
const scanRetryValidation = await readValidation("POSTGRESQL_EVIDENCE_SCAN_RETRY_VALIDATION.json");

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
    "binaryStoreContainsNoRegulatoryDescriptor",
    "quarantinedPendingPersisted",
    "cleanScanDoesNotAutoRelease",
    "explicitReleasePersisted",
    "releaseRecoversAfterBinaryCommitGap",
    "releaseRetryIdempotent",
    "releasedBinaryDigestPreserved",
    "metadataReadTenantScoped",
    "crossTenantReadBlockedByRls",
    "importStagingCleanEvidenceCompatible",
    "productionReadinessNotClaimed",
    "serverScanQueueRetryBudgetBounded",
    "serverScanRetryExhaustionTerminalized",
    "serverScanRetryExhaustionDoesNotFabricateMalwareVerdict",
  ],
  "La preuve du store d'evidence PostgreSQL est incomplète.",
);
assertValidation(
  scanQueueValidation,
  "POSTGRESQL_EVIDENCE_SCAN_QUEUE_VALIDATION_V1",
  [
    "securityRoleRequired",
    "pendingClaimTransitionsToScanning",
    "scanStartedRecorded",
    "leaseRecorded",
    "activeClaimNotDuplicated",
    "expiredLeaseRecoverable",
    "attemptCountIncremented",
    "tenantIsolationEnforced",
    "noBrowserScanVerdictIntroduced",
    "readyForSubmissionRemainsFalse",
  ],
  "La preuve de la file PostgreSQL du scanner serveur est incomplète.",
);
assertValidation(
  scanRetryValidation,
  "POSTGRESQL_EVIDENCE_SCAN_RETRY_VALIDATION_V1",
  [
    "retryBudgetBounded",
    "expiredLeaseReclaimedWithinBudget",
    "retryExhaustionTerminalized",
    "technicalExhaustionMarkedError",
    "exhaustedClaimNotRequeued",
    "leaseClearedAfterTerminalization",
    "technicalFailureDoesNotFabricateMalwareVerdict",
    "invalidRetryBudgetRejected",
    "readyForSubmissionRemainsFalse",
  ],
  "La preuve du budget borné de retry scanner est incomplète.",
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
- métadonnées réglementaires : PostgreSQL + RLS tenant, source de vérité unique ;
- octets : store binaire privé derrière abstraction binary-only ;
- adaptateur filesystem : \`DEVELOPMENT_ONLY\` ;
- adaptateur S3/S3-compatible SSE-KMS : \`IMPLEMENTED_AND_TESTED\`, environnement cible non attesté ;
- scanner HTTP d’attestation server-to-server : \`IMPLEMENTED_AND_TESTED\` ;
- identité worker scanner : bearer OIDC vérifié, rôle \`SECURITY\` ;
- file PostgreSQL : \`FOR UPDATE SKIP LOCKED\` + lease récupérable + compteur d’essais ;
- budget de retries scanner : \`BOUNDED_AND_TESTED\` ;
- épuisement du budget : \`REJECTED/ERROR\`, jamais faux verdict malware ;
- séparation RBAC : \`SECURITY=EVIDENCE_SCAN\`, \`COMPLIANCE=EVIDENCE_VERIFY\` ;
- scan CLEAN : ne libère jamais automatiquement ;
- release : acte conformité séparé et explicite ;
- recovery binaire CLEAN / commit PostgreSQL manquant : \`PASS\` ;
- retry de release : \`IDEMPOTENT\` ;
- verdict antivirus fourni par navigateur : \`FORBIDDEN\` ;
- commande worker serveur : \`IMPLEMENTED\` ;
- scheduler/cron de l'environnement cible : \`NOT_PROVISIONED\` ;
- bucket/KMS/scanner/OIDC cibles : \`NOT_ATTESTED\` ;
- prétention production-ready par simple configuration : \`FORBIDDEN\` ;
- acceptation production : \`REQUIRED_EXTERNAL_BLOCKER\` ;
- \`ready_for_submission\` : \`false\`.`;

const blocks = {
  "STATUS.md": `## PostgreSQL, preuves et import gouverné — état 2026-08-20

${projectEvidence}

### Import prospectus

${importEvidence}

### Preuves documentaires et scanner serveur

${evidenceEvidence}

Le flux applicatif est désormais : upload en quarantaine → claim serveur avec lease → scan SECURITY attesté → release COMPLIANCE explicite → extraction vers staging non vérifié → revue humaine → promotion canonique explicite et versionnée. Aucune étape ne rend le dossier prêt pour soumission, et aucune configuration seule ne rend l'environnement production-ready.`,

  "LOOP_STATE.md": `## LOOP-DEV-001 — Persistance, preuves et import gouverné

${projectEvidence}

${importEvidence}

${evidenceEvidence}

- activation automatique de données extraites : \`FORBIDDEN\` ;
- promotion automatique vers les réponses projet : \`FORBIDDEN\` ;
- soumission : \`DISABLED\` ;
- production readiness sans acceptation cible : \`FORBIDDEN\`.`,

  "CURRENT_ITERATION.md": `## Résultat — chaîne preuve → scan → staging → revue → promotion

Les repositories projet, preuves, queue scanner et import sont validés sur PostgreSQL 17 en CI, avec séparation explicite des responsabilités et RLS tenant.

${projectEvidence}

${importEvidence}

${evidenceEvidence}

Les E2E navigateur, contrôles WCAG automatisés, health/readiness, headers de sécurité, smoke performance et drill PostgreSQL dump/restore disposent désormais de harnesses CI. Les prochaines actions ne doivent pas simuler les services cibles : elles concernent l'attestation/provisioning d'infrastructure et les validations humaines/réglementaires externes.`,

  "WORK_LOG.md": `## 2026-08-20 — Fermeture autonome de la chaîne preuve/scanner/import

1. Séparation définitive PostgreSQL metadata / object store binaire.
2. Adaptateur S3 privé SSE-KMS et configuration fail-closed.
3. Scanner HTTP serveur attesté sans route navigateur de verdict.
4. Séparation RBAC \`EVIDENCE_SCAN\` SECURITY / \`EVIDENCE_VERIFY\` COMPLIANCE.
5. Identité SECURITY de service via bearer OIDC vérifié.
6. Queue PostgreSQL tenant-scopée avec \`SKIP LOCKED\`, lease et recovery.
7. Budget de retries borné avec terminalisation technique sans faux verdict malware.
8. Batch worker server-only résilient aux erreurs par objet.
9. Release humaine distincte, récupérable et idempotente.
10. Readiness fail-closed : configuration production ≠ acceptation production.
11. \`ready_for_submission=false\` maintenu partout.

${evidenceEvidence}

${importEvidence}`,

  "SUIVI.md": `## 2026-08-20 — Chaîne preuve/scanner/import gouvernée

Le parcours applicatif autonome de preuve, scan et import est maintenant relié de bout en bout au runtime PostgreSQL sans contourner le canonique ni la conformité.

${evidenceEvidence}

${importEvidence}

Restent externes et non simulés : provisioning du bucket/KMS/scanner/OIDC cibles, scheduling du worker, observabilité/backup-restore de la cible, acceptation de déploiement, sources réglementaires officielles manquantes et décisions humaines.`,

  "TODO.md": `## Import, preuves et scanner — état courant

- [x] Upload PDF/DOCX uniquement en quarantaine.
- [x] Métadonnées de preuve persistées en PostgreSQL sous RLS.
- [x] Séparer strictement métadonnées réglementaires et stockage binaire.
- [x] Ajouter un adaptateur S3 privé SSE-KMS sans credentials codées en dur.
- [x] Interdire tout verdict antivirus fourni par le navigateur.
- [x] Ajouter un scanner HTTP server-to-server avec attestation stricte.
- [x] Séparer \`EVIDENCE_SCAN\` (SECURITY) et \`EVIDENCE_VERIFY\` (COMPLIANCE).
- [x] Ajouter une identité OIDC SECURITY de service vérifiée.
- [x] Ajouter une queue PostgreSQL tenant-scopée avec lease et recovery.
- [x] Borner les retries scanner et terminaliser les échecs techniques sans faux verdict malware.
- [x] Ajouter un batch worker et une commande server-only.
- [x] Exiger un scan CLEAN avant release.
- [x] Séparer scan CLEAN et release explicite.
- [x] Récupérer une release après succès binaire et échec avant commit PostgreSQL.
- [x] Rendre les retries de release idempotents.
- [x] Construire l’espace projet Preuves et la revue import.
- [x] Ajouter E2E navigateur, responsive et WCAG automatisé.
- [x] Ajouter health/readiness fail-closed, headers sécurité et smoke performance.
- [x] Ajouter un drill PostgreSQL dump/restore en CI.
- [ ] Provisionner et attester le stockage objet/KMS de production.
- [ ] Provisionner et attester le scanner antivirus réel.
- [ ] Déployer/scheduler le worker scanner sur l'environnement cible.
- [ ] Configurer et attester OIDC, monitoring, sauvegarde/restauration et alerting de la cible.
- [ ] Exécuter l'acceptation production de bout en bout sur l'environnement cible.
- [ ] Résoudre les sources réglementaires officielles encore manquantes et terminer les revues humaines.`,

  "CHANGELOG.md": `## [Unreleased] — Chaîne preuve/scanner/import gouvernée — 2026-08-20

### Added

- contrat de stockage evidence binary-only ;
- adaptateur S3 privé SSE-KMS ;
- scanner HTTP d’attestation server-to-server ;
- action RBAC \`EVIDENCE_SCAN\` séparée de \`EVIDENCE_VERIFY\` ;
- provider bearer OIDC pour identité SECURITY de service ;
- queue PostgreSQL de scan avec lease récupérable ;
- budget de retries borné et preuve machine dédiée ;
- batch worker server-only ;
- validation machine de la queue scanner ;
- readiness bloquée jusqu'à acceptation réelle de production.

### Security

- aucun verdict antivirus navigateur ;
- aucun rôle de conformité utilisé comme identité technique du scanner ;
- aucune référence de stockage/KMS exposée par l’API metadata ;
- scan CLEAN distinct de la release ;
- épuisement technique des retries distinct d'un verdict malware ;
- RLS tenant sur preuves/imports ;
- production readiness par simple configuration interdite ;
- promotion automatique et soumission interdites ;
- \`ready_for_submission=false\` maintenu.`,

  "HANDOFF.md": `## Transmission — chaîne preuve/scanner/import gouvernée

Fichiers prioritaires :

- \`apps/web/src/server/evidence/postgres-tracked-evidence-store.ts\` ;
- \`apps/web/src/server/evidence/evidence-binary-store.ts\` ;
- \`apps/web/src/server/evidence/s3-evidence-binary-store.ts\` ;
- \`apps/web/src/server/evidence/postgres-evidence-scan-queue.ts\` ;
- \`apps/web/src/server/evidence/evidence-scan-queue-worker.ts\` ;
- \`apps/web/src/server/evidence/http-attestation-scanner.ts\` ;
- \`apps/web/src/server/evidence/evidence-scan-release-service.ts\` ;
- \`apps/web/src/server/security/oidc-identity-provider.ts\` ;
- \`database/migrations/0009_evidence_scan_leases.sql\` ;
- \`database/tests/0003_evidence_scan_lease_test.sql\`.

${evidenceEvidence}

${importEvidence}

Ne jamais transformer un scan CLEAN, une confirmation d’extraction, une configuration d'infrastructure ou une preuve CI locale en release, promotion, production readiness ou soumission implicite.`,

  "docs/ARCHITECTURE.md": `## Chaîne preuve, scanner et import prospectus

PostgreSQL est la source de vérité des métadonnées réglementaires et du cycle de vie. Le store binaire ne conserve que les octets privés et une localisation technique. Le scanner automatique s'exécute sous une identité SECURITY distincte de COMPLIANCE et consomme une queue PostgreSQL à lease. Les retries sont bornés et l'épuisement technique termine l'objet en erreur sans fabriquer de verdict malware. Un résultat CLEAN reste en quarantaine jusqu'à une release explicite COMPLIANCE. Le staging import n’accepte qu’une preuve réellement CLEAN. Les valeurs extraites restent non vérifiées jusqu’à revue humaine et la promotion vers le canonique reste une commande distincte, autorisée, versionnée et auditée.

${evidenceEvidence}

${importEvidence}`,

  "apps/web/README.md": `## Preuves, scanner et imports gouvernés

Le runtime PostgreSQL expose un store de preuve tenant-scopé, un backend binaire privé, une queue de scanner server-only à retries bornés, un staging import, un listing read-only, une revue humaine et une promotion explicite.

${evidenceEvidence}

${importEvidence}

Le mode local-json ne simule ni OIDC, ni scanner, ni KMS, ni object store de production. La présence de variables d'environnement production ne vaut jamais attestation opérationnelle.`,
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
  evidenceScanQueue: scanQueueValidation.status,
  evidenceScanRetry: scanRetryValidation.status,
  productionAcceptance: "EXTERNAL_REQUIRED",
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
