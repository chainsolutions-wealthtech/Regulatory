# CHANGELOG.md

Toutes les évolutions significatives du projet sont documentées dans ce fichier.

Le format s’inspire de Keep a Changelog. Le projet n’est pas encore versionné pour une utilisation en production.

## [Unreleased]

### Added — 2026-08-05

- intégration additive du kit documentaire Loop Engineering version `1.0.0` ;
- création de tous les chemins Markdown prévus par le kit, sans suppression, renommage ni déplacement des documents historiques ;
- création de `00_START_HERE.md` et `SOURCE_OF_TRUTH.md` ;
- création de `STATUS.md`, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `WORK_LOG.md`, `HANDOFF.md` et `NEXT_ACTION.md` ;
- création de `DOCUMENT_INTEGRATION_MATRIX.md`, `FILES_CATALOG.md` et `MANIFEST.md` ;
- création de l’index racine `DECISIONS.md` et de l’adaptateur `docs/03-architecture/ARCHITECTURE.md` ;
- création de sept ADR de gouvernance `ADR-0001` à `ADR-0007` ;
- création des documents de gouvernance, produit, architecture, développement, qualité, delivery, opérations, sécurité, boucle, IA, modèles et modules optionnels ;
- conservation documentaire du ZIP source sous `docs/kits/`, avec taille et empreinte SHA-256 ;
- initialisation de `LOOP-GOV-001` et `TASK-GOV-001`.

### Changed — 2026-08-05

- `README.md` documente désormais le point d’entrée Loop Engineering, la hiérarchie canonique et l’état postérieur au cadrage initial ;
- `AGENTS.md` conserve ses règles historiques et ajoute l’ordre de lecture, les registres de boucle, les modules conditionnels et les adaptateurs IA ;
- `.github/copilot-instructions.md` est aligné sur `00_START_HERE.md`, `AGENTS.md` et `SOURCE_OF_TRUTH.md` ;
- `SUIVI.md`, `TODO.md`, `STATUS.md`, `WORK_LOG.md`, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `NEXT_ACTION.md` et `HANDOFF.md` reflètent la clôture de la boucle documentaire ;
- la prochaine priorité est l’obtention d’une copie officielle et vérifiable de l’Instruction n°66/CREPMF/2021.

### Validation — 2026-08-05

- fichiers Markdown avant intégration : `11` ;
- fichiers Markdown après intégration : `194` ;
- chemins du kit présents : `176/176` ;
- fichiers créés depuis le commit de départ : `192`, dont `183` Markdown et `9` fragments d’archive ;
- fichiers du kit vides : `0` ;
- fichiers du kit limités à un titre : `0` ;
- fichiers supprimés : `0` ;
- branche conservée : `main` ;
- artefacts existants sous `regulatory/` et `schemas/` préservés ;
- aucun force-push, fusion, migration ou déploiement.

### Added — 2026-08-04

- cadrage du module de génération de prospectus OPCVM/FCP UMOA ;
- intégration fonctionnelle de la Circulaire n°05/CREPMF/2022 ;
- prise en compte de l’Instruction n°66/CREPMF/2021 comme source réglementaire majeure à atomiser ;
- définition du modèle de plateforme fondé sur une base de connaissance juridique, un moteur de questions et un moteur de composition documentaire ;
- définition des référentiels statiques à précharger ;
- définition du questionnaire conditionnel à choix multiples ;
- définition de la bibliothèque de clauses juridiques versionnées ;
- définition de la table de concordance réglementaire ;
- définition du workflow de revue humaine ;
- création des règles de contribution, de continuité et de non-régression ;
- règle interdisant la création automatique de nouvelles branches par les agents connectés ;
- initialisation de `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SUIVI.md`, `TODO.md` et de la documentation d’architecture et de spécification ;
- registre YAML de la Circulaire n°05/CREPMF/2022 avec provenance et empreinte SHA-256 du scan analysé ;
- index machine-readable de 62 exigences V1 applicables au parcours FCP/SGO ;
- modèle canonique architectural V0.1 comprenant 30 objets principaux ;
- quatre matrices CSV avec séparateur `;` reliant les exigences aux champs, questions, options, effets, groupes de clauses, contrôles, preuves, sections et rôles de revue ;
- manifeste JSON de validation structurelle confirmant la couverture des 62 exigences par 62 lignes de matrice.

