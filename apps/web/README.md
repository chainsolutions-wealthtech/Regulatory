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
## Preuves, scanner et imports gouvernés

Le runtime PostgreSQL expose un store de preuve tenant-scopé, un backend binaire privé, une queue de scanner server-only à retries bornés, un staging import, un listing read-only, une revue humaine et une promotion explicite.

- upload : `QUARANTINE_ONLY` ;
- métadonnées réglementaires : PostgreSQL + RLS tenant, source de vérité unique ;
- octets : store binaire privé derrière abstraction binary-only ;
- adaptateur filesystem : `DEVELOPMENT_ONLY` ;
- adaptateur S3/S3-compatible SSE-KMS : `IMPLEMENTED_AND_TESTED`, environnement cible non attesté ;
- scanner HTTP d’attestation server-to-server : `IMPLEMENTED_AND_TESTED` ;
- identité worker scanner : bearer OIDC vérifié, rôle `SECURITY` ;
- file PostgreSQL : `FOR UPDATE SKIP LOCKED` + lease récupérable + compteur d’essais ;
- budget de retries scanner : `BOUNDED_AND_TESTED` ;
- épuisement du budget : `REJECTED/ERROR`, jamais faux verdict malware ;
- séparation RBAC : `SECURITY=EVIDENCE_SCAN`, `COMPLIANCE=EVIDENCE_VERIFY` ;
- scan CLEAN : ne libère jamais automatiquement ;
- release : acte conformité séparé et explicite ;
- recovery binaire CLEAN / commit PostgreSQL manquant : `PASS` ;
- retry de release : `IDEMPOTENT` ;
- verdict antivirus fourni par navigateur : `FORBIDDEN` ;
- commande worker serveur : `IMPLEMENTED` ;
- scheduler/cron de l'environnement cible : `NOT_PROVISIONED` ;
- bucket/KMS/scanner/OIDC cibles : `NOT_ATTESTED` ;
- prétention production-ready par simple configuration : `FORBIDDEN` ;
- acceptation production : `REQUIRED_EXTERNAL_BLOCKER` ;
- `ready_for_submission` : `false`.

- staging PostgreSQL tenant-scopé : `IMPLEMENTED_AND_TESTED` ;
- listing read-only tenant-scopé : `PASS` ;
- preuve source CLEAN exigée : `PASS` ;
- liaison projet/version/preuve/SHA : `PASS` ;
- revue humaine persistée avec identité : `PASS` ;
- seconde décision sur une valeur revue : `REJECTED` ;
- promotion canonique : `EXPLICIT_ONLY` ;
- rôle `ANSWER_WRITE` requis : `PASS` ;
- cible de question choisie explicitement : `PASS` ;
- concurrence optimiste `expectedVersion` : `PASS` ;
- reçu de promotion : `APPEND_ONLY` ;
- promotion automatique : `FORBIDDEN` ;
- `ready_for_submission` : `false`.

Le mode local-json ne simule ni OIDC, ni scanner, ni KMS, ni object store de production. La présence de variables d'environnement production ne vaut jamais attestation opérationnelle.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->
