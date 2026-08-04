# ADR-0001 — Adoption du Loop Engineering

- **Date :** 2026-08-05
- **Statut :** ACCEPTED
- **Tâche :** `TASK-GOV-001`
- **Décisions historiques liées :** `DEC-012`, `DEC-014`

## Contexte

Le dépôt possédait déjà vision, décisions, architecture, suivi et artefacts réglementaires. Le kit doit être intégré sans réinitialisation.

## Décision

Adopter le Loop Engineering comme couche de continuité : état réel, action bornée, preuves, documentation, handoff et prochaine action.

## Conséquences

La reprise devient reproductible. Le coût documentaire augmente et doit être maîtrisé par les documents canoniques, adaptateurs et health checks.

## Migration

Intégration additive; aucun fichier historique supprimé, renommé ou déplacé.

## Rollback

Marquer la boucle inactive et conserver les fichiers comme archives. Ne jamais effacer l’historique.

## Preuves

`DOCUMENT_INTEGRATION_MATRIX.md`, `WORK_LOG.md`, `SUIVI.md` et commits de LOOP-GOV-001.
