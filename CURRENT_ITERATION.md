# CURRENT_ITERATION — LOOP-DEV-001

<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:START -->
## Overlay courant — LOOP-GOV-002

Statut de `LOOP-GOV-002` : `CLOSED_OBJECTIVE_COMPLETE`.

Objectif atteint : consolider la gouvernance et synchroniser la mémoire persistante sans réécrire la baseline historique de `LOOP-DEV-001` ni les travaux de `LOOP-REG-001`.

Résultats atteints :

- gouvernance transversale `GOVERNANCE.md` ;
- `main` explicitement désignée branche canonique ;
- adaptateurs agents alignés ;
- CI préexistante en échec diagnostiquée et réparée ;
- compatibilité descendante legacy conservée et testée ;
- reproductibilité PDF renforcée sans affaiblissement du contrôle byte-for-byte ;
- prochaine action réglementaire propriétaire conservée.

- branche canonique : `main` ;
- HEAD source vérifié par la boucle : `647bc51e90ec661bb64fbee57eafc3d9017099ea` ;
- date du HEAD source : `2026-09-22` ;
- run Regulatory CI : `35784491266` ;
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

> **Statut :** `IN_PROGRESS`  
> **Ouverte le :** 2026-08-05

## Objectif

Construire la première tranche verticale exécutable du moteur de prospectus FCP/OPCVM UMOA afin de transformer les matrices réglementaires et des réponses structurées en données canoniques, contrôles, composants documentaires, prospectus de travail et table de concordance.

## Décision de priorité

Le propriétaire a demandé de commencer immédiatement le code de construction du prospectus. `LOOP-REG-001` n’est pas clôturée : elle est suspendue avec ses travaux restants préservés. La priorité active devient `LOOP-DEV-001`.

## État initial vérifié

- branche unique : `main` ;
- commit de départ : `a2a7d0a26802169a859b5bf02ca5e88798f483a8` ;
- aucun code applicatif ni `package.json` ;
- 62 exigences CIRC005 ;
- quatre matrices CSV ;
- modèle canonique architectural de 30 objets ;
- aucune clause `APPROVED` ou `ACTIVE`.

## Travail réalisé dans l’itération

- ajout d’un projet Node.js 22 sans dépendance externe ;
- chargement exécutable des quatre matrices CIRC005 ;
- création du catalogue de questions ;
- application contrôlée des réponses aux chemins canoniques ;
- création d’un moteur conditionnel initial ;
- création d’un moteur de règles initial ;
- création d’une bibliothèque de clauses DRAFT ;
- création du modèle documentaire et du compositeur Markdown ;
- création de la table de concordance et du manifeste déterministe ;
- création du cas United Capital Diamond prérempli ;
- génération de sorties de contrôle et de traçabilité ;
- ajout de sept tests automatisés ;
- résultat local : `7/7` tests réussis ;
- couverture du cas initial : `46` exigences dans le prospectus, `1` non applicable et `15` manquantes ;
- contrôles : `0` blocage, `2` avertissements ;
- statut du dossier : `DATA_INCOMPLETE` ;
- soumission : interdite.

## Périmètre restant

- couvrir les 15 exigences encore manquantes ;
- enrichir le catalogue de questions conditionnelles ;
- produire le JSON Schema canonique détaillé ;
- ajouter la persistance versionnée ;
- séparer les clauses du code vers un registre versionné ;
- ajouter le rendu DOCX puis PDF ;
- reprendre et terminer `LOOP-REG-001` pour l’Instruction n°66 ;
- obtenir les validations juridique, conformité et fiscale.

## Critères de sortie de LOOP-DEV-001

- [x] moteur exécutable sans dépendance externe ;
- [x] matrices existantes utilisées comme source ;
- [x] cas d’exemple généré ;
- [x] tests automatisés réussis localement ;
- [x] concordance produite sur les 62 exigences ;
- [ ] zéro exigence obligatoire non traitée dans le cas standard ;
- [ ] schéma canonique détaillé validé structurellement ;
- [ ] clauses externalisées et versionnées ;
- [ ] rendu DOCX déterministe ;
- [ ] rendu PDF contrôlé ;
- [ ] revue humaine du modèle et des clauses.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## Résultat de l’itération de couverture

