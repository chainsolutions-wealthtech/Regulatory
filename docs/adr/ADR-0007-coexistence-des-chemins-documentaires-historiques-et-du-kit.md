# ADR-0007 — Coexistence des chemins historiques et du kit

- **Date :** 2026-08-05
- **Statut :** ACCEPTED
- **Tâche :** `TASK-GOV-001`
- **Décisions historiques liées :** `DEC-012`

## Contexte

Le kit prévoit certains chemins qui recouvrent des documents historiques déjà canoniques, notamment architecture, décisions, suivi, TODO et règles des agents.

## Décision

Conserver les chemins historiques comme canoniques et créer les nouveaux chemins comme index ou adaptateurs lorsque le sujet se chevauche. Aucun contenu canonique complet ne doit être dupliqué.

## Conséquences

La compatibilité avec l’historique est préservée. La matrice d’intégration et `SOURCE_OF_TRUTH.md` indiquent l’autorité de chaque fichier.

## Migration future

Une migration de chemin exige une ADR distincte, l’inventaire des consommateurs, une période de compatibilité, des redirections documentaires, des tests de liens et l’absence de perte d’historique.

## Rollback

Maintenir les chemins historiques comme canoniques et les nouveaux fichiers comme adaptateurs. Aucune suppression ni renommage automatique.
