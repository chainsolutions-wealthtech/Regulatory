# ADR-0003 — Maintien de la politique de branche du dépôt

- **Date :** 2026-08-05
- **Statut :** ACCEPTED
- **Tâche :** `TASK-GOV-001`
- **Décision historique liée :** `DEC-011`

## Décision

Conserver la politique particulière : aucune nouvelle branche, aucun changement de branche sans instruction explicite, `main` par défaut, aucun force-push, aucune réécriture, suppression ou fusion.

## Risques

Les modifications directes augmentent le besoin de prudence. La mitigation repose sur lecture obligatoire, changements atomiques, diff, contrôles, preuves et commits réversibles.

## Migration

Aucune migration dans LOOP-GOV-001. Le kit générique est adapté à la politique existante.

## Rollback

Toute évolution future exige une décision explicite; aucun outil ne peut modifier cette politique automatiquement.