### Changed — 2026-08-04

- `SUIVI.md` enregistre la première atomisation réglementaire exploitable par une application ;
- `TODO.md` reflète l’avancement réel du corpus, du mapping, du modèle canonique et du catalogue de questions ;
- la refonte générale de l’organisation des fichiers Markdown est explicitement différée jusqu’à réception du prompt complet annoncé par le propriétaire.

### Security

- interdiction de committer des secrets ;
- exigence de traçabilité des sources et preuves ;
- exigence de revue humaine pour les clauses spécifiques et produits complexes ;
- conservation de l’empreinte du document réglementaire source même lorsque le binaire ne peut pas encore être archivé dans le dépôt.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## [Unreleased] — Réconciliation CIRC005 V0.2 — 2026-08-05

### Added

- extension de couverture CIRC005 ;
- composants pour les 15 exigences précédemment manquantes ;
- statuts `PENDING_REVIEW` ;
- listes des exigences manquantes et en attente dans le manifeste ;
- tests de non-régression ;
- génération déterministe.

### Changed

La préparation à la revue conformité exige désormais `MISSING = 0` et `PENDING_REVIEW = 0`. Les sur-couvertures non vérifiées sont rétrogradées en attente de revue.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## [Unreleased] — Export DOCX V0.1 — 2026-08-05

### Added

- générateur DOCX OOXML déterministe ;
- manifeste DOCX avec SHA-256 et métriques ;
- annexe de traçabilité ;
- validateur structurel ;
- rendu PDF/PNG de contrôle dans GitHub Actions ;
- artefact de revue de 14 jours.

### Security and compliance

Le DOCX affiche qu’il s’agit d’un document de pré-conformité non visé, non approuvé et non prêt pour soumission.
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
## [Unreleased] — Consolidation applicative — 2026-08-17

### Added

- repository PostgreSQL transactionnel et isolation tenant ;
- identité OIDC vérifiée derrière configuration runtime ;
- RBAC, séparation des tâches et workflow de revue ;
- stockage de preuves sécurisé et import en quarantaine ;
- génération PDF déterministe et package ZIP de revue ;
- API d'artefacts avec SHA-256 et protections de chemin ;
- historique de versions local/PostgreSQL ;
- API et workspace de comparaison de versions en lecture seule.

### Changed

- documentation applicative réconciliée avec l'état réellement validé en CI ;
- les anciennes mentions « PostgreSQL/authentification/DOCX à faire » ne sont plus réinjectées par le générateur documentaire.

### Security

- `ready_for_submission=false` demeure invariant ;
- aucune action de soumission n'est autorisée ;
- aucune activation automatique de clause n'est introduite ;
- les services de production non configurés ne sont jamais présentés comme opérationnels.
<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## [Unreleased] — Compositeur documentaire web V0.1 — 2026-08-05

### Added

- adaptateur générique `WEB_CANONICAL_SNAPSHOT_V1` → compositeur historique ;
- CLI de génération depuis un snapshot web ;
- génération DOCX déterministe et validation OOXML pour chaque projet ;
- persistance de treize artefacts de génération et de leurs chemins ;
- tests unitaires de déterminisme et test HTTP du bundle complet.

### Changed

L’API `POST /api/projects/{projectId}/generate` produit désormais le véritable modèle documentaire historique au lieu d’un aperçu constitué par concaténation des réponses.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## [Unreleased] — Collections structurées V0.1 — 2026-08-05

### Added

- type de question `SHARE_CLASS_COLLECTION` ;
- éditeur Atomic Design pour une à vingt classes de parts ;
- validation serveur des lignes et identifiants ;
- migration des anciennes réponses booléennes ;
- test d’intégration vérifiant `share_classes[]` et l’absence de repli dans `_repeating`.

### Changed

La question `Q_SHARE_CLASSES_COUNT` produit désormais la collection canonique détaillée des classes au lieu d’une simple indication oui/non.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## [Unreleased] — Collections canoniques V1 — 2026-08-05

### Added

- éditeur Atomic Design partagé pour dix collections ;
- modèles canoniques des allocations, frais, valorisation, intervenants, risques, pays et preuves ;
- validations serveur et contrôles intercollections ;
- adaptation des collections vers le compositeur documentaire ;
- validation d’intégration V4 jusqu’au DOCX.

