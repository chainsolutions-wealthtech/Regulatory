# ADR-0006 — Contexte canonique commun aux agents

- **Date :** 2026-08-05
- **Statut :** ACCEPTED
- **Tâche :** `TASK-GOV-001`
- **Décisions historiques liées :** `DEC-004`, `DEC-012`, `DEC-014`

## Décision

Tous les agents partagent le même ordre de lecture et le même contexte canonique : `00_START_HERE.md`, `AGENTS.md`, `SOURCE_OF_TRUTH.md`, `PROJECT_CONTEXT.md`, état, suivi, tâches, décisions, architecture, spécification et artefacts concernés.

## Conséquences

`CLAUDE.md`, `GEMINI.md` et `.github/copilot-instructions.md` restent des adaptateurs courts. Les règles ne sont pas recopiées dans des variantes concurrentes.

## Risques

Un adaptateur obsolète peut induire une lecture incomplète. Les health checks doivent vérifier ses liens et son autorité déclarée.

## Migration

Ajouter les adaptateurs et enrichir `AGENTS.md` sans supprimer ses règles historiques.

## Rollback

Revenir à `AGENTS.md` comme point d’entrée unique; conserver les adaptateurs comme archives signalées.
