# ADR-0002 — Maintien du dépôt Git comme source de vérité

- **Date :** 2026-08-05
- **Statut :** ACCEPTED
- **Tâche :** `TASK-GOV-001`
- **Décisions historiques liées :** `DEC-004`, `DEC-009`, `DEC-012`

## Décision

Le dépôt, ses commits, documents canoniques et artefacts versionnés constituent la mémoire du projet. Les conversations ne sont pas canoniques.

## Conséquences

Toute information durable doit être inscrite dans Git avec provenance. Le risque de divergence entre Markdown et données machine-readable est contrôlé par manifestes, mappings et validations.

## Migration

Les informations déjà documentées sont conservées. Les futurs agents utilisent `00_START_HERE.md` et `SOURCE_OF_TRUTH.md`.

## Rollback

Un écart est corrigé par un commit additif et un journal de correction; l’historique n’est jamais réécrit.
