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
