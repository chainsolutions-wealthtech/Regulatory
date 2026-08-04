# CONTRIBUTING.md

Ce document décrit la méthode de contribution au dépôt `Regulatory`.

Les règles de [AGENTS.md](AGENTS.md) sont impératives et prévalent sur les habitudes générales des outils de développement.

## 1. Principe de contribution

Toute contribution doit préserver :

- la continuité du travail existant ;
- la traçabilité réglementaire ;
- les identifiants canoniques ;
- le versionnement des clauses et règles ;
- la compatibilité des données ;
- la reproductibilité des documents générés ;
- l’absence de régression.

## 2. Politique de branche propre à ce dépôt

Aucune nouvelle branche ne doit être créée automatiquement.

Le contributeur doit :

1. identifier la branche existante désignée ;
2. rester sur cette branche ;
3. utiliser `main` lorsqu’aucune autre branche existante n’a été désignée ;
4. ne jamais forcer une référence Git ;
5. ne jamais réécrire l’historique.

La politique de branche pourra évoluer uniquement par décision explicite du propriétaire et mise à jour simultanée de `README.md`, `AGENTS.md`, `CONTRIBUTING.md` et `docs/DECISIONS.md`.

## 3. Avant de commencer

Lire obligatoirement :

- `README.md` ;
- `AGENTS.md` ;
- `SUIVI.md` ;
- `TODO.md` ;
- `docs/DECISIONS.md` ;
- `docs/ARCHITECTURE.md` ;
- la spécification et le mapping réglementaire concernés.

Puis :

- inspecter la structure du dépôt ;
- rechercher les identifiants et composants existants ;
- lire les derniers commits pertinents ;
- identifier les dépendances ;
- définir les tests de non-régression nécessaires.

## 4. Types de changements

### 4.1 Ajout d’une source réglementaire

L’ajout doit inclure :

- métadonnées du texte ;
- version et date d’effet ;
- juridiction et périmètre ;
- référence officielle ;
- statut de validation ;
- fichier source ou lien vers l’archive documentaire autorisée ;
- analyse d’impact ;
- mise à jour du mapping réglementaire.

### 4.2 Ajout d’une exigence

Une exigence doit inclure :

- identifiant stable ;
- source et référence précise ;
- objet ;
- condition d’applicabilité ;
- ordre réglementaire ;
- modes de couverture admis ;
- sévérité ;
- preuve attendue ;
- rôles de revue ;
- tests.

### 4.3 Ajout d’un champ canonique

Un champ doit inclure :

- identifiant ;
- définition ;
- type ;
- unité ;
- cardinalité ;
- nullabilité ;
- validation ;
- provenance ;
- sensibilité ;
- usages ;
- stratégie de versionnement.

### 4.4 Ajout d’une question

Une question doit inclure :

- identifiant ;
- champ ou champs alimentés ;
- texte utilisateur ;
- aide ;
- type de réponse ;
- options ;
- conditions d’affichage ;
- effets ;
- contrôles ;
- preuves ;
- rôle de revue ;
- tests de branches du graphe.

### 4.5 Ajout d’une clause

Une clause doit inclure :

- identifiant ;
- version ;
- catégorie ;
- section ;
- texte ;
- variables autorisées ;
- conditions ;
- exigences couvertes ;
- date d’effet ;
- statut d’approbation ;
- approbateurs ;
- tests de rendu.

Une clause active n’est jamais modifiée sur place. Une nouvelle version doit être créée.

### 4.6 Modification d’un schéma

Toute modification de schéma exige :

- analyse des consommateurs ;
- migration ;
- compatibilité descendante ;
- plan de retour arrière logique ;
- tests de données existantes ;
- mise à jour de l’architecture et du suivi.

### 4.7 Modification d’un modèle documentaire

Elle exige :

- comparaison avant/après ;
- tests de pagination et de structure ;
- vérification de l’ordre réglementaire ;
- vérification des tableaux ;
- vérification de la table de concordance ;
- conservation de la traçabilité paragraphe par paragraphe.

## 5. Méthode de développement

### Étape A — État des lieux

Documenter :