- exigences analysées : `62` ;
- composants documentaires : `44` ;
- couvertes dans le prospectus : `40` ;
- en attente de revue : `20` ;
- manquantes : `0` ;
- non applicables : `1` ;
- métadonnées système : `1` ;
- avertissements : `7` ;
- blocages : `0` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.

L’objectif de réduction des 15 exigences `MISSING` est atteint sans faux reclassement en `NOT_APPLICABLE`. Les informations non vérifiées sont exposées comme `PENDING_REVIEW`.

Reste à collecter les preuves institutionnelles et constitutives, valider la fiscalité et le point 5.3, reprendre l’Instruction n°66/2021 et produire le DOCX déterministe.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## Résultat de l’itération DOCX

- DOCX : `prospectus-draft.docx` ;
- taille : `13208` octets ;
- empreinte SHA-256 : `673b075cbe8cb31fb9418bc7157af7bbed1f882c53e41627f4d61910f523aa95` ;
- composants tracés : `44` ;
- lignes de traçabilité : `44` ;
- tableaux OOXML : `9` ;
- pages rendues pour contrôle visuel : `10` ;
- statut : `DRAFT_PRE_COMPLIANCE_REVIEW` ;
- prêt pour soumission : `false`.

Le modèle documentaire est désormais consommable sous forme de fichier bureautique. La traçabilité reste incluse dans le document et dans `docx-manifest.json`. Le PDF de CI est seulement un support d’inspection visuelle.
<!-- AUTO:LOOP-DEV-001-DOCX:END -->

<!-- AUTO:LOOP-DEV-001-DOCX-VISUAL-QA:START -->
## Inspection visuelle DOCX clôturée — 2026-08-05

- pages rendues et inspectées : `10/10` ;
- première anomalie : puces de risques invisibles — `CORRECTED` ;
- seconde anomalie : ligne de traçabilité fractionnée entre pages — `CORRECTED` ;
- seconde inspection complète : `PASS` ;
- limitation déclarée : densité élevée de l’annexe technique, sans texte coupé ni ligne fractionnée ;
- rapport : `docs/05-quality/DOCX_VISUAL_INSPECTION_2026-08-05.md` ;
- nature du verdict : qualité structurelle et visuelle d’un document de pré-conformité, non validation juridique ou réglementaire.
<!-- AUTO:LOOP-DEV-001-DOCX-VISUAL-QA:END -->

<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:START -->
## Résultat courant — Application de pré-conformité

La tranche applicative couvre désormais le questionnaire, les contrôles, la génération déterministe, les revues humaines, PostgreSQL/RLS, la sécurité des preuves et l'historique de versions.

### Critères atteints

- App Router / Atomic Design ;
- Server Components par défaut ;
- catalogue réglementaire structuré ;
- persistance locale et PostgreSQL ;
- RLS, OIDC, RBAC et séparation des tâches ;
- DOCX/PDF/ZIP déterministes ;
- API HTTP testée ;
- import sécurisé non vérifié ;
- versions et diff read-only ;
- CI Regulatory et Security actives.

### Gates restant externes ou humains

- fournisseur OIDC réellement configuré ;
- stockage objet et antivirus réels ;
- sauvegarde/restauration ;
- recette navigateur/accessibilité/sécurité d'exploitation ;
- validation juridique, conformité et fiscale ;
- décision de production ;
- soumission réglementaire, toujours désactivée.
<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Résultat de l’itération compositeur documentaire web

- exigences chargées depuis les matrices : `62` ;
- questions réglementaires interactives : `58` ;
- questions système : `4` ;
- groupes réglementaires générés : `16` ;
- identifiants d’exigence uniques : `62` ;
- identifiants de question uniques : `62` ;
- empreinte du catalogue : `c1f288bcc865becee580e52049ea4757ecd7e1fc97fcccd3f4b61aba3089ea1b` ;
- test d’intégration API : `PASS` ;
- compositeur documentaire historique invoqué : `true` ;
- bundle documentaire complet persisté : `true` ;
- DOCX déterministe validé : `true` ;
- soumission automatique : `false`.

