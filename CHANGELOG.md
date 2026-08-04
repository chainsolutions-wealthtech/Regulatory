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
