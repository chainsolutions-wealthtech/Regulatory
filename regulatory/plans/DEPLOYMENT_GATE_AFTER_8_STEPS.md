# Déploiement serveur — gate après clôture des 8 étapes

> **Statut :** `DEPLOYMENT_FORBIDDEN_UNTIL_MASTER_PLAN_DONE`  
> **Plan maître :** `regulatory/plans/MASTER_COMPLETION_PLAN_8_STEPS.md`  
> **ready_for_submission :** `false`

## Décision

Le déploiement en ligne sur un serveur est la phase **postérieure** au plan maître en huit étapes. Il ne doit pas être utilisé pour contourner une étape incomplète ni pour faire de la production un environnement de test.

## Préconditions obligatoires avant tout déploiement

Les huit étapes doivent être `DONE` avec preuves :

1. CI réellement exécutée et verte sur la tête à déployer ;
2. corpus réglementaire bloquant fermé ou blocages institutionnels formellement acceptés sans activation des règles concernées ;
3. dépendances Instruction 66 fermées selon les statuts autorisés ;
4. revues humaines juridique/conformité/fiscale requises obtenues ;
5. seules les règles approuvées sont actives ;
6. frontend/backend industrialisés avec identité, tenant, PostgreSQL et stockage sécurisé réels ;
7. livrables DOCX/PDF/package de revue validés et reproductibles ;
8. E2E, sécurité, accessibilité, sauvegarde/restauration et recette exploitation passés.

## Interdictions avant ouverture du gate

- aucun déploiement de production ;
- aucun secret de production committé ;
- aucun domaine de production présenté comme service réglementaire final ;
- aucune soumission AMF-UMOA ;
- aucun `ready_for_submission=true` ;
- aucune activation automatique des règles candidates ;
- aucun barème sanctions calculé sans fermeture de R1 2016↔2022.

## Phase autorisée avant le gate

La préparation non destructive reste permise :

- définir l'architecture d'hébergement ;
- écrire Dockerfile/compose/manifests de pré-production ;
- documenter variables/secrets requis sans valeurs ;
- préparer healthchecks, migrations et rollback ;
- préparer monitoring, logs, sauvegardes et runbooks ;
- tester ces éléments uniquement dans un environnement éphémère/CI ou de pré-production autorisé.

## Ouverture du gate

Le déploiement ne devient `READY_FOR_DEPLOYMENT` que lorsqu'un rapport de clôture référence les preuves de sortie des huit étapes et confirme explicitement :

- `all_8_master_steps_done=true` ;
- `regulatory_ci_pass=true` ;
- `security_ci_pass=true` ;
- `production_readiness_review_pass=true` ;
- `ready_for_submission` reste géré séparément et ne découle jamais du simple déploiement technique.
