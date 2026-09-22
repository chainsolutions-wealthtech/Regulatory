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
- HEAD source vérifié par la boucle : `747a86da0df6718ab1a29ac2fc0563e0619f04b7` ;
- date du HEAD source : `2026-09-23` ;
- run Regulatory CI : `35793932665` ;
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
## LOOP-DEV-001 — Persistance, preuves et import gouverné

- dépôt PostgreSQL projet : `IMPLEMENTED_AND_TESTED` ;
- identité serveur vérifiée : `REQUIRED` ;
- appartenance organisation : `REQUIRED` ;
- isolation multi-tenant : `PASS` ;
- version par écriture : `PASS` ;
- concurrence optimiste : `PASS` ;
- snapshot canonique : `PASS` ;
- chaîne d’audit SHA-256 : `PASS` ;
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

- activation automatique de données extraites : `FORBIDDEN` ;
- promotion automatique vers les réponses projet : `FORBIDDEN` ;
- soumission : `DISABLED` ;
- production readiness sans acceptation cible : `FORBIDDEN`.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->

<!-- AUTO:LOOP-REG-001-SECONDARY-FULL-TEXT-RECOVERY-2026-09-22:START -->
## Reprise de LOOP-REG-001 — 2026-09-22

- priorité propriétaire : `LOOP-REG-001` reprise ;
- `LOOP-DEV-001` : `PAUSED_BY_OWNER_PRIORITY_PRESERVED` ;
- branche : `main` ;
- HEAD de reprise : `d19e53843a1231382d745c20153520a06e9ad100` ;
- nouvelle preuve : miroir PDF intégral secondaire de 17 pages ;
- preuve : `SECONDARY_FULL_TEXT_MIRROR_DISCOVERED_NOT_NORMATIVE` ;
- relation 2016↔2022 : `PENDING_OFFICIAL_OR_INSTITUTIONAL_BINARY_AND_HUMAN_REVIEW` ;
- sanctions/quantums : `INACTIVE` ;
- activation automatique : `FORBIDDEN` ;
- `ready_for_submission=false`.

Prochaine action unique : retrouver le même document via une archive institutionnelle en utilisant son empreinte textuelle.
<!-- AUTO:LOOP-REG-001-SECONDARY-FULL-TEXT-RECOVERY-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-CROSS-CATEGORY-SCAN-2026-09-22:START -->
## LOOP-REG-001 — résultat du scan API cross-category

- baseline d'exécution : `ac1646ad3357320a9c567f2cfe358d6bf345f211` ;
- preuve persistée : `79757d5ee1f2a18049d5075c114f8121850e5e01` après rebase sur l'état automatique courant ;
- plage : `1000000..1000300` ;
- requêtes : `301` ;
- objets : `202` ;
- erreurs : `0` ;
- témoins : `1000179 / 1000182 / 1000184 = PASS` ;
- cible exacte : `0` ;
- candidat sanctions : `1000179` uniquement ;
- résultat : `PASS / NOT_FOUND_IN_SCAN_RANGE` ;
- matérialisation binaire : `NO` ;
- sanctions/quantums : `INACTIVE` ;
- `ready_for_submission=false`.

La sous-hypothèse « objet cible présent dans la plage mais mal catégorisé » est fermée.
<!-- AUTO:LOOP-REG-001-CROSS-CATEGORY-SCAN-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-CENTIF-TARGET-LINK-DISCOVERY-2026-09-22:START -->
## Route CENTIF ciblée — 2026-09-22

Un scanner institutionnel strictement borné est préparé pour les trois pages CENTIF connues :
`www.centif.sn`, `site.centif.sn`, `jokoo.centif.sn`.

Il recherche uniquement la référence `CM/10/06/2022`, extrait l'ancre correspondante et ne suit que les URLs cible hébergées sous `*.centif.sn`. Il inspecte le type de contenu et la signature PDF sans commiter de binaire.

