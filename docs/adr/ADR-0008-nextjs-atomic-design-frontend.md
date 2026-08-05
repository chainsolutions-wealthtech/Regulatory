# ADR-0008 — Next.js App Router et Atomic Design pour l’application

- **Statut :** ACCEPTED
- **Date :** 2026-08-05
- **Décideur :** propriétaire du projet
- **Portée :** interface et API locale du Prospectus Composer

## Contexte

Le moteur réglementaire et documentaire possède une tranche verticale exécutable. Le projet doit maintenant fournir un parcours utilisateur permettant de créer un projet, répondre au questionnaire, consulter les contrôles et générer un aperçu sans transformer le prospectus en source primaire des données.

Le propriétaire demande explicitement Next.js et Atomic Design.

## Décision

Créer l’application dans `apps/web` avec :

- Next.js App Router ;
- React et TypeScript ;
- Server Components par défaut ;
- Route Handlers pour l’API locale ;
- Atomic Design pour la couche de composants ;
- persistance JSON locale versionnée pour le prototype ;
- adaptateur vers le moteur existant ;
- aucun déploiement dans cette décision.

## Conséquences positives

- séparation claire entre UI, domaine et moteur réglementaire ;
- composants réutilisables et testables ;
- parcours progressif compatible desktop et mobile ;
- API et rendu serveur dans le même socle ;
- préparation d’une future base de données sans l’imposer prématurément.

## Risques et limites

- la persistance locale ne supporte pas la concurrence ni le multi-tenant ;
- le catalogue TypeScript initial doit être remplacé par un catalogue généré depuis les matrices ;
- l’authentification et le RBAC ne sont pas implémentés ;
- aucune clause ne devient approuvée par cette décision ;
- l’interface ne rend pas le dossier prêt pour soumission.

## Alternatives rejetées

- formulaire Word : ne permet pas le graphe, la traçabilité ni le recalcul ;
- application React monolithique : incompatible avec la structure Atomic Design demandée ;
- duplication du moteur dans Next.js : risque de divergence réglementaire ;
- déploiement immédiat : sécurité et persistance insuffisantes.
