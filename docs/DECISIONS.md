# DECISIONS.md

Registre des décisions structurantes du projet.

Chaque décision doit être conservée, même lorsqu’elle est remplacée. Une décision remplacée reçoit le statut `SUPERSEDED` et référence la décision qui la remplace.

---

## DEC-001 — Périmètre réglementaire V1

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Le premier périmètre est limité aux prospectus d’OPCVM/FCP relevant de l’AMF-UMOA.

### Raisons

- besoin clairement identifié ;
- corpus réglementaire régional spécifique ;
- possibilité de bâtir un premier pack cohérent ;
- éviter de mélanger les règles UMOA avec les régimes français et européens.

### Conséquences

- le guide AMF France DOC-2020-06 ne constitue pas une source normative du pack UMOA ;
- les futurs packs France/UE seront séparés ;
- le modèle canonique doit rester extensible à la SICAV et aux autres juridictions.

---

## DEC-002 — La société décrit le fonds, elle ne rédige pas le prospectus

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

L’utilisateur répond à un questionnaire simple, principalement structuré et conditionnel. La plateforme compose la rédaction réglementaire.

### Conséquences

- priorité aux données structurées ;
- limitation des zones de texte libre ;
- création d’une bibliothèque de clauses ;
- prévisualisation et revue obligatoires.

---

## DEC-003 — Données statiques préchargées

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Les informations institutionnelles et réglementaires connues doivent être disponibles en base avant la création du prospectus.

### Données concernées

- sociétés de gestion ;
- agréments ;
- sièges ;
- dirigeants ;
- capitaux ;
- autres OPC gérés ;
- dépositaires ;
- commissaires aux comptes ;
- conseillers externes ;
- distributeurs ;
- agents payeurs ;
- classifications ;
- actifs ;
- risques ;
- frais ;
- méthodes de valorisation.

### Conséquences

- création d’un référentiel institutionnel historisé ;
- mécanisme de confirmation et correction ;
- réutilisation entre plusieurs fonds.

---

## DEC-004 — Modèle canonique comme source de vérité

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Le prospectus n’est pas la source primaire des données. Le modèle canonique est la source primaire et alimente les documents.

### Conséquences

- une donnée n’est saisie qu’une fois ;
- les documents deviennent des vues ;
- les contrôles interdocumentaires sont possibles ;
- les exports Openfunds peuvent être dérivés du même modèle.

---

## DEC-005 — Questionnaire modélisé comme graphe de décision

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Le questionnaire est un graphe versionné, et non un formulaire linéaire fixe.

### Effets possibles d’une réponse

- affichage ou masquage ;
- valeur préremplie ;
- sélection de clause ;
- proposition de risque ;
- exigence de preuve ;
- exigence de méthode de valorisation ;
- déclenchement de contrôle ;
- obligation de revue.

---

## DEC-006 — Bibliothèque de clauses juridiques versionnées

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Les wordings juridiques sont gérés comme des objets versionnés et approuvés.

### Catégories

- mentions verrouillées ;
- clauses paramétriques ;
- clauses conditionnelles ;
- clauses composées ;
- clauses factuelles ;
- rédactions spécifiques avec revue juridique.

### Règle

Une clause active n’est jamais modifiée rétroactivement.

---

## DEC-007 — Intégration structurante de la Circulaire n°05/CREPMF/2022

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

La circulaire est intégrée au niveau du schéma, du questionnaire, des clauses, des contrôles, de l’ordre documentaire et de la table de concordance.

### Conséquences

Le système doit couvrir les points 1.1 à 5.4, notamment :

- FCP et société de gestion ;
- dépositaire ;
- conseillers externes ;
- paiements, rachats et information par État ;
- performances ;
- investisseur-type ;
- informations économiques ;
- dépenses et commissions.

---

## DEC-008 — Couverture réglementaire explicite

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Chaque exigence doit posséder un statut de couverture explicite.

```text
IN_PROSPECTUS
IN_ATTACHED_REGULATION
IN_ATTACHED_CONSTITUTIVE_DOCUMENT
NOT_APPLICABLE
PENDING_REVIEW
MISSING
```

### Conséquences

- génération automatique de la table de concordance ;
- justification obligatoire pour `NOT_APPLICABLE` ;
- blocage pour `MISSING` lorsqu’une exigence est obligatoire.

---

## DEC-009 — Génération déterministe

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Un même snapshot de données, avec les mêmes versions de pack, clauses et modèle, doit produire le même résultat.

### Conséquences

- manifeste de génération ;
- versionnement des dépendances ;
- traçabilité paragraphe par paragraphe ;
- tests de snapshot et de non-régression.

---

## DEC-010 — Validation humaine obligatoire

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Le système assiste la conformité mais ne remplace pas les validations humaines ni la décision du régulateur.

### Rôles

- gestionnaire ;
- risques ;
- conformité ;
- juridique ;
- fiscal ;
- direction.

### Conséquences

- workflow de revue ;
- statut `LEGAL_REVIEW_REQUIRED` ;
- interdiction de présenter automatiquement un document comme visé, agréé ou approuvé.

---

## DEC-011 — Politique de branche particulière

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Aucun agent connecté au dépôt ne doit créer automatiquement une nouvelle branche.

### Règles

- conserver la branche existante désignée ;
- utiliser `main` en l’absence d’une autre branche explicitement désignée ;
- ne pas changer de branche sans instruction ;
- ne pas effectuer de force push ;
- ne pas réécrire l’historique.

### Motivation

Le propriétaire souhaite que les agents lisent l’existant et continuent la logique déjà engagée au lieu de créer des travaux parallèles isolés.

### Risques et mitigation

Cette politique peut augmenter le risque lié aux modifications directes. Elle est compensée par :

- lecture obligatoire ;
- changements atomiques ;
- tests ;
- documentation continue ;
- interdiction de réécriture ;
- analyse de non-régression.

---

## DEC-012 — Documentation comme partie du changement

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Une évolution fonctionnelle ou réglementaire n’est pas terminée tant que la documentation, le suivi et le TODO ne sont pas mis à jour.

### Documents concernés

- `README.md` ;
- `SUIVI.md` ;
- `TODO.md` ;
- `CHANGELOG.md` ;
- architecture ;
- spécifications ;
- mapping réglementaire ;
- tests et exemples.

---

## DEC-013 — Les prospectus existants sont des cas de test, pas la norme

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

Les prospectus agréés servent à observer les pratiques, tester le générateur et identifier les variantes. Ils ne remplacent pas les textes.

### Conséquences

- séparation entre `REGULATORY_REQUIREMENT` et `OBSERVED_MARKET_PRACTICE` ;
- toute règle issue d’une pratique doit être explicitement qualifiée et validée.

---

## DEC-014 — L’IA reste une couche d’assistance

- **Date :** 2026-08-04
- **Statut :** ACCEPTED

### Décision

L’IA peut assister l’extraction, la reformulation, la détection d’incohérences et la comparaison. Elle n’est pas une source normative et ne valide pas seule la conformité.

### Ordre de priorité

```text
Données structurées
+ règles déterministes
+ clauses approuvées
+ assistance IA encadrée
+ validation humaine
```
