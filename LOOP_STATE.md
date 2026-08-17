# LOOP_STATE — État persistant de la boucle

<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:START -->
## LOOP-GOV-002 — Réconciliation de gouvernance et non-régression

- statut : `CLOSED_OBJECTIVE_COMPLETE` ;
- branche : `main` ;
- branche créée : `NO` ;
- PR de travail créée : `NO` ;
- suppression documentaire : `NO` ;
- politique : `IMPROVEMENT_ONLY + ZERO_REGRESSION` ;
- prochaine action métier/réglementaire préservée : récupération du binaire institutionnel `CM/10/06/2022` ;
- visibilité GitHub actuellement observée : `public`, visibilité souhaitée par le propriétaire : `TO_VERIFY`.

- branche canonique : `main` ;
- HEAD source vérifié par la boucle : `66dac285498f868cf38c1bfb8efa0525f033af21` ;
- date du HEAD source : `2026-08-17` ;
- run Regulatory CI : `32061607838` ;
- validation API CIRC005 : `PASS` ;
- compatibilité descendante des 10 collections structurées : `PASS` ;
- persistance canonique des anciens payloads : `PASS` ;
- reproductibilité PDF après normalisation fixe des métadonnées LibreOffice, dont `/DocChecksum` : `PASS` ;
- dépôt PostgreSQL transactionnel : `PASS` ;
- `ready_for_submission` : `false` ;
- dépendances externes Instruction 66 : `49` occurrences, `33` résolues documentairement, `16` non résolues ;
- circulaires : `34` total, `25` résolues, `9` non résolues ;
- instructions génériques : `7` total, `5` résolues, `2` non résolues ;
- activation réglementaire automatique : `FORBIDDEN` ;
- revues juridique et conformité : `PENDING`.
<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:END -->

> **Statut :** `APPLICABLE`

## Boucle active

- Loop : `LOOP-DEV-001`
- Tâche : `TASK-DEV-001 — Construire la première tranche verticale du Prospectus Composer`
- Type : développement applicatif et preuve exécutable
- État : `IN_PROGRESS`
- Date d’ouverture : `2026-08-05`
- Branche conservée : `main`
- Commit de départ : `a2a7d0a26802169a859b5bf02ca5e88798f483a8`
- Création ou changement de branche : interdit et non réalisé

## Boucle réglementaire suspendue

- Loop : `LOOP-REG-001`
- État : `PAUSED_BY_OWNER_PRIORITY`
- Motif : démarrage explicite du code demandé par le propriétaire
- Travail préservé : source et plan d’atomisation de l’Instruction n°66
- Reprise obligatoire : matérialisation, empreinte, index des articles, versions et crosswalk

## Objectif actif

Rendre exécutable la chaîne suivante sans casser les sources existantes :

```text
matrices CIRC005
+ données préchargées
+ réponses structurées
→ données canoniques
→ contrôles
→ clauses DRAFT
→ composants documentaires
→ prospectus de travail
→ concordance
→ manifeste
```

## Sorties disponibles

- `package.json` ;
- `IMPLEMENTATION.md` ;
- `src/adapters/circ005-matrix-loader.js` ;
- moteur de questionnaire, conditions, règles, clauses et composition ;
- fixture United Capital Diamond ;
- sorties générées sous `examples/generated/united-capital-diamond/` ;
- tests sous `test/` ;
- `ADR-0008`.

## Contrôles locaux

- tests : `7/7 PASS` ;
- exigences chargées : `62` ;
- questions applicables dans le cas : `58` ;
- composants générés : `29` ;
- exigences couvertes : `46` ;
- non applicables : `1` ;
- manquantes : `15` ;
- blocages : `0` ;
- avertissements : `2` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.

## Invariants

- conserver les identifiants `CIRC005_*` ;
- lire les matrices existantes au lieu de les recopier ;
- ne jamais transformer une fixture en règle normative ;
- ne jamais présenter une clause DRAFT comme approuvée ;
- conserver `ready_for_submission: false` avant les validations formelles ;
- produire des sorties déterministes pour un même snapshot ;
- ne pas créer de branche.

## Condition de reprise de LOOP-REG-001

La boucle réglementaire sera reprise après la tranche de couverture standard ou plus tôt si une règle d’implémentation dépend d’un article non atomisé de l’Instruction n°66.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## État V0.2 de LOOP-DEV-001

- objectif intermédiaire `15 → 0 MISSING` : `ACHIEVED` ;
- exigences en attente de revue : `20` ;
- génération déterministe : activée ;
- branche conservée : `main` ;
- soumission : interdite ;
- prochaine tranche : export DOCX déterministe de pré-conformité.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## État DOCX de LOOP-DEV-001

- générateur OOXML déterministe : `IMPLEMENTED` ;
- validateur structurel : `IMPLEMENTED` ;
- rendu LibreOffice de contrôle : `IMPLEMENTED_IN_CI` ;
- nombre de pages de contrôle : `10` ;
- soumission : `FORBIDDEN` ;
- prochaine tranche : API locale et questionnaire progressif.
<!-- AUTO:LOOP-DEV-001-DOCX:END -->

<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:START -->
## État applicatif de LOOP-DEV-001 — 2026-08-17

