# Prospectus Composer Web

Application Next.js construite selon Atomic Design pour le questionnaire, les contrôles, l’aperçu et la génération d’un projet de prospectus OPCVM/FCP UMOA.

## Architecture Atomic Design

- `components/atoms` : boutons, badges, champs, icônes, progression.
- `components/molecules` : statistiques, lignes de navigation, questions, alertes.
- `components/organisms` : shell applicatif, navigation, wizard, résumé de contrôles, aperçu.
- `components/templates` : compositions de pages sans logique métier spécifique.
- `app` : routes Next.js App Router et Route Handlers.
- `domain` : types, catalogue de questions et logique de progression.
- `server` : persistance locale versionnée et adaptateur de génération.

## Commandes

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Limite

La persistance JSON est locale et réservée au prototype. Elle ne constitue ni une base de production, ni un mécanisme sécurisé de multi-tenant, ni un dispositif de soumission réglementaire.

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Génération documentaire

`POST /api/projects/{projectId}/generate` construit le snapshot canonique puis exécute `src/cli/generate-from-web-snapshot.js`. Le compositeur historique génère le modèle, le Markdown, la concordance, les contrôles et le DOCX déterministe.

Les artefacts sont enregistrés sous `.local-data/projects/{projectId}/generations/{generationId}/`. Cette persistance est locale et ne constitue pas une architecture de production.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## Classes de parts structurées

La question `Q_SHARE_CLASSES_COUNT` utilise maintenant un éditeur de collection. L’API rejette les identifiants dupliqués et les lignes incomplètes, migre les anciennes valeurs booléennes et écrit les données validées dans `canonicalData.share_classes[]`.

Le comportement est couvert par le test HTTP du flux de génération complet.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## Collections structurées V1

Le questionnaire expose désormais dix collections canoniques éditables. L’API normalise et valide chaque ligne, rejette les doublons et incohérences, puis alimente directement le snapshot consommé par le compositeur documentaire.

- collections structurées testées : `10` ;
- classes de parts : `share_classes[]` ;
- fourchettes d’allocation : `investment_policy.asset_class_ranges[]` ;
- frais transactionnels : `fees.transaction[]` ;
- rémunérations : `remunerations[]` ;
- méthodes de valorisation : `valuation.methods[]` ;
- gouvernance : `manager.governance_members[]` ;
- intervenants : `service_providers[]` ;
- risques : `risks[]` ;
- dispositifs pays : `distribution_countries[]` ;
- justificatifs : `evidence[]` ;
- repli de ces collections dans `_repeating` : `REMOVED` ;
- test HTTP complet : `PASS` ;
- compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:END -->

<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:START -->
## Stockage et contrat canonique

Les routes et pages utilisent l’interface `ProjectRepository`. `REGULATORY_STORAGE_DRIVER` vaut `local-json` par défaut. La valeur `postgresql` échoue explicitement jusqu’à l’activation d’un adaptateur transactionnel revu et testé.

- contrat : `PROSPECTUS_CANONICAL_MODEL_V1.schema.json` ;
- standard : JSON Schema draft 2020-12 ;
- collections structurées couvertes : `10` ;
- tables PostgreSQL : `25` ;
- tables avec RLS activée : `18` ;
- politiques tenant : `18` ;
- versions gelables : `IMPLEMENTED` ;
- audit append-only : `IMPLEMENTED` ;
- soumission verrouillée à `false` : `IMPLEMENTED` ;
- migration exécutée sur PostgreSQL éphémère en CI : `PASS` ;
- stockage actif dans l’application : `local-json` ;
- adaptateur PostgreSQL applicatif : `NOT_ACTIVATED`.
<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:END -->

<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:START -->
## Adaptateur PostgreSQL

`createPostgresProjectRepository` implémente le même contrat que le driver JSON local. Il exige un pool, un fournisseur d’identité vérifiée et un store d’artefacts.

- dépôt PostgreSQL : `IMPLEMENTED_AND_TESTED` ;
- identité serveur vérifiée exigée : `true` ;
- appartenance à l’organisation exigée : `true` ;
- isolation de deux tenants : `PASS` ;
- version créée à chaque écriture : `PASS` ;
- conflit de concurrence optimiste : `PASS` ;
- snapshot canonique par version : `PASS` ;
- collections normalisées synchronisées : `PASS` ;
- métadonnées documentaires persistées : `PASS` ;
- artefacts staged puis commit : `PASS` ;
- chaîne d’audit SHA-256 : `PASS` ;
- versions observées dans le test : `4` ;
- snapshots observés : `5` ;
- événements d’audit : `5` ;
- `ready_for_submission` : `false`.

La CI utilise une identité fixe uniquement lorsque `NODE_ENV=test`.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->
