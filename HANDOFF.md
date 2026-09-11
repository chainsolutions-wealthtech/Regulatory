# HANDOFF — Transmission de LOOP-DEV-001

<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:START -->
## Handoff courant — réconciliation 2026-08-13

`LOOP-GOV-002` est clôturée avec le statut `CLOSED_OBJECTIVE_COMPLETE`.

Un nouvel agent doit reprendre depuis `00_START_HERE.md` et `GOVERNANCE.md`, rester sur `main`, vérifier le HEAD et les CI du SHA qu’il traite, puis continuer sans créer de branche.

Ce chantier a renforcé la gouvernance **et** réparé une dette CI préexistante sans retirer les capacités legacy ni affaiblir le déterminisme PDF.

- branche canonique : `main` ;
- HEAD source vérifié par la boucle : `0ef950c1cf446c78bf902672631fda8b7c8ed384` ;
- date du HEAD source : `2026-09-11` ;
- run Regulatory CI : `34631652716` ;
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

Point de reprise exact : acquisition institutionnelle non indexée de `CM/10/06/2022`, puis comparaison 2016 ↔ 2022.
<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:END -->

> **Statut :** `READY_FOR_CONTINUATION`  
> **Boucle :** `LOOP-DEV-001` — `IN_PROGRESS`  
> **Date :** `2026-08-05`

## Contexte

Le propriétaire a demandé de commencer le code afin de construire le prospectus automatiquement et de le préremplir avec les informations déjà disponibles.

La branche unique `main` a été conservée. Aucun historique, identifiant réglementaire, matrice ou schéma existant n’a été supprimé ou renommé.

## Ce qui fonctionne

```bash
npm test
npm run generate:sample
npm run check
```

Résultat local contrôlé : `7/7` tests réussis.

Le moteur :

- charge les 62 lignes des matrices CIRC005 ;
- construit le catalogue de questions ;
- contrôle les champs qu’une réponse peut renseigner ;
- enrichit les risques de manière déterministe ;
- exécute les règles ;
- sélectionne les clauses DRAFT ;
- produit 29 composants ;
- rend le prospectus Markdown ;
- produit une concordance de 62 lignes ;
- calcule les empreintes et le manifeste.

## Résultat du cas d’exemple

- 46 exigences dans le prospectus ;
- 1 exigence non applicable ;
- 15 exigences manquantes ;
- 0 blocage ;
- 2 avertissements ;
- `ready_for_compliance_review: false` ;
- `ready_for_submission: false`.

## Fichiers prioritaires

1. `IMPLEMENTATION.md`
2. `CURRENT_ITERATION.md`
3. `NEXT_ACTION.md`
4. `examples/generated/united-capital-diamond/generation-manifest.json`
5. `src/core/generation-service.js`
6. `src/core/prospectus-composer.js`
7. `src/catalog/clause-catalog.js`
8. `src/catalog/rules.js`
9. `test/`

## Limites à respecter

- aucune clause n’est `APPROVED` ou `ACTIVE` ;
- le Markdown généré est un projet de pré-conformité ;
- le cas United Capital Diamond n’est pas la norme ;
- les 15 manques ne doivent pas être masqués par des `NOT_APPLICABLE` artificiels ;
- la fiscalité et le point 5.3 nécessitent une revue ;
- le DOCX et le PDF restent à développer ;
- `LOOP-REG-001` est suspendue, pas clôturée.

## Prochaine action

Exécuter uniquement `NEXT_ACTION.md` et conserver la branche `main`.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## Transmission V0.2

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

Fichiers prioritaires :

- `src/core/circ005-completeness-extension.js` ;
- `examples/generated/united-capital-diamond/generation-manifest.json` ;
- `examples/generated/united-capital-diamond/concordance.json` ;
- `examples/generated/united-capital-diamond/control-report.json` ;
- `test/circ005-completeness-extension.test.js`.

Ne jamais convertir les exigences en attente en informations validées sans pièce, source et revue compétente.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## Transmission DOCX V0.1

- DOCX : `prospectus-draft.docx` ;
- taille : `13208` octets ;
- empreinte SHA-256 : `673b075cbe8cb31fb9418bc7157af7bbed1f882c53e41627f4d61910f523aa95` ;
- composants tracés : `44` ;
- lignes de traçabilité : `44` ;
- tableaux OOXML : `9` ;
- pages rendues pour contrôle visuel : `10` ;
- statut : `DRAFT_PRE_COMPLIANCE_REVIEW` ;
- prêt pour soumission : `false`.

