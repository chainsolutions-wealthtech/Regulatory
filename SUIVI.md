# SUIVI.md

Journal chronologique du projet `Regulatory`.

Ce fichier doit être mis à jour au fur et à mesure. Il constitue, avec `README.md`, `TODO.md`, `docs/DECISIONS.md` et les commits Git, la mémoire opérationnelle du projet.

---

## 2026-08-04 — Initialisation du dépôt et consolidation du cadrage

### Objectif

Initialiser la documentation de référence du futur module de génération de prospectus OPCVM/FCP UMOA et inscrire les règles de continuité, de documentation et de non-régression dans le dépôt.

### État du dépôt avant intervention

- dépôt privé : `chainsolutions-wealthtech/Regulatory` ;
- branche par défaut : `main` ;
- un seul commit initial ;
- seul fichier présent : `README.md` contenant uniquement le titre `# Regulatory` ;
- aucun code applicatif ;
- aucune architecture, spécification, matrice ou règle de contribution préexistante.

### Périmètre confirmé

Le premier pack réglementaire cible :

- juridiction UMOA ;
- autorité AMF-UMOA ;
- OPCVM ;
- forme prioritaire FCP ;
- création et mise à jour de prospectus ;
- questionnaire simple et conditionnel ;
- génération documentaire complète ;
- revue humaine obligatoire avant soumission.

### Documents analysés dans le cadrage

- un prospectus FCP agréé, utilisé comme cas d’étude de la structure documentaire ;
- la Position-Recommandation AMF France DOC-2020-06, utilisée uniquement comme inspiration méthodologique et non comme source juridique du pack UMOA ;
- l’Instruction n°66/CREPMF/2021, identifiée comme texte source majeur à intégrer au corpus ;
- la Circulaire n°05/CREPMF/2022 relative au contenu du prospectus des OPC, intégrée comme source structurante de l’annexe réglementaire.

### Décisions fonctionnelles consolidées

1. La société de gestion ne doit pas rédiger le prospectus de manière libre.
2. Elle doit décrire son fonds au moyen d’informations statiques, de choix guidés et de réponses conditionnelles.
3. Les informations institutionnelles doivent être préchargées et réutilisables.
4. Le questionnaire doit être un graphe de décision.
5. Les formulations juridiques doivent être stockées dans une bibliothèque versionnée.
6. Chaque clause doit être reliée à ses exigences, variables, conditions et approbateurs.
7. Le prospectus doit être construit de bout en bout par un moteur documentaire déterministe.
8. Chaque exigence doit être couverte dans le prospectus, dans un règlement annexé, dans un document constitutif annexé ou être justifiée comme non applicable.
9. Une table de concordance doit être générée automatiquement.
10. La conformité automatisée ne remplace pas la revue juridique, conformité, fiscale ni la décision du régulateur.
11. Les données canoniques doivent alimenter plusieurs documents sans ressaisie.
12. Les modifications réglementaires doivent être versionnées et faire l’objet d’une analyse d’impact.

### Architecture fonctionnelle retenue

Trois moteurs principaux :

- `LEGAL KNOWLEDGE BASE` ;
- `DECISION & QUESTION ENGINE` ;
- `DOCUMENT COMPOSER`.

Services complémentaires :

- modèle canonique ;
- moteur de règles ;
- moteur de cohérence interdocumentaire ;
- gestion des preuves ;
- workflow de revue ;
- journal d’audit ;
- gestion des versions et impacts réglementaires.

### Référentiels à précharger

- pays et juridictions ;
- sociétés de gestion ;
- agréments ;
- dirigeants et organes ;
- dépositaires ;
- commissaires aux comptes ;
- conseillers externes ;
- distributeurs et agents payeurs ;
- autres OPC gérés ;
- classifications de fonds ;
- classes d’actifs ;
- risques ;
- frais ;
- méthodes de valorisation ;
- clauses juridiques ;
- règles et preuves.

### Exigences importantes ajoutées à partir de la Circulaire n°05/CREPMF/2022

