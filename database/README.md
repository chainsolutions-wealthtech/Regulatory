# Base PostgreSQL du Prospectus Composer

> **Statut :** conception et migration initiale non déployée.  
> **Migration :** `migrations/0001_regulatory_core.sql`.

## Objectif

La base cible remplace progressivement la persistance JSON locale par une couche transactionnelle multi-tenant, versionnée et auditable. La présence de la migration dans le dépôt ne signifie pas qu’une base de production existe ou qu’elle a fait l’objet d’un audit de sécurité.

## Modèle de conservation

Deux représentations complémentaires sont maintenues :

1. `canonical_snapshots.canonical_data` conserve le snapshot JSON exact qui a servi à la génération ;
2. les tables `project_*` normalisent les collections principales pour appliquer les contraintes, les index et les requêtes.

La divergence entre le snapshot et les tables normalisées doit être empêchée par une transaction applicative unique. La transaction doit :

```text
verrouiller la version du projet
→ écrire les réponses
→ écrire les collections normalisées
→ construire le snapshot
→ calculer son empreinte
→ écrire l’événement d’audit
→ valider la transaction
```

## Multi-tenant

Toutes les données de projet portent `organization_id`. La migration active la Row-Level Security sur les tables concernées et utilise la variable de session :

```sql
set local app.current_organization_id = '<uuid>';
```

Sans cette valeur, les politiques ne doivent retourner aucune donnée tenant. L’application ne doit jamais accepter directement cet identifiant depuis un paramètre utilisateur non authentifié. Il doit provenir de la session et du contrôle d’appartenance à l’organisation.

## Authentification

`app_users.external_subject` reçoit l’identifiant du fournisseur d’identité. La migration ne choisit volontairement aucun fournisseur et ne contient aucune authentification fictive.

Avant activation, il faut :

- choisir le fournisseur d’identité ;
- vérifier les jetons côté serveur ;
- résoudre l’utilisateur et ses appartenances ;
- ouvrir une transaction ;
- définir `app.current_organization_id` avec `SET LOCAL` ;
- appliquer les contrôles de rôle métier en plus de la RLS.

## Audit

`audit_events` est append-only : les mises à jour et suppressions sont interdites par trigger. `event_hash` et `previous_hash` permettent une chaîne cryptographique, mais le calcul et la vérification de cette chaîne doivent encore être implémentés dans la transaction applicative.

Les secrets, mots de passe, jetons et contenus binaires ne doivent jamais être placés dans `payload`.

## Versions et gel

Une version de projet peut évoluer jusqu’à ce que `frozen_at` et `frozen_by` soient renseignés. Après gel, un trigger empêche sa modification. Toute correction doit créer une nouvelle version liée par `source_version_id`.

Le gel n’est pas une approbation réglementaire. Il signifie seulement que le snapshot interne ne doit plus changer.

## Documents et soumission

Les colonnes `ready_for_submission` de `canonical_snapshots` et `generated_documents` sont contraintes à `false` dans V1. Leur évolution nécessitera une migration séparée, une décision d’architecture et la validation du workflow humain.

## Exécution locale future

La migration n’est pas exécutée automatiquement dans la CI actuelle. Avant de l’appliquer à une base éphémère, ajouter :

```text
PostgreSQL de test isolé
→ application de toutes les migrations
→ tests de contraintes
→ tests RLS croisés entre deux organisations
→ tests de gel
→ tests d’audit append-only
→ destruction de la base éphémère
```

## Ordre des prochaines migrations

- `0002`: fonctions transactionnelles de sauvegarde et reconstruction des collections ;
- `0003`: politiques de rôles et workflow de revue ;
- `0004`: stockage logique des fichiers, quarantaines et empreintes ;
- `0005`: registres réglementaires et bibliothèque de clauses finalisés ;
- `0006`: vues de reporting et contrôle de cohérence ;
- migrations ultérieures uniquement après revue et tests.

## Interdictions

- ne pas appliquer cette migration à la production sans sauvegarde, plan de retour arrière et revue ;
- ne pas exposer un rôle de base contournant la RLS à l’application ;
- ne pas stocker de secret dans le dépôt ;
- ne pas présenter le schéma comme une certification de sécurité ou de conformité ;
- ne pas activer la soumission réglementaire automatiquement.