Fichiers prioritaires :

- `scripts/generate_docx.py` ;
- `scripts/validate_docx.py` ;
- `examples/generated/united-capital-diamond/prospectus-draft.docx` ;
- `examples/generated/united-capital-diamond/docx-manifest.json` ;
- workflow `.github/workflows/ci.yml`.

Le rendu PDF/PNG est un outil de contrôle, non le moteur PDF final.
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
## Transmission — Application de pré-conformité / état 2026-08-17

### Entrées applicatives principales

- `apps/web/src/app` ;
- `apps/web/src/components` ;
- `apps/web/src/domain` ;
- `apps/web/src/server` ;
- `apps/web/src/server/storage/project-version-repository.ts` ;
- `apps/web/src/server/project-version-diff.ts` ;
- `docs/04-development/PROJECT_VERSION_HISTORY.md`.

### Vérifications obligatoires avant reprise

Exécuter les gates Regulatory CI et Security/Review Policy CI. Ne considérer aucun service externe de production comme disponible sans configuration et preuve runtime réelles.

### Limite de reprise

Ne pas activer de clause, ne pas marquer un dossier prêt pour soumission, ne pas simuler une validation juridique/conformité/fiscale et ne pas déployer sans recette et autorisation humaines explicites.
<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Transmission — compositeur documentaire web V0.1

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

Fichiers prioritaires :

- `src/adapters/web-canonical-snapshot-adapter.js` ;
- `src/cli/generate-from-web-snapshot.js` ;
- `apps/web/src/server/canonical-snapshot.ts` ;
- `apps/web/src/server/generation-adapter.ts` ;
- `apps/web/src/server/project-store.ts` ;
- `apps/web/src/app/api/projects/[projectId]/generate/route.ts` ;
- `test/web-canonical-snapshot-adapter.test.js` ;
- `scripts/test-web-api.mjs` ;
- `regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json`.

Ne jamais réintroduire une génération spéciale réservée à United Capital Diamond. Ne jamais supprimer une réponse non mappée sans décision et journalisation explicites.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## Transmission — Collections canoniques V1

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

Fichiers prioritaires :

- `apps/web/src/domain/structured-answers.ts` ;
- `apps/web/src/components/molecules/StructuredCollectionField.tsx` ;
- `apps/web/src/server/canonical-snapshot.ts` ;
- `src/adapters/web-canonical-snapshot-adapter.js` ;
- `scripts/test-web-api.mjs` ;
- `regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json`.

Ne pas considérer une ligne comme validée à cause de sa seule présence dans le snapshot.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:END -->

<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:START -->
## Transmission — Modèle canonique et PostgreSQL V1

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

Fichiers prioritaires :

- `schemas/canonical/PROSPECTUS_CANONICAL_MODEL_V1.schema.json` ;
- `docs/03-data/CANONICAL_DATA_DICTIONARY_V1.md` ;
- `database/migrations/0001_regulatory_core.sql` ;
- `database/tests/0001_regulatory_core_test.sql` ;
- `apps/web/src/server/storage/project-repository.ts` ;
- `apps/web/src/server/storage/index.ts`.

Ne pas sélectionner `REGULATORY_STORAGE_DRIVER=postgresql` avant l’implémentation et la revue de l’adaptateur.
<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:END -->

<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:START -->
## Transmission — chaîne preuve/scanner/import gouvernée

Fichiers prioritaires :

- `apps/web/src/server/evidence/postgres-tracked-evidence-store.ts` ;
- `apps/web/src/server/evidence/evidence-binary-store.ts` ;
- `apps/web/src/server/evidence/s3-evidence-binary-store.ts` ;
- `apps/web/src/server/evidence/postgres-evidence-scan-queue.ts` ;
- `apps/web/src/server/evidence/evidence-scan-queue-worker.ts` ;
- `apps/web/src/server/evidence/http-attestation-scanner.ts` ;
- `apps/web/src/server/evidence/evidence-scan-release-service.ts` ;
- `apps/web/src/server/security/oidc-identity-provider.ts` ;
- `database/migrations/0009_evidence_scan_leases.sql` ;
- `database/tests/0003_evidence_scan_lease_test.sql`.

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

Ne jamais transformer un scan CLEAN, une confirmation d’extraction, une configuration d'infrastructure ou une preuve CI locale en release, promotion, production readiness ou soumission implicite.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->