- respect de l’ordre réglementaire ;
- localisation de chaque information entre prospectus et annexes ;
- distinction siège statutaire / administration centrale ;
- autres OPC gérés ;
- capital souscrit / capital libéré ;
- personnes chargées du contrôle des données comptables ;
- activités externes significatives des dirigeants ;
- nature juridique des parts ;
- titres, certificats, registre ou compte ;
- forme nominative ou au porteur ;
- coupons et droits de vote ;
- droits en liquidation ;
- cotation ou négociation ;
- émission, vente, rachat, remboursement et suspension ;
- détermination et affectation des revenus ;
- capacités d’emprunt ;
- prix d’émission et de rachat ;
- publication des prix ;
- rémunérations et remboursements de frais ;
- activité principale du dépositaire ;
- conseillers externes et clauses importantes de leurs contrats ;
- dispositifs de paiement et d’information par État membre ;
- performances historiques ;
- investisseur-type ;
- informations d’ordre économique ;
- ventilation des dépenses entre porteur et actif du fonds.

### Règles Git et de continuité décidées

- aucune nouvelle branche ne doit être créée automatiquement par un agent connecté ;
- l’agent doit conserver la branche existante désignée ;
- `main` est utilisée lorsqu’aucune autre branche existante n’a été expressément désignée ;
- lecture obligatoire de toute la documentation structurante avant modification ;
- analyse de l’existant avant création d’un nouveau composant ;
- documentation continue ;
- aucun force push ;
- aucune réécriture d’historique ;
- aucune modification sans analyse de non-régression.

### Fichiers documentaires initialisés

- `README.md` ;
- `AGENTS.md` ;
- `CONTRIBUTING.md` ;
- `SUIVI.md` ;
- `TODO.md` ;
- `CHANGELOG.md` ;
- `.github/CODEOWNERS` ;
- `.github/copilot-instructions.md` ;
- `docs/ARCHITECTURE.md` ;
- `docs/DECISIONS.md` ;
- `docs/PROSPECTUS_ENGINE_SPEC.md` ;
- `docs/REGULATORY_MAPPING.md`.

### Résultat

Le dépôt dispose désormais d’une base documentaire conçue pour empêcher les interventions isolées, les duplications, les changements de logique non documentés et les régressions silencieuses.

### Limites actuelles

- le corpus réglementaire complet n’est pas encore archivé dans le dépôt ;
- l’Instruction n°66/CREPMF/2021 n’est pas encore atomisée point par point ;
- les textes complémentaires ne sont pas encore inventoriés ;
- aucune validation par un juriste ou responsable conformité n’est enregistrée ;
- le modèle canonique n’est pas encore implémenté ;
- aucune base de données ni interface n’existe ;
- aucune clause n’a encore le statut `APPROVED` ou `ACTIVE` ;
- aucun test automatisé n’existe encore.

### Prochaine étape prioritaire

Construire le registre des sources réglementaires puis la matrice complète :

```text
exigence
→ champ canonique
→ provenance
→ question
→ options
→ conditions
→ effets
→ clause
→ contrôle
→ preuve
→ section
→ rôle de revue
```

---

## 2026-08-04 — Première atomisation machine-readable de la Circulaire n°05/CREPMF/2022

### Objectif

Passer du cadrage documentaire à une première base réglementaire exploitable par une future application, sans créer de branche et sans modifier la logique validée.

### État initial vérifié

- branche conservée : `main` ;
- dernier commit lu : `cb60b1dfc0ad5611f0e31c14da16bb5b471b0e56` ;
- documentation obligatoire relue ;
- aucune structure de données machine-readable ne préexistait ;
- le mapping Markdown de la circulaire était initial et partiellement atomisé ;
- l’Instruction n°66/CREPMF/2021 restait à atomiser.

### Travail réalisé

1. Enregistrement des métadonnées de la Circulaire n°05/CREPMF/2022 dans un fichier YAML dédié.
2. Enregistrement de la provenance du scan transmis par le propriétaire :
   - nom d’origine ;
   - nombre de pages ;
   - taille ;
   - empreinte SHA-256 ;
   - méthode d’extraction ;
   - statut de vérification.
3. Création d’un index machine-readable de **62 exigences V1** applicables au parcours FCP/SGO :
   - règles transversales ;
   - exigences FCP ;
   - exigences société de gestion ;
   - dépositaire ;
   - conseiller externe ;
   - dispositifs par État ;
   - performances, investisseur-type, informations économiques et dépenses.
