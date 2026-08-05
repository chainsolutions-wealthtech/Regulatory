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
