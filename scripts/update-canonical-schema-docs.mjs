import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(
  await readFile(
    path.join(repoRoot, "schemas/canonical/PROSPECTUS_CANONICAL_MODEL_V1.schema.json"),
    "utf8",
  ),
);
const migration = await readFile(
  path.join(repoRoot, "database/migrations/0001_regulatory_core.sql"),
  "utf8",
);
const validation = JSON.parse(
  await readFile(
    path.join(repoRoot, "regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json"),
    "utf8",
  ),
);

if (
  schema.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
  schema.$defs?.regulatoryContext?.properties?.ready_for_submission?.const !== false ||
  validation.status !== "PASS" ||
  !migration.includes("create table regulatory.canonical_snapshots") ||
  !migration.includes("enable row level security") ||
  !migration.includes("AUDIT_EVENTS_ARE_APPEND_ONLY")
) {
  throw new Error("La preuve du modèle canonique et de la migration PostgreSQL est incomplète.");
}

const tableCount = [...migration.matchAll(/create table regulatory\./gi)].length;
const rlsTableCount = [...migration.matchAll(/enable row level security/gi)].length;
const policyCount = [...migration.matchAll(/create policy /gi)].length;
const evidence = `- contrat : \`PROSPECTUS_CANONICAL_MODEL_V1.schema.json\` ;
- standard : JSON Schema draft 2020-12 ;
- collections structurées couvertes : \`${validation.structuredCollectionCount}\` ;
- tables PostgreSQL : \`${tableCount}\` ;
- tables avec RLS activée : \`${rlsTableCount}\` ;
- politiques tenant : \`${policyCount}\` ;
- versions gelables : \`IMPLEMENTED\` ;
- audit append-only : \`IMPLEMENTED\` ;
- soumission verrouillée à \`false\` : \`IMPLEMENTED\` ;
- migration exécutée sur PostgreSQL éphémère en CI : \`PASS\` ;
- stockage actif dans l’application : \`local-json\` ;
- adaptateur PostgreSQL applicatif : \`NOT_ACTIVATED\`.`;

