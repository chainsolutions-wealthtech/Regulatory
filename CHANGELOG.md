# CHANGELOG.md

Toutes les évolutions significatives du projet sont documentées dans ce fichier.

Le format s’inspire de Keep a Changelog. Le projet n’est pas encore versionné pour une utilisation en production.

## [Unreleased]

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
- initialisation de `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SUIVI.md`, `TODO.md` et de la documentation d’architecture et de spécification.

### Security

- interdiction de committer des secrets ;
- exigence de traçabilité des sources et preuves ;
- exigence de revue humaine pour les clauses spécifiques et produits complexes.