Statut : `PENDING_CENTIF_DISCOVERY_CI`.
<!-- AUTO:LOOP-REG-001-CENTIF-TARGET-LINK-DISCOVERY-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-CI-RACE-AND-CENTIF-TLS-2026-09-22:START -->
## Correction de la boucle — concurrence GitHub CI

- run concerné : `35780210020` ;
- validations métier/techniques avant persistance : `PASS` ;
- step fautif : `Commit generated evidence and documentation` ;
- cause : `NON_FAST_FORWARD_RACE_WITH_CONCURRENT_WORKFLOW_WRITER` ;
- régression produit : `NO` ;
- correction : retry borné avec `git pull --rebase origin main`, jamais de force-push ;
- baseline corrective : `main@20c2047623a6139bab6b178d82341540e1515deb`.

CENTIF V0.2 : TLS non vérifié autorisé uniquement pour découverte HTML ; interdit pour les octets cible. `ready_for_submission=false`.
<!-- AUTO:LOOP-REG-001-CI-RACE-AND-CENTIF-TLS-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-CI-AUTOSTASH-CENTIF-RESULT-2026-09-22:START -->
## État correctif — CENTIF et CI

CENTIF V0.2 :
- `targetStatus=REFERENCE_PRESENT_NO_TARGET_ANCHOR` ;
- `referencePageCount=3` ;
- `targetAnchorCount=0` ;
- `institutionalPdfLinkCount=0` ;
- transport HTML non vérifié : `DISCOVERY_ONLY` ;
- transport non vérifié pour binaire : `FORBIDDEN`.

Regulatory CI run `35780822213` :
- validations produit : `PASS` ;
- échec final : `REBASE_BLOCKED_BY_UNSTAGED_GENERATED_CHANGES` ;
- correction : `--autostash` sur le rebase de retry ;
- force-push : `FORBIDDEN` ;
- `ready_for_submission=false`.
<!-- AUTO:LOOP-REG-001-CI-AUTOSTASH-CENTIF-RESULT-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-BCEAO-UEMOA-ARCHIVE-DISCOVERY-2026-09-22:START -->
## Sous-boucle BCEAO/UEMOA archive discovery

- baseline : `main@3c8fd13fd5db4c026decbe0895e9a7f66edf9b1c` ;
- Regulatory CI corrective : `35781341993 = SUCCESS` ;
- objectif : détecter un lien documentaire institutionnel exposé par les pages déjà attestées ;
- scope : `3` pages autoritatives connues ;
- crawl libre : `NO` ;
- TLS : `VERIFIED_ONLY` ;
- linked document fetch : `NO` ;
- binary materialization : `NO` ;
- automatic legal inference : `FORBIDDEN` ;
- sanction activation : `FORBIDDEN` ;
- `ready_for_submission=false`.
<!-- AUTO:LOOP-REG-001-BCEAO-UEMOA-ARCHIVE-DISCOVERY-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-UEMOA-DOWNLOAD-PORTAL-2026-09-22:START -->
## Sous-boucle UEMOA download portal

Baseline : `main@21490a4f8c9a29fd5a2e26f5c7e60edea8137d58`.

Résultat BCEAO/UEMOA précédent :
- `result=PASS` ;
- `reachablePageCount=3` ;
- `sanctionsSubjectPageCount=3` ;
- `exactReferencePageCount=0` ;
- `targetDocumentCandidateCount=0` ;
- statut : `REVISION_CONTEXT_CONFIRMED_NO_TARGET_DOCUMENT_LINK`.

Nouvelle action :
- surface : `https://e-docucenter.uemoa.int/fr/telecharger-documents` et alias `www` ;
- TLS : `VERIFIED_ONLY` ;
- forms submitted : `NO` ;
- linked documents fetched : `NO` ;
- binary materialization : `NO` ;
- legal inference : `FORBIDDEN` ;
- sanction activation : `FORBIDDEN` ;
- `ready_for_submission=false`.
<!-- AUTO:LOOP-REG-001-UEMOA-DOWNLOAD-PORTAL-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-UEMOA-SEARCH-CLOSURE-2026-09-22:START -->
## État UEMOA après recherche bornée

