# DOCUMENT_INTEGRATION_MATRIX — Matrice d’intégration documentaire

> **Statut :** `APPLICABLE`  
> **Boucle :** `LOOP-GOV-001`  
> **Périmètre détaillé :** les 176 chemins individuels sont recensés dans le manifeste du kit et contrôlés contre l’arborescence finale.

| Fichier demandé par le kit | Document existant correspondant | Action | Document canonique final | Risque de duplication | Statut |
|---|---|---|---|---|---|
| `README.md`, `AGENTS.md`, `CHANGELOG.md`, `TODO.md`, `.github/copilot-instructions.md` | mêmes chemins | `ENRICH_EXISTING` | mêmes chemins historiques | Moyen — perte historique | `DONE` |
| `docs/03-architecture/ARCHITECTURE.md` | `docs/ARCHITECTURE.md` | `CREATE_ADAPTER` | `docs/ARCHITECTURE.md` | Élevé — architecture concurrente | `DONE` |
| `DECISIONS.md` | `docs/DECISIONS.md` | `CREATE_INDEX` | `docs/DECISIONS.md` + `docs/adr/` | Élevé — décisions dupliquées | `DONE` |
| `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` | `AGENTS.md` | `CREATE_ADAPTER` / `ENRICH_EXISTING` | `AGENTS.md` | Élevé — règles divergentes | `DONE` |
| Documents racine nouveaux du kit | aucun | `CREATE_CANONICAL` ou `CREATE_REGISTER` | chemin créé | Faible à moyen | `DONE` |
| `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md` | aucun | `CREATE_TEMPLATE` | chemin créé | Faible | `DONE` |
| `docs/01-governance/*` | documents de gouvernance existants | `CREATE_CANONICAL`, `CREATE_REGISTER`, `CREATE_CONDITIONAL` | chemin créé, sans remplacer les historiques | Moyen | `DONE` |
| `docs/02-product/*` | `README.md`, `docs/PROSPECTUS_ENGINE_SPEC.md` | `CREATE_CANONICAL` / `CREATE_CONDITIONAL` | chemin créé; spécification historique conservée | Moyen | `DONE` |
| `docs/03-architecture/*` hors adaptateur | `docs/ARCHITECTURE.md` | `CREATE_CANONICAL` / `CREATE_CONDITIONAL` | détails spécialisés; architecture historique canonique | Moyen | `DONE` |
| `docs/04-development/*` à `docs/08-security/*` | aucun document spécialisé complet | `CREATE_CANONICAL` / `CREATE_CONDITIONAL` | chemins créés avec statut réel | Faible à moyen | `DONE` |
| `docs/09-loop/*`, `docs/10-ai/*` | `AGENTS.md`, `SUIVI.md`, règles existantes | `CREATE_REGISTER` / `CREATE_CANONICAL` / `CREATE_CONDITIONAL` | chemins créés; historiques conservés | Moyen | `DONE` |
| `docs/11-templates/*` | aucun | `CREATE_TEMPLATE` | chemins créés | Faible | `DONE` |
| `docs/12-optional/*` | aucun | `CREATE_CONDITIONAL` | chemins créés avec `À DÉTERMINER` | Moyen — usage prématuré | `DONE` |
| `docs/adr/README.md`, `docs/adr/ADR-0000-template.md` | `docs/DECISIONS.md` | `CREATE_INDEX` / `CREATE_TEMPLATE` | coexistence documentée | Moyen | `DONE` |

## Invariants

- Aucun fichier ne reçoit l’action `DELETE`, `REPLACE` ou `RENAME`.
- Aucun document historique n’est supprimé, déplacé ou réinitialisé.
- Les fichiers sous `regulatory/` et `schemas/` restent inchangés pendant cette intégration.
- Les sept ADR `ADR-0001` à `ADR-0007` complètent les décisions historiques sans les remplacer.
- Toute migration documentaire future exige une ADR, un inventaire des consommateurs, une période de compatibilité, des tests de liens et un rollback.

## Vérification individuelle

La présence individuelle des 176 chemins du kit est vérifiée par comparaison entre le manifeste source version 1.0.0 et l’arborescence du dépôt. Les résultats sont consignés dans `MANIFEST.md`, `docs/09-loop/LOOP_HEALTH_CHECK.md`, `SUIVI.md` et `HANDOFF.md`.