const blocks = {
  "STATUS.md": `## Modèle canonique et PostgreSQL — baseline V1

${evidence}

Le schéma transactionnel est testé mais non déployé. L’application utilise une interface de dépôt explicite et conserve le stockage local de démonstration tant que l’adaptateur PostgreSQL, l’identité et les contrôles d’exploitation ne sont pas activés.`,

  "LOOP_STATE.md": `## LOOP-DEV-001 — Industrialisation des données

- JSON Schema canonique : \`IMPLEMENTED_AND_TESTED\` ;
- dictionnaire de données : \`IMPLEMENTED\` ;
- migration PostgreSQL initiale : \`IMPLEMENTED_AND_TESTED_IN_CI\` ;
- RLS tenant : \`TESTED_WITH_NON_OWNER_ROLE\` ;
- interface de dépôt : \`IMPLEMENTED\` ;
- stockage local : \`ACTIVE_FOR_PROTOTYPE\` ;
- adaptateur PostgreSQL : \`NEXT\` ;
- authentification réelle : \`PENDING\`.

${evidence}`,

  "CURRENT_ITERATION.md": `## Résultat — Contrat canonique et base transactionnelle V1

${evidence}

La migration vérifie l’intégrité des fourchettes, l’unicité de l’État d’établissement, le gel des versions, l’audit non modifiable, l’isolation de deux organisations et l’interdiction de \`ready_for_submission=true\`.`,

  "WORK_LOG.md": `## 2026-08-05 — JSON Schema, PostgreSQL et abstraction de stockage

1. Publication du JSON Schema canonique V1.
2. Publication du dictionnaire de données.
3. Création de la migration PostgreSQL initiale.
4. Ajout des tables réglementaires, projets, versions, réponses, snapshots, collections, preuves, revues, documents et audit.
5. Ajout des contraintes métier, index, gel de version et audit append-only.
6. Activation de la RLS tenant et politiques associées.
7. Création d’un test PostgreSQL éphémère avec deux organisations.
8. Introduction de l’interface \`ProjectRepository\`.
9. Conservation volontaire du driver local tant que l’adaptateur PostgreSQL n’est pas sécurisé et activé.

${evidence}`,

  "SUIVI.md": `## 2026-08-05 — Baseline de persistance V1

Le projet dispose maintenant d’un contrat JSON, d’un dictionnaire et d’un schéma PostgreSQL testable. Les routes et pages passent par une interface de persistance afin d’éviter de coupler le domaine au stockage JSON local.

${evidence}

Aucune base de production, authentification ou certification de sécurité n’est déclarée.`,

  "TODO.md": `## Persistance et sécurité — état V1

- [x] Publier le JSON Schema canonique.
- [x] Publier le dictionnaire de données.
- [x] Créer la migration PostgreSQL initiale.
- [x] Normaliser les dix collections dans des tables contraintes.
- [x] Ajouter les index principaux.
- [x] Ajouter le gel des versions.
- [x] Ajouter l’audit append-only.
- [x] Ajouter la RLS par organisation.
- [x] Tester la migration et la RLS sur PostgreSQL éphémère.
- [x] Introduire l’interface de dépôt du domaine.
- [ ] Implémenter l’adaptateur PostgreSQL transactionnel.
- [ ] Implémenter l’authentification et la résolution sûre du tenant.
- [ ] Ajouter les rôles métier et autorisations d’action.
- [ ] Ajouter le stockage sécurisé des fichiers et leur quarantaine.
- [ ] Ajouter sauvegarde, restauration, observabilité et plan de retour arrière.
- [ ] Réaliser la revue d’architecture et de sécurité avant activation.`,

  "CHANGELOG.md": `## [Unreleased] — Canonical model et PostgreSQL V1 — 2026-08-05

### Added

- JSON Schema canonique V1 ;
- dictionnaire de données ;
- migration PostgreSQL multi-tenant ;
- contraintes des collections structurées ;
- RLS, gel de versions et audit append-only ;
- tests PostgreSQL éphémères ;
- interface \`ProjectRepository\` et driver local explicite.

### Security

L’activation du driver PostgreSQL échoue explicitement tant qu’aucun adaptateur sécurisé n’est injecté. Aucun repli silencieux n’est autorisé.`,

  "HANDOFF.md": `## Transmission — Modèle canonique et PostgreSQL V1

${evidence}

Fichiers prioritaires :

- \`schemas/canonical/PROSPECTUS_CANONICAL_MODEL_V1.schema.json\` ;
- \`docs/03-data/CANONICAL_DATA_DICTIONARY_V1.md\` ;
- \`database/migrations/0001_regulatory_core.sql\` ;
- \`database/tests/0001_regulatory_core_test.sql\` ;
- \`apps/web/src/server/storage/project-repository.ts\` ;
- \`apps/web/src/server/storage/index.ts\`.

Ne pas sélectionner \`REGULATORY_STORAGE_DRIVER=postgresql\` avant l’implémentation et la revue de l’adaptateur.`,

  "docs/ARCHITECTURE.md": `## Contrat de données et ports de persistance

Le domaine consomme \`ProjectRepository\` et non directement le système de fichiers. Le driver \`local-json\` sert au prototype. La cible PostgreSQL conserve à la fois le snapshot JSON exact et les collections normalisées, dans une transaction unique.

${evidence}

La RLS complète les contrôles d’autorisation applicatifs ; elle ne les remplace pas.`,

  "apps/web/README.md": `## Stockage et contrat canonique

Les routes et pages utilisent l’interface \`ProjectRepository\`. \`REGULATORY_STORAGE_DRIVER\` vaut \`local-json\` par défaut. La valeur \`postgresql\` échoue explicitement jusqu’à l’activation d’un adaptateur transactionnel revu et testé.

${evidence}`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1", markdown);
}

await writeFile(
  path.join(repoRoot, "NEXT_ACTION.md"),
  `# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** \`READY\`
> **Boucle :** \`LOOP-DEV-001\`

## Action

Implémenter l’adaptateur PostgreSQL transactionnel derrière \`ProjectRepository\`, avec injection d’un exécuteur SQL, résolution d’organisation depuis une identité serveur vérifiée, synchronisation atomique des réponses et collections, puis tests d’intégration sur PostgreSQL éphémère.

## Résultat attendu

- adaptateur PostgreSQL sans secret codé en dur ;
- pool de connexions configuré par variables d’environnement ;
- transaction par création, réponse et génération ;
- \`SET LOCAL app.current_organization_id\` issu du contexte d’identité, jamais du corps HTTP ;
- verrou optimiste ou pessimiste des versions ;
- synchronisation snapshot + tables normalisées + audit dans une transaction ;
- tests entre deux organisations et deux utilisateurs ;
- test de concurrence sur une même version ;
- aucun déploiement et aucune activation par défaut ;
- \`ready_for_submission=false\` maintenu.

## Condition d’arrêt

Ne pas simuler une authentification. Sans fournisseur d’identité et résolution de tenant vérifiables, l’adaptateur doit rester désactivé hors des tests éphémères.
`,
  "utf8",
);

console.log(
  JSON.stringify(
    {
      updatedDocuments: Object.keys(blocks).length + 1,
      tables: tableCount,
      rlsTables: rlsTableCount,
      tenantPolicies: policyCount,
      nextAction: "POSTGRESQL_TRANSACTIONAL_REPOSITORY",
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