- Next.js App Router : `IMPLEMENTED` ;
- Atomic Design : `IMPLEMENTED` ;
- catalogue/questionnaire : `IMPLEMENTED` ;
- PostgreSQL transactionnel : `IMPLEMENTED_AND_TESTED` ;
- RLS multi-tenant : `PASS_CI` ;
- OIDC : `IMPLEMENTED_CONFIGURATION_REQUIRED` ;
- RBAC/workflow : `PASS_CI` ;
- DOCX/PDF/ZIP : `PASS_CI` ;
- import sécurisé : `IMPLEMENTED_GATED` ;
- historique/diff : `IMPLEMENTED_READ_ONLY` ;
- production : `NOT_AUTHORIZED` ;
- soumission : `DISABLED` ;
- prochaine tranche autonome : administration gouvernée des clauses/sources et industrialisation contrôlée de l'import.
<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## État de LOOP-DEV-001 après connexion au compositeur

- matrices → catalogue web : `IMPLEMENTED` ;
- API catalogue et questionnaire : `IMPLEMENTED` ;
- migration non destructive des réponses : `IMPLEMENTED` ;
- snapshot canonique versionné : `IMPLEMENTED` ;
- adaptateur snapshot → compositeur historique : `IMPLEMENTED_V0_1` ;
- génération Markdown, concordance, contrôles et DOCX par projet : `IMPLEMENTED_V0_1` ;
- persistance du bundle versionné : `IMPLEMENTED` ;
- tests unitaires et HTTP : `PASS` ;
- prochaine tranche : composants structurés pour les données répétables ;
- production et soumission : `FORBIDDEN`.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## LOOP-DEV-001 — Collections répétables

- classes de parts : `IMPLEMENTED_AND_VALIDATED` ;
- fourchettes d’allocation : `NEXT` ;
- commissions et frais : `PENDING` ;
- méthodes de valorisation : `PENDING` ;
- gouvernance et intervenants : `PENDING` ;
- documents et listes diverses : `PENDING`.

- composant dédié : `SHARE_CLASS_COLLECTION` ;
- question canonique conservée : `Q_SHARE_CLASSES_COUNT` ;
- exigence conservée : `CIRC005_1_10_FCP_PARTS_CHARACTERISTICS` ;
- validation ligne par ligne et unicité des identifiants : `PASS` ;
- migration non destructive des anciennes valeurs booléennes : `IMPLEMENTED` ;
- écriture directe dans `canonicalData.share_classes[]` : `PASS` ;
- stockage provisoire dans `_repeating.share_classes` : `REMOVED` ;
- génération par le compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## LOOP-DEV-001 — Collections répétables V1

- classes de parts : `IMPLEMENTED_AND_VALIDATED` ;
- fourchettes d’allocation : `IMPLEMENTED_AND_VALIDATED` ;
- commissions et frais : `IMPLEMENTED_AND_VALIDATED` ;
- méthodes de valorisation : `IMPLEMENTED_AND_VALIDATED` ;
- gouvernance et intervenants : `IMPLEMENTED_AND_VALIDATED` ;
- risques : `IMPLEMENTED_AND_VALIDATED` ;
- dispositifs pays : `IMPLEMENTED_AND_VALIDATED` ;
- justificatifs : `IMPLEMENTED_AND_VALIDATED` ;
- prochaine tranche : `CANONICAL_SCHEMA_AND_POSTGRESQL`.

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
## LOOP-DEV-001 — Industrialisation des données

- JSON Schema canonique : `IMPLEMENTED_AND_TESTED` ;
- dictionnaire de données : `IMPLEMENTED` ;
- migration PostgreSQL initiale : `IMPLEMENTED_AND_TESTED_IN_CI` ;
- RLS tenant : `TESTED_WITH_NON_OWNER_ROLE` ;
- interface de dépôt : `IMPLEMENTED` ;
- stockage local : `ACTIVE_FOR_PROTOTYPE` ;
- adaptateur PostgreSQL : `NEXT` ;
- authentification réelle : `PENDING`.

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
## LOOP-DEV-001 — PostgreSQL projet + staging import

- dépôt PostgreSQL projet : `IMPLEMENTED_AND_TESTED` ;
- identité serveur vérifiée : `REQUIRED` ;
- appartenance organisation : `REQUIRED` ;
- isolation multi-tenant : `PASS` ;
- version par écriture : `PASS` ;
- concurrence optimiste : `PASS` ;
- snapshot canonique : `PASS` ;
- chaîne d’audit SHA-256 : `PASS` ;
- `ready_for_submission` : `false`.

- migration : `database/migrations/0006_import_staging.sql` ;
- staging PostgreSQL tenant-scopé : `IMPLEMENTED_AND_TESTED` ;
- preuve source CLEAN exigée : `PASS` ;
- liaison projet/version/preuve/SHA : `PASS` ;
- RLS tenant : `PASS` ;
- réutilisation cross-tenant d’une preuve : `REJECTED` ;
- revue humaine persistée avec identité : `PASS` ;
- seconde décision sur une valeur revue : `REJECTED` ;
- source extraite après staging : `IMMUTABLE` ;
- `canonical_write_allowed` : `false` verrouillé en base ;
- `ready_for_submission` : `false` verrouillé en base.

- activation automatique de données extraites : `FORBIDDEN` ;
- copie automatique vers les réponses projet : `FORBIDDEN` ;
- soumission : `DISABLED`.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->