Le même snapshot produit le même identifiant de génération et le même document. La traçabilité relie les réponses web, leurs champs canoniques, les exigences CIRC005, les composants du modèle documentaire et les fichiers générés. `ready_for_submission` reste forcé à `false` dans le snapshot, le manifeste de génération, le manifeste DOCX et l’API.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## Résultat — Éditeur structuré des classes de parts

- composant dédié : `SHARE_CLASS_COLLECTION` ;
- question canonique conservée : `Q_SHARE_CLASSES_COUNT` ;
- exigence conservée : `CIRC005_1_10_FCP_PARTS_CHARACTERISTICS` ;
- validation ligne par ligne et unicité des identifiants : `PASS` ;
- migration non destructive des anciennes valeurs booléennes : `IMPLEMENTED` ;
- écriture directe dans `canonicalData.share_classes[]` : `PASS` ;
- stockage provisoire dans `_repeating.share_classes` : `REMOVED` ;
- génération par le compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.

Les anciennes réponses `false` et `true` restent lisibles et sont transformées respectivement en une ou deux classes par défaut lors de la construction du snapshot. Une nouvelle réponse enregistrée est obligatoirement une collection validée.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## Résultat — Dix collections canoniques structurées

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

Les contrôles couvrent notamment l’unicité des identifiants, les fourchettes `0 ≤ minimum ≤ cible ≤ maximum ≤ 100`, la cohérence des méthodes de valorisation, la présence du dépositaire, les dispositifs par pays et le statut des preuves.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:END -->

<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:START -->
## Résultat — Contrat canonique et base transactionnelle V1

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

La migration vérifie l’intégrité des fourchettes, l’unicité de l’État d’établissement, le gel des versions, l’audit non modifiable, l’isolation de deux organisations et l’interdiction de `ready_for_submission=true`.
<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:END -->

<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:START -->
## Résultat — chaîne preuve → scan → staging → revue → promotion

Les repositories projet, preuves, queue scanner et import sont validés sur PostgreSQL 17 en CI, avec séparation explicite des responsabilités et RLS tenant.

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

Les E2E navigateur, contrôles WCAG automatisés, health/readiness, headers de sécurité, smoke performance et drill PostgreSQL dump/restore disposent désormais de harnesses CI. Les prochaines actions ne doivent pas simuler les services cibles : elles concernent l'attestation/provisioning d'infrastructure et les validations humaines/réglementaires externes.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->

<!-- AUTO:LOOP-DEV-001-ENGINE-BRANCH-COVERAGE-V1:START -->
## Couverture des branches des moteurs — état courant

Validation : `ENGINE_BRANCH_COVERAGE_VALIDATION_V1` = `PASS`.

- catalogue interactif : `60` questions ;
- réponses du cas historique rejouées : `30` ;
- combinateurs/opérateurs conditionnels : `PASS` ;
- visibilité conditionnelle : `PASS` ;
- rejet des questions inconnues : `PASS` ;
- escalade d’écriture vers un chemin parent : `REJECTED` ;
- racines structurées historiques explicitement autorisées : `PASS` ;
- statuts `PASSED / PASSED_WITH_WARNINGS / VALIDATION_FAILED` : `PASS` ;
- branches allocation/rachat/suspension/frais : `PASS` ;
- warnings non bloquants : `PASS` ;
- `ready_for_submission=false` : `PASS`.

Cette preuve porte sur les branches logicielles déterministes ; elle ne remplace aucune revue juridique, conformité ou fiscale.
<!-- AUTO:LOOP-DEV-001-ENGINE-BRANCH-COVERAGE-V1:END -->

<!-- AUTO:CURRENT-STATE-RECONCILIATION-V1:START -->
## Réconciliation actuelle du projet — preuve machine

Validation : `CURRENT_STATE_RECONCILIATION_V1 = PASS`.

### Implémenté et testé