- UEMOA download portal : `NO_TARGET_TEXT_OR_LINK_ON_DOWNLOAD_PORTAL` ;
- UEMOA exact search : `candidateCount=0` ;
- UEMOA result blocks V0.2 : `NO_TARGET_MATCH_IN_RESULT_BLOCKS` ;
- UEMOA Drupal view config : `configurationSignalPresent=true`, mais signal identifié comme bloc latéral non cible ;
- UEMOA robots : `NO_SITEMAP_DECLARED_IN_ROBOTS` ;
- binaire officiel/institutionnel cible : `NOT_RECOVERED` ;
- activation réglementaire : `FORBIDDEN` ;
- `ready_for_submission=false`.

Prochaine institution : BCEAO, à partir de la page officielle du Conseil des Ministres déjà vérifiée.
<!-- AUTO:LOOP-REG-001-UEMOA-SEARCH-CLOSURE-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-BCEAO-NATIVE-SEARCH-2026-09-22:START -->
## Sous-boucle BCEAO native search

Baseline vérifiée avant persistance : `main@5288495732e715cafb4d493c70d46c7cf81b7a64`.

Découverte du contrat :
- `result=PASS` ;
- `targetStatus=NATIVE_SEARCH_SURFACE_CANDIDATES_FOUND` ;
- formulaire sélectionné : `GET /fr/search-bceao` ;
- paramètre : `search_api_fulltext` ;
- source officielle TLS vérifiée : `YES` ;
- workflow de découverte : `READ_ONLY` ;
- repository write depuis le scanner : `NO`.

Prochaine sous-boucle : trois recherches exactes, sans suivre les liens résultats. `ready_for_submission=false`.
<!-- AUTO:LOOP-REG-001-BCEAO-NATIVE-SEARCH-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-BCEAO-EXACT-SEARCH-2026-09-22:START -->
## Sous-boucle BCEAO search semantics

Baseline : `main@8fa4764a16c43d1191dddc614e82f4b7a3fb0c19`.

BCEAO exact search :
- `result=PASS` ;
- `targetStatus=SEARCH_RESULTS_PRESENT_NO_TARGET_BLOCK` ;
- `matchedResultBlockCount=0` ;
- `exactReferenceResultBlockCount=0` ;
- `sanctionsResultBlockCount=0` ;
- résultat par requête : `26 / 8 / 26` blocs.

Interprétation : `NEGATIVE_EVIDENCE_NOT_YET_PROMOTED`.

Prochaine validation :
- témoin positif connu ;
- sentinelle négative impossible ;
- cible `CM/10/06/2022` ;
- workflow `READ_ONLY` ;
- `ready_for_submission=false`.
<!-- AUTO:LOOP-REG-001-BCEAO-EXACT-SEARCH-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-BCEAO-SEARCH-SEMANTICS-2026-09-22:START -->
## BCEAO search semantics — état final

Baseline : `main@15a30cb875a44222ac25aef859ee7d79c56cdc51`.

- workflow : `PASS` ;
- positive witness recovered : `false` ;
- negative sentinel zero blocks : `false` ;
- search semantics : `SEARCH_FILTER_SEMANTICS_NOT_VALIDATED` ;
- target interpretation : `TARGET_NOT_FOUND_BUT_SEARCH_NEGATIVE_EVIDENCE_UNRELIABLE` ;
- absence cible promue en preuve : `NO` ;
- binary materialized : `NO` ;
- sanctions/quantums : `INACTIVE` ;
- `ready_for_submission=false`.

Prochaine surface BCEAO : `robots.txt` puis uniquement sitemaps déclarés.
<!-- AUTO:LOOP-REG-001-BCEAO-SEARCH-SEMANTICS-2026-09-22:END -->
