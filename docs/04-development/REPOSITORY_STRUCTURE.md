# REPOSITORY_STRUCTURE — Structure du dépôt

> **Statut :** `APPLICABLE`

## Racine

Documents de vision, gouvernance, état, boucle, tâches et index.

## Dossiers

- `.github/` : ownership, adaptateur Copilot et modèles ;
- `docs/` : documentation organisée par domaine ;
- `docs/adr/` : décisions structurantes ;
- `regulatory/` : sources, exigences, matrices, validation et manifeste machine-readable ;
- `schemas/` : modèles canoniques et futurs schémas.

## Règles

Les chemins historiques canoniques sont conservés. Les nouveaux chemins qui les recouvrent sont des adaptateurs. Le code applicatif sera ajouté seulement après décision d’architecture et ne doit pas mélanger données réglementaires, secrets et artefacts générés.

Toute réorganisation exige inventaire des consommateurs, ADR, migration, tests de liens, compatibilité et rollback. Aucune suppression, renommage ou déplacement n’est autorisé dans LOOP-GOV-001.