4. Attribution d’identifiants stables, d’un ordre, d’une référence de page et de conditions d’applicabilité.
5. Création d’une première architecture canonique V0.1 comprenant **30 objets principaux**.
6. Création de quatre matrices CSV avec séparateur `;`, comportant au total **62 lignes**, reliant chaque exigence à :
   - champs canoniques ;
   - question ;
   - type de question ;
   - options ;
   - effets ;
   - groupe de clauses ;
   - contrôles ;
   - preuves ;
   - section de sortie ;
   - rôles de revue ;
   - statut d’implémentation.
7. Création d’un manifeste de validation structurelle.

### Décisions prises

- Les nouveaux artefacts machine-readable sont ajoutés sans réorganiser prématurément l’ensemble des fichiers Markdown.
- L’organisation documentaire Markdown demeure provisoire, car le propriétaire a annoncé l’envoi prochain d’un prompt complet destiné à créer et organiser tous les fichiers `.md`.
- Aucun nouveau fichier Markdown de taxonomie générale n’est ajouté avant réception et analyse de ce prompt, sauf mise à jour des fichiers de suivi obligatoires.
- Le statut `SPECIFIED_NOT_IMPLEMENTED` distingue clairement une exigence spécifiée d’une exigence réellement codée et testée.
- La validation réalisée est structurelle ; elle ne constitue pas une validation juridique.

### Fichiers créés

- `regulatory/sources/CIRC005_CREPMF_2022.yaml` ;
- `regulatory/requirements/CIRC005_FCP_REQUIREMENTS_V0_1.yaml` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_01_GENERAL_IDENTITY_TAX.csv` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_02_PARTS_OPERATIONS.csv` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_03_INVESTMENT_PRICING.csv` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_04_ACTORS_COUNTRY_OTHER.csv` ;
- `regulatory/validation/CIRC005_FCP_BOOTSTRAP_VALIDATION.json` ;
- `schemas/UMOA_FCP_CANONICAL_MODEL_V0_1.yaml`.

### Fichiers modifiés

- `SUIVI.md` ;
- `TODO.md` ;
- `CHANGELOG.md`.

### Tests et contrôles

- unicité des identifiants d’exigence : réussie ;
- présence de l’ordre pour chaque exigence : réussie ;
- unicité des références de matrice : réussie ;
- résolution de chaque référence de matrice vers une exigence existante : réussie ;
- couverture des 62 exigences V1 par les 62 lignes de matrice : réussie ;
- vérification du séparateur CSV `;` : réussie ;
- conservation de la branche `main` : réussie ;
- absence de création de branche : réussie ;
- absence de réécriture d’historique : réussie.

### Résultats

La première chaîne de traçabilité exploitable par une application existe désormais :

```text
source
→ exigence
→ champ canonique
→ question
→ option
→ effet
→ groupe de clauses
→ contrôle
→ preuve
→ section
→ rôle de revue
```

### Limitations ou points à vérifier

- la date officielle de publication et l’état juridique actuel de la circulaire doivent encore être confirmés dans le registre officiel ;
- le PDF source binaire n’a pas été archivé dans GitHub par le connecteur utilisé ; son empreinte et sa provenance sont enregistrées ;
- l’Instruction n°66/CREPMF/2021 n’est pas encore atomisée ;
- les champs canoniques ne possèdent pas encore tous leur type, cardinalité, enum, sensibilité et règle de migration ;
- aucune clause juridique n’est encore `APPROVED` ou `ACTIVE` ;
- les contrôles décrits ne sont pas encore implémentés dans un moteur ;
- la validation juridique et conformité reste à obtenir ;
- l’organisation finale des fichiers Markdown sera complétée après réception du prompt annoncé par le propriétaire.

### Prochaine étape

1. recevoir et analyser le prompt complet d’organisation des fichiers `.md` sans effacer les documents ni décisions existants ;
2. atomiser l’Instruction n°66/CREPMF/2021 à partir d’une copie source vérifiable ;
3. enrichir le modèle canonique au niveau de chaque champ ;
4. créer les premiers catalogues de questions, options, règles et clauses en conservant les identifiants créés.

---

## Modèle obligatoire pour les prochaines entrées

```markdown
## AAAA-MM-JJ — Titre de l’intervention

### Objectif

### État initial vérifié

### Travail réalisé

### Décisions prises

### Fichiers modifiés

### Tests et contrôles

### Résultats

### Limitations ou points à vérifier

### Prochaine étape
```