- `IMPLEMENTED_AND_TESTED` — CIRC005_62_REQUIREMENTS_MISSING_ZERO
- `IMPLEMENTED_AND_TESTED` — CANONICAL_SCHEMA_AND_DATA_DICTIONARY
- `IMPLEMENTED_AND_TESTED` — QUESTIONNAIRE_AND_ENGINE_BRANCH_COVERAGE
- `IMPLEMENTED_AND_TESTED` — DETERMINISTIC_DOCUMENT_PIPELINE
- `IMPLEMENTED_AND_TESTED` — NEXTJS_ATOMIC_DESIGN_AND_HTTP_API
- `IMPLEMENTED_AND_TESTED` — POSTGRESQL_RLS_VERSIONING_AUDIT_AND_BACKUP_RESTORE
- `IMPLEMENTED_AND_TESTED` — EVIDENCE_QUARANTINE_SCAN_QUEUE_RETRY_AND_RELEASE_SEPARATION
- `IMPLEMENTED_AND_TESTED` — IMPORT_STAGING_HUMAN_REVIEW_AND_EXPLICIT_PROMOTION
- `IMPLEMENTED_AND_TESTED` — MULTI_PROFILE_GOLDEN_MASTERS
- `IMPLEMENTED_AND_TESTED` — UMOA_STATIC_MEMBER_STATE_AND_XOF_BASELINE

### Partiel / revue obligatoire

- `PARTIAL/REVIEW_REQUIRED` — CLAUSE_LIBRARY : VERSIONED_EXECUTABLE_DRAFTS_AND_GOVERNED_PROPOSAL_LIFECYCLE; SOURCE_CATALOG_STILL_CODE; LEGAL_REVIEW_REQUIRED
- `PARTIAL/REVIEW_REQUIRED` — UMOA_REFERENCE_DATA : STATIC_MEMBER_STATE_AND_CURRENCY_BASELINE_ONLY; DYNAMIC_ACTORS_AND_CALENDARS_NOT_MATERIALIZED
- `PARTIAL/REVIEW_REQUIRED` — INSTRUCTION_66 : MATERIALIZED_AND_ATOMIZED; HUMAN_LEGAL_AND_COMPLIANCE_REVIEW_PENDING

### Bloqueurs externes ou humains

- `EXTERNAL_BLOCKER` — RECOVER_OFFICIAL_OR_INSTITUTIONAL_BINARY_CM_10_06_2022
- `EXTERNAL_BLOCKER` — PROVISION_AND_ATTEST_TARGET_INFRASTRUCTURE_AND_IDENTITY
- `EXTERNAL_BLOCKER` — RUN_TARGET_BACKUP_RESTORE_AND_PRODUCTION_ACCEPTANCE
- `EXTERNAL_BLOCKER` — COMPLETE_LEGAL_COMPLIANCE_TAX_RISK_PRODUCT_REVIEWS
- `EXTERNAL_BLOCKER` — COMPLETE_MANUAL_ACCESSIBILITY_REVIEW
- `EXTERNAL_BLOCKER` — OWNER_DECISION_ON_GITHUB_PUBLIC_VISIBILITY

`ready_for_submission=false` reste un invariant de schéma, runtime et génération. Les anciennes checklists restent des traces historiques ; ce bloc porte l’état courant attesté.
<!-- AUTO:CURRENT-STATE-RECONCILIATION-V1:END -->

<!-- AUTO:LOOP-REG-001-SECONDARY-FULL-TEXT-RECOVERY-2026-09-22:START -->
## Overlay de priorité courant — LOOP-REG-001

À la demande du propriétaire le 2026-09-22, la priorité revient à `LOOP-REG-001` pour fermer le verrou documentaire `CM/10/06/2022`.

`LOOP-DEV-001` reste intégralement préservée et devient `PAUSED_BY_OWNER_PRIORITY_PRESERVED`. Une copie PDF secondaire complète de 17 pages fournit désormais une empreinte de recherche précise, mais elle reste non normative. L'itération n'est pas close tant que le binaire officiel/institutionnel n'est pas récupéré et vérifié.
<!-- AUTO:LOOP-REG-001-SECONDARY-FULL-TEXT-RECOVERY-2026-09-22:END -->