### Changed

Les principales données répétables sont désormais écrites directement dans leurs tableaux canoniques et ne sont plus rabattues dans `_repeating`.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:END -->

<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:START -->
## [Unreleased] — Canonical model et PostgreSQL V1 — 2026-08-05

### Added

- JSON Schema canonique V1 ;
- dictionnaire de données ;
- migration PostgreSQL multi-tenant ;
- contraintes des collections structurées ;
- RLS, gel de versions et audit append-only ;
- tests PostgreSQL éphémères ;
- interface `ProjectRepository` et driver local explicite.

### Security

L’activation du driver PostgreSQL échoue explicitement tant qu’aucun adaptateur sécurisé n’est injecté. Aucun repli silencieux n’est autorisé.
<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:END -->

<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:START -->
## [Unreleased] — Chaîne preuve/scanner/import gouvernée — 2026-08-20

### Added

- contrat de stockage evidence binary-only ;
- adaptateur S3 privé SSE-KMS ;
- scanner HTTP d’attestation server-to-server ;
- action RBAC `EVIDENCE_SCAN` séparée de `EVIDENCE_VERIFY` ;
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
- `ready_for_submission=false` maintenu.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->

<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:START -->
## [Unreleased] — Gouvernance et non-régression — 2026-08-13

### Added

- contrat transversal `GOVERNANCE.md` ;
- ADR-0009 pour la branche canonique et la politique improvement-only ;
- boucle `LOOP-GOV-002` ;
- test HTTP dédié de compatibilité descendante des collections structurées ;
- diagnostic permanent de reproductibilité PDF byte-for-byte.

### Changed

- agents et points d’entrée alignés sur `main` ;
- mémoire documentaire consolidée sans suppression ;
- test HTTP général réaligné sur les routes réellement implémentées ;
- normalisation PDF étendue au champ LibreOffice `/DocChecksum` en conservant les longueurs et offsets.

### Fixed

- défaillance CI préexistante causée d’abord par des routes de test inexistantes puis par une métadonnée PDF volatile non normalisée.

### Preserved

- compatibilité descendante des payloads historiques ;
- égalité PDF byte-for-byte après normalisation ;
- `ready_for_submission=false` ;
- prochaine action réglementaire `CM/10/06/2022` ;
- historiques, décisions, preuves et artefacts existants.

### Loop status

- `LOOP-GOV-002 = CLOSED_OBJECTIVE_COMPLETE` ;
- reprise : `LOOP-REG-001 / CM/10/06/2022`.
<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:END -->

<!-- AUTO:LOOP-DEV-001-MULTI-PROFILE-CORPUS:START -->
## [Unreleased] — Corpus de régression multi-profils

### Added

- quatre profils de test synthétiques ;
- tests de déterminisme et unicité des sorties ;
- mutation tests contre l’activation implicite de la soumission ;
- preuve machine avec hashes calculés à l’exécution ;
- persistance documentaire des hashes exécutés ;
- golden masters immuables issus d’un run CI attesté, vérifiés à chaque recette.

### Safety

- aucune fixture synthétique n’est une donnée réglementaire ;
- aucun hash n’est inventé à la main ;
- `ready_for_submission=false` reste obligatoire.
<!-- AUTO:LOOP-DEV-001-MULTI-PROFILE-CORPUS:END -->

<!-- AUTO:LOOP-DEV-001-ENGINE-BRANCH-COVERAGE-V1:START -->
## [Unreleased] — Couverture branches moteurs

### Added

- validation machine `ENGINE_BRANCH_COVERAGE_VALIDATION_V1` ;
- couverture condition engine, questionnaire et rule engine ;
- replay des 30 réponses historiques.

### Fixed

- suppression de l’autorisation générique permettant d’écrire un objet parent à partir d’un champ enfant autorisé ;
- conservation des seules racines structurées historiques explicitement nécessaires.

### Safety

- aucun droit RBAC élargi ;
- aucune règle réglementaire nouvelle activée ;
- `ready_for_submission=false` maintenu.
<!-- AUTO:LOOP-DEV-001-ENGINE-BRANCH-COVERAGE-V1:END -->

<!-- AUTO:LOOP-REG-001-SECONDARY-FULL-TEXT-RECOVERY-2026-09-22:START -->
## [Unreleased] — Reprise réglementaire CM/10/06/2022 — 2026-09-22

