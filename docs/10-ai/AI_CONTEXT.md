# AI_CONTEXT — Contexte commun aux agents IA

> **Statut :** `APPLICABLE`

Tout agent doit lire `00_START_HERE.md`, `AGENTS.md`, `SOURCE_OF_TRUTH.md`, `PROJECT_CONTEXT.md`, l’état courant, les décisions, l’architecture, la spécification et les artefacts concernés.

## Contexte permanent

Projet UMOA/FCP, sources officielles versionnées, 62 exigences initiales de la Circulaire 05, modèle canonique V0.1, validation humaine obligatoire et politique Git sans création ni changement de branche.

## Règles

- ne pas importer le contexte métier d’un autre projet ;
- ne pas utiliser une conversation comme mémoire canonique ;
- ne pas inventer de source, donnée, règle, stack, commande ou approbation ;
- préserver identifiants, matrices, preuves et historique ;
- documenter les actions, contrôles, limites et handoff.

Les adaptateurs `CLAUDE.md`, `GEMINI.md` et Copilot renvoient vers ce contexte et `AGENTS.md`.
