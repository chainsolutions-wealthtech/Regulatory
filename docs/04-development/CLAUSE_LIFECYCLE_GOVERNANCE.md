# Cycle de vie gouverné des clauses juridiques

## Objectif

Définir une machine d'état explicite pour les versions de clauses sans donner au logiciel le pouvoir de transformer seul un texte en règle juridiquement active.

## Statuts conservés

Le moteur reprend les statuts déjà présents dans le schéma PostgreSQL :

1. `DRAFT` ;
2. `DRAFT_LEGAL_REVIEW_REQUIRED` ;
3. `APPROVED` ;
4. `ACTIVE` ;
5. `RETIRED`.

Aucun nouveau statut réglementaire n'est inventé par cette tranche.

## Transitions V1

### `REQUEST_LEGAL_REVIEW`

- départ : `DRAFT` ;
- cible : `DRAFT_LEGAL_REVIEW_REQUIRED` ;
- permission RBAC : `CLAUSE_DRAFT` ;
- mode : humain uniquement.

### `APPROVE`

- départ : `DRAFT_LEGAL_REVIEW_REQUIRED` ;
- cible : `APPROVED` ;
- permission RBAC : `CLAUSE_APPROVE` ;
- mode : humain uniquement ;
- séparation des tâches : l'auteur ne peut pas être son seul approbateur.

### `ACTIVATE`

- départ théorique : `APPROVED` ;
- cible théorique : `ACTIVE` ;
- permission RBAC : `CLAUSE_ACTIVATE` ;
- mode : humain uniquement.

**État actuel : activation fermée.** La politique `PROSPECTUS_RBAC_V1` n'accorde `CLAUSE_ACTIVATE` à aucun rôle. Le moteur conserve donc la transition dans le modèle pour rendre la frontière explicite, mais l'autorisation la refuse systématiquement avec la politique courante.

## Interdictions

- aucune transition automatique ;
- aucun saut `DRAFT -> APPROVED` ;
- aucune auto-approbation de l'auteur ;
- aucune activation sans grant RBAC explicite ;
- aucune modification de `ready_for_submission` ;
- aucune assimilation d'une approbation interne à une approbation AMF-UMOA.

## Validation

`apps/web/src/domain/clause-lifecycle.integration.ts` couvre :

- demande de revue par un rôle Juridique ;
- refus du rôle Produit pour la rédaction juridique ;
- refus du saut d'état ;
- refus de l'auto-approbation ;
- approbation par un second juriste ;
- refus des transitions automatiques ;
- refus de l'activation faute de grant ;
- maintien de `readyForSubmission=false`.

Le test est intégré au gate `test:authorization-workflow` de la Security and Review Policy CI.

## Étape suivante

La persistance administrative devra réutiliser ce moteur et produire des événements d'audit. Elle ne devra pas créer de chemin d'activation tant que le propriétaire, le juridique et la conformité n'auront pas validé une politique donnant explicitement `CLAUSE_ACTIVATE` à un rôle avec une séparation des tâches suffisante.