- le besoin ;
- l’existant ;
- les sources ;
- les fichiers concernés ;
- les risques ;
- les tests attendus.

### Étape B — Modification minimale cohérente

Privilégier :

- la réutilisation ;
- l’extension d’objets existants ;
- les identifiants stables ;
- les changements atomiques ;
- les migrations explicites.

### Étape C — Vérifications

Exécuter selon le changement :

- validation de schéma ;
- tests unitaires ;
- tests du graphe de questions ;
- tests des règles ;
- tests de rendu ;
- tests de concordance ;
- tests d’import ;
- tests de non-régression ;
- analyse de secrets et dépendances.

### Étape D — Documentation

Mettre à jour les documents concernés dans le même changement.

### Étape E — Compte rendu

Indiquer :

- ce qui a changé ;
- ce qui n’a pas changé ;
- les tests exécutés ;
- les résultats ;
- les limitations ;
- les prochaines étapes.

## 6. Conventions d’identifiants

Exemples recommandés :

```text
Requirement : CIRC005_1_17_FCP_PRICING
Field       : fund.pricing.redemption.formula
Question    : Q_FCP_REDEMPTION_PRICE_FORMULA
Option      : OPT_REDEMPTION_NAV_MINUS_FEE
Rule        : RULE_REDEMPTION_PRICE_CONSISTENCY
Clause      : UMOA_FCP_REDEMPTION_PRICE_V1
Section     : SEC_1_17_PRICE_DETERMINATION
Evidence    : EVIDENCE_FUND_REGULATION
```

Un identifiant publié ne doit pas être réutilisé avec un autre sens.

## 7. Statuts recommandés

### Exigences

```text
DRAFT
REVIEW_REQUIRED
VALIDATED
ACTIVE
SUPERSEDED
ARCHIVED
```

### Clauses

```text
DRAFT
LEGAL_REVIEW
COMPLIANCE_REVIEW
APPROVED
ACTIVE
SUPERSEDED
ARCHIVED
```

### Projets de prospectus

```text
DRAFT
DATA_INCOMPLETE
DATA_COMPLETE
VALIDATION_FAILED
READY_FOR_COMPLIANCE_REVIEW
COMPLIANCE_REVIEWED
READY_FOR_LEGAL_REVIEW
LEGAL_REVIEWED
MANAGEMENT_APPROVED
READY_FOR_SUBMISSION
SUBMITTED
REGULATOR_COMMENTS_RECEIVED
AMENDMENT_IN_PROGRESS
APPROVED_OR_VISA_GRANTED
PUBLISHED
SUPERSEDED
```

## 8. Tests minimaux attendus

Pour chaque fonctionnalité :

- cas nominal ;
- cas non applicable ;
- cas incomplet ;
- cas incohérent ;
- cas limite ;
- changement de version ;
- stabilité d’une sortie non concernée ;
- traçabilité des sources ;
- contrôle du statut de revue.

Pour le questionnaire :

- toutes les branches atteignables ;
- aucune boucle non contrôlée ;
- aucune question obligatoire masquée ;
- effets réversibles lorsque l’utilisateur change une réponse ;
- suppression contrôlée des données devenues inapplicables.

Pour la génération :

- ordre réglementaire ;
- clauses attendues ;
- absence des clauses inapplicables ;
- tableaux cohérents ;
- variables complètes ;
- références et preuves conservées ;
- résultat déterministe.

## 9. Documentation du travail au fur et à mesure

`SUIVI.md` doit enregistrer chronologiquement :

- date ;
- objectif ;
- travail réalisé ;
- décisions ;
- résultats ;
- fichiers ;
- tests ;
- limitations ;
- prochaine étape.

`TODO.md` doit refléter l’état réel :

- `[x]` terminé et vérifié ;
- `[~]` en cours ;
- `[ ]` à faire ;
- `[!]` bloqué ou nécessitant une décision.

## 10. Sécurité

Ne jamais committer :

- mots de passe ;
- clés API ;
- jetons ;
- certificats privés ;
- secrets de connexion ;
- données personnelles non nécessaires ;
- documents réglementaires confidentiels sans autorisation.

Utiliser des variables d’environnement et des coffres de secrets pour les environnements applicatifs.