### Added

- preuve de découverte d'un miroir PDF secondaire complet de 17 pages ;
- empreinte textuelle pour la récupération institutionnelle ;
- reprise explicite de `LOOP-REG-001`.

### Preserved

- exigence d'un binaire officiel/institutionnel avant atomisation active ;
- absence d'activation de sanctions ou quantums ;
- revues Legal/Compliance obligatoires ;
- `ready_for_submission=false` ;
- intégralité de `LOOP-DEV-001` et de ses preuves.
<!-- AUTO:LOOP-REG-001-SECONDARY-FULL-TEXT-RECOVERY-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-CROSS-CATEGORY-SCAN-2026-09-22:START -->
## [Unreleased] — Résultat discovery AMF-UMOA cross-category — 2026-09-22

### Evidence

- 301 IDs officiels contrôlés ;
- 202 objets valides ;
- 0 erreur ;
- 3/3 témoins récupérés ;
- 0 correspondance exacte `CM/10/06/2022` ;
- 1 correspondance sujet sanctions, limitée à la Décision 2016.

### Safety

La non-détection dans cette plage ne vaut ni inexistence ni non-applicabilité. Aucune activation réglementaire n'est effectuée.
<!-- AUTO:LOOP-REG-001-CROSS-CATEGORY-SCAN-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-CENTIF-TARGET-LINK-DISCOVERY-2026-09-22:START -->
## Route CENTIF ciblée — 2026-09-22

Un scanner institutionnel strictement borné est préparé pour les trois pages CENTIF connues :
`www.centif.sn`, `site.centif.sn`, `jokoo.centif.sn`.

Il recherche uniquement la référence `CM/10/06/2022`, extrait l'ancre correspondante et ne suit que les URLs cible hébergées sous `*.centif.sn`. Il inspecte le type de contenu et la signature PDF sans commiter de binaire.

Statut : `PENDING_CENTIF_DISCOVERY_CI`.
<!-- AUTO:LOOP-REG-001-CENTIF-TARGET-LINK-DISCOVERY-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-CI-RACE-AND-CENTIF-TLS-2026-09-22:START -->
## [Unreleased] — CI race safety et CENTIF TLS diagnostic — 2026-09-22

### Fixed

- persistance de Regulatory CI rendue résistante à une écriture concurrente sur `main` via retries bornés et rebase ;
- aucun force-push n'est introduit.

### Research

- diagnostic explicite de la chaîne TLS CENTIF ;
- fallback non vérifié autorisé uniquement pour découvrir le HTML/href ;
- récupération binaire par TLS non vérifié interdite.
<!-- AUTO:LOOP-REG-001-CI-RACE-AND-CENTIF-TLS-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-CI-AUTOSTASH-CENTIF-RESULT-2026-09-22:START -->
## [Unreleased] — CENTIF discovery result + CI autostash — 2026-09-22

### Evidence

- référence `CM/10/06/2022` présente sur 3/3 pages CENTIF ;
- 0 ancre cible ;
- 0 lien PDF institutionnel exposé.

### Fixed

- le retry de persistance Regulatory CI utilise désormais `git pull --rebase --autostash` afin de supporter les sorties de génération non indexées ;
- aucun force-push et aucune perte de worktree.
<!-- AUTO:LOOP-REG-001-CI-AUTOSTASH-CENTIF-RESULT-2026-09-22:END -->

<!-- AUTO:LOOP-REG-001-BCEAO-UEMOA-ARCHIVE-DISCOVERY-2026-09-22:START -->
## [Unreleased] — BCEAO/UEMOA targeted archive discovery — 2026-09-22

### Added

- scanner de liens documentaires sur trois pages institutionnelles connues ;
- workflow de preuve machine avec TLS vérifié uniquement.

### Verified

- Regulatory CI race-safe/autostash : `35781341993 SUCCESS` ;
- Security, Browser/Accessibility et Runtime Quality également GREEN.

### Safety

- aucun crawl libre ;
- aucun binaire suivi ou matérialisé ;
- aucune activation réglementaire ;
- `ready_for_submission=false`.
<!-- AUTO:LOOP-REG-001-BCEAO-UEMOA-ARCHIVE-DISCOVERY-2026-09-22:END -->
