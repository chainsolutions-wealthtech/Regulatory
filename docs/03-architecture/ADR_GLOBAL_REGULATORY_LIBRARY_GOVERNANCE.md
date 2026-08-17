# ADR — Gouvernance de la bibliothèque réglementaire globale

**Date :** 2026-08-17  
**Statut :** ACCEPTED_AS_SAFETY_BOUNDARY — implémentation d'écriture bloquée tant que le modèle plateforme n'est pas défini.

## Contexte

Le produit est multi-tenant pour les dossiers prospectus : les projets, réponses, snapshots, revues, preuves et artefacts sont rattachés à une organisation et protégés par RLS et par une identité OIDC vérifiée.

La bibliothèque réglementaire suit aujourd'hui un autre modèle. Les tables `regulatory.clauses`, `regulatory.clause_versions`, `regulatory.regulatory_sources`, `regulatory.requirements` et les relations associées représentent un référentiel commun au moteur. Elles ne portent pas `organization_id` et sont donc, par conception actuelle, **globales à la plateforme**.

En parallèle, `AuthorizationSubject` est organisation-scopé. Un utilisateur doté du rôle `LEGAL` agit au sein de son organisation. Lui donner directement une écriture sur les tables globales ferait donc franchir une frontière de sécurité : un juriste d'un tenant pourrait modifier le référentiel partagé de tous les tenants.

## Décision

1. **Aucune API d'écriture de clauses ou de sources globales n'est ouverte avec le modèle d'identité tenant actuel.**
2. Le GET `/api/regulatory/clauses` reste read-only.
3. Le lifecycle de domaine peut préparer `DRAFT -> DRAFT_LEGAL_REVIEW_REQUIRED -> APPROVED`, mais sa persistance globale est bloquée jusqu'à définition d'une identité/autorité plateforme.
4. `CLAUSE_ACTIVATE` reste sans grant. Aucune clause ne peut passer à `ACTIVE` via l'application V1.
5. `ready_for_submission=false` reste indépendant du lifecycle des clauses.
6. Une future administration globale devra disposer d'une provenance et d'un journal de transitions suffisants pour faire respecter la séparation des tâches au niveau persistant, pas seulement en mémoire.

## Lacunes du schéma actuel avant écriture globale

### Identité plateforme

Il manque une notion explicitement distincte de l'utilisateur d'organisation pour représenter les administrateurs du référentiel réglementaire partagé. Cette identité ne doit pas être déduite d'un rôle tenant existant.

### Provenance des versions de clauses

`clause_versions` contient actuellement `approved_by` et `approved_at`, mais pas une provenance complète de rédaction et de revue permettant de vérifier durablement :

- qui a créé la version ;
- qui a demandé la revue ;
- qui a approuvé ;
- qui a tenté une activation ;
- quels états ont été traversés et quand.

### Audit de transition

Une table append-only ou un mécanisme d'audit équivalent est requis pour les transitions du référentiel global. La seule valeur courante de `status` ne suffit pas comme preuve de gouvernance.

### Séparation des tâches persistante

L'interdiction `CLAUSE_AUTHOR_CANNOT_SOLE_APPROVE` est déjà testée dans le moteur RBAC. Pour une administration réelle, la base doit conserver assez de données pour réappliquer cette règle lors de chaque transition, y compris après redémarrage ou changement d'instance applicative.

## Architecture cible minimale avant ouverture des writes

La future tranche doit introduire, de manière additive et avec migration testée :

- un contexte d'identité plateforme explicitement vérifié ;
- une autorisation dédiée à l'administration globale ;
- la provenance auteur/reviewer/approver sur les versions de clauses ;
- un journal append-only de transitions ;
- une contrainte ou une transaction empêchant l'auto-approbation ;
- concurrence optimiste ou verrouillage transactionnel ;
- tests négatifs cross-tenant et tenant-vers-global ;
- aucune permission `CLAUSE_ACTIVATE` avant décision humaine formelle ;
- aucune activation automatique ;
- aucune modification de `ready_for_submission`.

## Ce qui peut continuer avant cette tranche

Sont autorisés sans franchir la frontière :

- lecture du catalogue ;
- génération du catalogue depuis les sources versionnées du dépôt ;
- visualisation du lifecycle ;
- tests du moteur de transition ;
- calcul read-only des rôles possédant un grant ;
- préparation documentaire des futures migrations ;
- revue humaine des textes et candidats réglementaires.

## Ce qui reste interdit

- `POST`, `PUT`, `PATCH` ou `DELETE` sur la bibliothèque globale avec une identité tenant ;
- promotion automatique vers `APPROVED` ou `ACTIVE` ;
- ajout silencieux d'un grant `CLAUSE_ACTIVATE` ;
- transformation d'un texte `DRAFT` ou `APPROVED` en obligation applicable sans revue juridique/conformité ;
- utilisation d'une approbation interne comme équivalent d'une validation du régulateur ;
- soumission réglementaire automatique.

## Conséquence

Le prochain développement d'administration de clauses n'est pas un simple CRUD. Il s'agit d'une capacité de **gouvernance plateforme**. Tant que cette couche n'existe pas et n'est pas validée, le référentiel applicatif demeure volontairement read-only même si le schéma SQL contient déjà des tables de clauses et versions.
