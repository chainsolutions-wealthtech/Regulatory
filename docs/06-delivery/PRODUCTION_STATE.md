# PRODUCTION_STATE — État de production

> **Statut :** `NON APPLICABLE`

## Justification

Aucune application, aucun environnement ni aucun déploiement n’existent dans l’état documenté du projet. Ce fichier empêche qu’un agent invente un état de production.

## Réactivation

Avant passage à `APPLICABLE`, une décision doit définir environnements, responsabilités, pipeline, sauvegarde, surveillance, rollback, secrets et preuve d’approbation. L’état initial devra être capturé sans inclure de secret.

## Interdictions

Ne jamais déclarer un service déployé, stable, disponible ou sauvegardé sans preuve technique vérifiable.

## Checklist

- [ ] statut réévalué avant tout déploiement ;
- [ ] décisions et environnements définis ;
- [ ] aucune donnée sensible publiée ;
- [ ] preuve de l’état réel jointe.
