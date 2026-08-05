# DOCUMENT_INTEGRATION_MATRIX — Matrice d’intégration documentaire

> **Statut :** `APPLICABLE`  
> **Boucle :** `LOOP-GOV-001` — `CLOSED`  
> **Périmètre détaillé :** les `176` chemins individuels sont recensés dans le manifeste du kit version `1.0.0` et ont été rapprochés de l’arborescence finale.

| Fichier ou famille demandée | Document existant correspondant | Action réalisée | Document canonique final | Risque traité | Statut |
|---|---|---|---|---|---|
| `README.md` | `README.md` historique | `ENRICH_EXISTING` sans suppression de contenu historique | `README.md` | ordre de lecture et structure devenus obsolètes | `DONE` |
| `AGENTS.md` | `AGENTS.md` historique | `ENRICH_EXISTING` sans supprimer les règles antérieures | `AGENTS.md` | agents ignorant le nouveau point d’entrée | `DONE` |
| `CHANGELOG.md` | `CHANGELOG.md` historique | `ENRICH_EXISTING` | `CHANGELOG.md` | livraison documentaire non tracée | `DONE` |
| `TODO.md` | `TODO.md` historique | `ENRICH_EXISTING` et clôture de la tâche d’attente du prompt | `TODO.md` | réinitialisation de la feuille de route | `DONE` |
| `SUIVI.md` | `SUIVI.md` historique | `APPEND_HISTORY` | `SUIVI.md` | perte de l’historique antérieur | `DONE` |
| `.github/copilot-instructions.md` | instructions historiques | `ENRICH_EXISTING_AS_ADAPTER` | `AGENTS.md` + `00_START_HERE.md` | règles divergentes | `DONE` |
| `docs/03-architecture/ARCHITECTURE.md` | `docs/ARCHITECTURE.md` | `CREATE_ADAPTER` | `docs/ARCHITECTURE.md` | architecture concurrente | `DONE` |
| `DECISIONS.md` | `docs/DECISIONS.md` | `CREATE_INDEX` | `docs/DECISIONS.md` + `docs/adr/` | décisions dupliquées | `DONE` |
| `CLAUDE.md`, `GEMINI.md` | `AGENTS.md` | `CREATE_ADAPTER` | `AGENTS.md` | règles propres à un agent | `DONE` |
| `00_START_HERE.md` | ordre historique réparti entre plusieurs documents | `CREATE_CANONICAL` | `00_START_HERE.md` | démarrage sans contexte | `DONE` |
| `SOURCE_OF_TRUTH.md` | autorité implicite | `CREATE_CANONICAL` | `SOURCE_OF_TRUTH.md` | conflit silencieux entre documents | `DONE` |
| `STATUS.md` | aucun état instantané séparé | `CREATE_REGISTER` | `STATUS.md` | confusion avec l’historique | `DONE` |
| `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `WORK_LOG.md`, `HANDOFF.md`, `NEXT_ACTION.md` | `SUIVI.md` et `TODO.md` | `CREATE_REGISTER` | chemins créés, sans remplacer les historiques | perte de reprise et mauvaise attribution | `DONE` |
| Documents racine nouveaux du kit | aucun | `CREATE_CANONICAL`, `CREATE_REGISTER` ou `CREATE_TEMPLATE` | chemins créés | information non structurée | `DONE` |
| `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md` | aucun | `CREATE_TEMPLATE` | chemins créés | demandes sans contexte | `DONE` |
| `docs/01-governance/*` | documents de gouvernance existants | `CREATE_CANONICAL`, `CREATE_REGISTER`, `CREATE_CONDITIONAL` | chemins créés, historiques conservés | duplication de gouvernance | `DONE` |
| `docs/02-product/*` | `README.md`, `docs/PROSPECTUS_ENGINE_SPEC.md` | `CREATE_CANONICAL` / `CREATE_CONDITIONAL` | documents spécialisés ; spécification historique maintenue | périmètre inventé | `DONE` |
| `docs/03-architecture/*` hors adaptateur | `docs/ARCHITECTURE.md` | `CREATE_SPECIALIZED` / `CREATE_CONDITIONAL` | détails spécialisés ; architecture historique canonique | choix techniques prématurés | `DONE` |
| `docs/04-development/*` à `docs/08-security/*` | aucun document spécialisé complet | `CREATE_CANONICAL` / `CREATE_CONDITIONAL` | chemins créés avec statut réel | procédure fictive | `DONE` |
| `docs/09-loop/*`, `docs/10-ai/*` | `AGENTS.md`, `SUIVI.md`, règles existantes | `CREATE_REGISTER`, `CREATE_CANONICAL`, `CREATE_CONDITIONAL` | chemins créés ; historiques conservés | automatisation sans contrôle | `DONE` |
| `docs/11-templates/*` | aucun | `CREATE_TEMPLATE` | chemins créés | données réelles confondues avec modèles | `DONE` |
| `docs/12-optional/*` | aucun | `CREATE_CONDITIONAL` | chemins créés avec statut explicite | activation prématurée | `DONE` |
| `docs/adr/README.md`, `docs/adr/ADR-0000-template.md` | `docs/DECISIONS.md` | `CREATE_INDEX` / `CREATE_TEMPLATE` | coexistence documentée | décisions éclatées | `DONE` |
| sept ADR de gouvernance | décisions historiques `DEC-011`, `DEC-012`, `DEC-014` et règles du prompt | `CREATE_ADR` | `docs/adr/ADR-0001` à `ADR-0007` | décision implicite ou non traçable | `DONE` |
| kit source | ZIP transmis hors dépôt | `ARCHIVE_DOCUMENTARY` | `docs/kits/` + empreinte dans `MANIFEST.md` | perte de la source de taxonomie | `DONE` |
| `regulatory/` et `schemas/` | artefacts machine-readable historiques | `PRESERVE_NO_CHANGE` | mêmes chemins et mêmes blobs | régression réglementaire | `DONE` |

## Invariants appliqués

- aucune action `DELETE`, `REPLACE` ou `RENAME` ;
- aucun document historique supprimé, déplacé ou réinitialisé ;
- aucune entrée historique de `SUIVI.md` supprimée ;
- aucune phase de `TODO.md` supprimée ;
- aucune décision de `docs/DECISIONS.md` réécrite ;
- aucune duplication intégrale de l’architecture ou des décisions ;
- fichiers sous `regulatory/` et `schemas/` inchangés ;
- sept ADR `ADR-0001` à `ADR-0007` ajoutées sans se substituer aux décisions historiques ;
- toute migration documentaire future exige une ADR, l’inventaire des consommateurs, une période de compatibilité, des tests de liens et un plan de retour arrière.

## Résultat quantifié

- Markdown initial : `11` ;
- Markdown final : `194` ;
- chemins du kit : `176/176` ;
- créations depuis le commit de départ : `192` fichiers ;
- suppressions : `0` ;
- branche conservée : `main`.

## Limites

Le rapprochement individuel des chemins est effectué contre le manifeste et l’arbre Git. Les liens canoniques essentiels ont été inspectés, mais un crawler exhaustif de tous les liens Markdown devra être ajouté lorsque l’outillage de validation documentaire sera défini.
