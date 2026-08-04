# COMMIT_CONVENTION — Convention de commits

> **Statut :** `APPLICABLE`

## Format

`type: résultat précis`

Types : `docs`, `feat`, `fix`, `refactor`, `test`, `data`, `regulatory`, `security`, `chore`.

## Règles

- commit atomique et non vide ;
- message orienté résultat, pas activité vague ;
- documentation et contrôles inclus dans l’ensemble logique ;
- aucun secret ;
- aucun mélange de refonte non liée ;
- aucun commit destiné à contourner un test ou une validation ;
- diff vérifié avant écriture ;
- branche actuelle conservée sans force-push ni réécriture.

## Exemples

- `regulatory: atomize instruction 66 requirements`
- `docs: add loop state and handoff registers`
- `test: cover asset range validation`

Les commits de LOOP-GOV-001 peuvent être nombreux et séquentiels, mais doivent rester traçables dans `WORK_LOG.md` et `SUIVI.md`.
