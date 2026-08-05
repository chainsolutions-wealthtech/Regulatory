# LOOP_STATE — État persistant de la boucle

> **Statut :** `APPLICABLE`

## Boucle active

- Loop : `LOOP-DEV-001`
- Tâche : `TASK-DEV-001 — Construire la première tranche verticale du Prospectus Composer`
- Type : développement applicatif et preuve exécutable
- État : `IN_PROGRESS`
- Date d’ouverture : `2026-08-05`
- Branche conservée : `main`
- Commit de départ : `a2a7d0a26802169a859b5bf02ca5e88798f483a8`
- Création ou changement de branche : interdit et non réalisé

## Boucle réglementaire suspendue

- Loop : `LOOP-REG-001`
- État : `PAUSED_BY_OWNER_PRIORITY`
- Motif : démarrage explicite du code demandé par le propriétaire
- Travail préservé : source et plan d’atomisation de l’Instruction n°66
- Reprise obligatoire : matérialisation, empreinte, index des articles, versions et crosswalk

## Objectif actif

Rendre exécutable la chaîne suivante sans casser les sources existantes :

```text
matrices CIRC005
+ données préchargées
+ réponses structurées
→ données canoniques
→ contrôles
→ clauses DRAFT
→ composants documentaires
→ prospectus de travail
→ concordance
→ manifeste
```

## Sorties disponibles

- `package.json` ;
- `IMPLEMENTATION.md` ;
- `src/adapters/circ005-matrix-loader.js` ;
- moteur de questionnaire, conditions, règles, clauses et composition ;
- fixture United Capital Diamond ;
- sorties générées sous `examples/generated/united-capital-diamond/` ;
- tests sous `test/` ;
- `ADR-0008`.

## Contrôles locaux

- tests : `7/7 PASS` ;
- exigences chargées : `62` ;
- questions applicables dans le cas : `58` ;
- composants générés : `29` ;
- exigences couvertes : `46` ;
- non applicables : `1` ;
- manquantes : `15` ;
- blocages : `0` ;
- avertissements : `2` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.

## Invariants

- conserver les identifiants `CIRC005_*` ;
- lire les matrices existantes au lieu de les recopier ;
- ne jamais transformer une fixture en règle normative ;
- ne jamais présenter une clause DRAFT comme approuvée ;
- conserver `ready_for_submission: false` avant les validations formelles ;
- produire des sorties déterministes pour un même snapshot ;
- ne pas créer de branche.

## Condition de reprise de LOOP-REG-001

La boucle réglementaire sera reprise après la tranche de couverture standard ou plus tôt si une règle d’implémentation dépend d’un article non atomisé de l’Instruction n°66.
