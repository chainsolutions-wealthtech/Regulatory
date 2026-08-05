# Plan de tests — Application Next.js

## Contrôles automatisés initiaux

- installation des dépendances de `apps/web` ;
- vérification TypeScript stricte ;
- build Next.js de production ;
- absence de secret ou de configuration de production ;
- conservation de `ready_for_submission = false` ;
- validation des identifiants de projet avant accès au système de fichiers.

## Tests d’intégration à ajouter

1. création d’un projet ;
2. lecture du catalogue applicable ;
3. enregistrement d’une réponse ;
4. invalidation d’une réponse devenue invisible ;
5. versionnement du fichier projet ;
6. écriture du journal d’audit ;
7. détection d’une réponse obligatoire manquante ;
8. détection d’une fourchette incohérente ;
9. génération d’un aperçu ;
10. maintien de l’interdiction de soumission.

## Recette navigateur requise

- tableau de bord desktop ;
- création d’un projet ;
- navigation dans les 18 groupes ;
- sauvegarde automatique ;
- contrôles et couverture ;
- aperçu documentaire ;
- responsive mobile ;
- navigation clavier et focus ;
- contraste et messages d’erreur.

La recette navigateur n’a pas encore été exécutée dans cette tranche. Elle est obligatoire avant toute qualification de l’interface comme terminée.
