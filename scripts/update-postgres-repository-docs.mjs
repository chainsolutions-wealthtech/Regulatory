import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validation = JSON.parse(
  await readFile(
    path.join(repoRoot, "regulatory/validation/POSTGRESQL_REPOSITORY_VALIDATION.json"),
    "utf8",
  ),
);

const requiredChecks = [
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
if (
  validation.status !== "PASS" ||
  validation.validationId !== "POSTGRESQL_PROJECT_REPOSITORY_VALIDATION_V1" ||
  requiredChecks.some((check) => validation.checks?.[check] !== true)
) {
  throw new Error("La preuve du dépôt PostgreSQL transactionnel est incomplète.");
}

const evidence = `- dépôt PostgreSQL : \`IMPLEMENTED_AND_TESTED\` ;
- identité serveur vérifiée exigée : \`true\` ;
- appartenance à l’organisation exigée : \`true\` ;
- isolation de deux tenants : \`PASS\` ;
- version créée à chaque écriture : \`PASS\` ;
- conflit de concurrence optimiste : \`PASS\` ;
- snapshot canonique par version : \`PASS\` ;
- collections normalisées synchronisées : \`PASS\` ;
- métadonnées documentaires persistées : \`PASS\` ;
- artefacts staged puis commit : \`PASS\` ;
- chaîne d’audit SHA-256 : \`PASS\` ;
- versions observées dans le test : \`${validation.metrics.projectVersions}\` ;
- snapshots observés : \`${validation.metrics.snapshots}\` ;
- événements d’audit : \`${validation.metrics.auditEvents}\` ;
- \`ready_for_submission\` : \`false\`.`;

const blocks = {
  "STATUS.md": `## Dépôt PostgreSQL transactionnel — V1

${evidence}

L’adaptateur est testé sur PostgreSQL éphémère avec une identité fixe exclusivement réservée à la CI. Le driver actif de l’application reste \`local-json\` tant qu’un fournisseur d’identité réel, un stockage d’artefacts sécurisé et une revue d’exploitation ne sont pas configurés.`,

  "LOOP_STATE.md": `## LOOP-DEV-001 — Dépôt PostgreSQL V1

- interface \`ProjectRepository\` : \`STABLE_V1\` ;
- adaptateur PostgreSQL : \`IMPLEMENTED_AND_TESTED\` ;
- verrouillage de projet : \`FOR UPDATE\` ;
- concurrence : \`OPTIMISTIC_VERSION_CHECK\` ;
- transaction réponse → version → snapshot → collections → audit : \`PASS\` ;
- génération → snapshot → documents → audit : \`PASS\` ;
- activation par défaut : \`FORBIDDEN\` ;
- prochaine tranche historique de cette preuve : \`AUTHENTICATION_RBAC_AND_REVIEW_WORKFLOW\`.

${evidence}`,

  "CURRENT_ITERATION.md": `## Résultat — Adaptateur PostgreSQL transactionnel

${evidence}

Deux écritures concurrentes avec la même version attendue ont été lancées : une seule a été validée et la seconde a reçu \`PROJECT_VERSION_CONFLICT\`. Les données d’organisations différentes restent invisibles entre tenants.`,

  "WORK_LOG.md": `## 2026-08-05 — Adaptateur PostgreSQL transactionnel

1. Ajout du pool PostgreSQL et des contrats d’identité vérifiée.
2. Ajout d’un stockage d’artefacts staged pour les tests et le développement.
3. Implémentation de la création, lecture, liste, réponse et génération.
4. Création d’une nouvelle version à chaque réponse.
5. Verrouillage \`FOR UPDATE\` et contrôle \`expectedVersion\`.
6. Synchronisation des snapshots et collections normalisées.
7. Chaîne d’audit SHA-256 avec lien vers l’événement précédent.
8. Test de deux organisations et de la concurrence réelle.
9. Propagation de la précondition de version dans les routes et l’interface.

${evidence}`,

  "SUIVI.md": `## 2026-08-05 — Persistance transactionnelle testée

Le moteur n’est plus limité conceptuellement au stockage JSON : un adaptateur PostgreSQL complet est disponible derrière le même port de domaine et validé sur une base éphémère.

${evidence}

L’identité fixe du test ne doit jamais être utilisée en production.`,

  "TODO.md": `## Dépôt PostgreSQL — état V1

- [x] Créer le port \`ProjectRepository\`.
- [x] Implémenter le dépôt PostgreSQL.
- [x] Exiger une identité serveur vérifiée.
- [x] Contrôler l’appartenance tenant.
- [x] Créer une version à chaque réponse.
- [x] Ajouter le contrôle optimiste de version.
- [x] Synchroniser snapshot et tables normalisées.
- [x] Persister les métadonnées des documents.
- [x] Ajouter la chaîne d’audit.
- [x] Tester deux tenants et une écriture concurrente.
- [ ] Choisir et intégrer le fournisseur d’identité.
- [ ] Implémenter le RBAC par action et objet.
- [ ] Construire les écrans et transitions de revue.
- [ ] Remplacer le stockage fichiers de test par un stockage objet sécurisé.
- [ ] Ajouter analyse antivirus, quarantaine, chiffrement et rétention.
- [ ] Ajouter gestion du pool, secrets, sauvegardes et observabilité de production.
- [ ] Réaliser les revues sécurité et exploitation avant activation.`,

  "CHANGELOG.md": `## [Unreleased] — PostgreSQL repository V1 — 2026-08-05

### Added

- adaptateur PostgreSQL transactionnel ;
- fournisseur d’identité vérifiée injecté ;
- stockage staged des artefacts ;
- versionnement par écriture ;
- contrôle optimiste de concurrence ;
- synchronisation des collections ;
- chaîne d’audit SHA-256 ;
- test d’intégration multi-tenant et concurrence.

### Changed

Les routes d’écriture peuvent transmettre \`expectedVersion\` et répondent par un conflit explicite lorsque le snapshot utilisateur est obsolète.`,

  "HANDOFF.md": `## Transmission — PostgreSQL repository V1

${evidence}

Fichiers prioritaires :

- \`apps/web/src/server/storage/postgres-project-repository.ts\` ;
- \`apps/web/src/server/storage/postgres-project-repository.integration.ts\` ;
- \`apps/web/src/server/security/verified-identity.ts\` ;
- \`apps/web/src/server/storage/artifact-store.ts\` ;
- \`regulatory/validation/POSTGRESQL_REPOSITORY_VALIDATION.json\`.

Le driver PostgreSQL ne doit pas être sélectionné tant que l’identité réelle et les secrets d’infrastructure ne sont pas configurés.`,

  "docs/ARCHITECTURE.md": `## Dépôt PostgreSQL transactionnel

Le dépôt PostgreSQL ouvre une transaction, fixe le tenant par \`SET LOCAL\`, vérifie l’appartenance, verrouille le projet, contrôle la version attendue, écrit une nouvelle version, les réponses, le snapshot, les collections et l’audit, puis valide la transaction.

${evidence}

Les artefacts sont préparés avant la transaction et finalisés après le commit. Une cible de production devra utiliser un stockage objet supportant une stratégie de compensation et de réconciliation.`,

  "apps/web/README.md": `## Adaptateur PostgreSQL

\`createPostgresProjectRepository\` implémente le même contrat que le driver JSON local. Il exige un pool, un fournisseur d’identité vérifiée et un store d’artefacts.

${evidence}

La CI utilise une identité fixe uniquement lorsque \`NODE_ENV=test\`.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-POSTGRES-REPOSITORY-V1", markdown);
}

// NEXT_ACTION.md is a human/loop-control document. Evidence refreshes must never
// replace a more recent canonical priority decided outside this historical slice.

console.log(
  JSON.stringify(
    {
      updatedDocuments: Object.keys(blocks).length,
      status: validation.status,
      projectVersions: validation.metrics.projectVersions,
      auditEvents: validation.metrics.auditEvents,
      nextActionOwnership: "PRESERVED_FROM_CANONICAL_LOOP_CONTROL",
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
