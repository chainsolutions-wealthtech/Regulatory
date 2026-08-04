# HYPOTHESIS_REGISTER — Hypothèses de boucle

> **Statut :** `APPLICABLE`

Ce registre spécialise `ASSUMPTIONS.md` pour les hypothèses testées pendant une itération.

| ID | Boucle | Hypothèse | Test | Résultat attendu | Résultat réel | Décision |
|---|---|---|---|---|---|---|

## Règles

- formulation réfutable ;
- origine et risque ;
- test non destructif et preuve ;
- aucune hypothèse traitée comme fait ;
- invalidation propagée aux décisions, tâches et artefacts dépendants ;
- revue humaine pour les interprétations réglementaires.

## Clôture

Une hypothèse devient `CONFIRMED`, `REJECTED`, `INCONCLUSIVE` ou `SUPERSEDED`, sans suppression de l’historique.
