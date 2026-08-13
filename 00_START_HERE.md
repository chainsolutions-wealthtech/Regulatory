# 00_START_HERE — Point d’entrée obligatoire

> **Statut :** `APPLICABLE`  
> **Autorité :** ordre de lecture obligatoire du dépôt.  
> **Propriétaire :** propriétaire du dépôt (`@Patricked-code`).

## Finalité

Ce fichier empêche toute intervention sans contexte. Le dépôt existait avant l’adoption du Loop Engineering : cette intégration ne réinitialise ni son historique, ni son architecture, ni ses décisions, ni ses identifiants réglementaires.

La gouvernance consolidée impose une règle supplémentaire : aucune amélioration ne doit perdre, masquer ou régresser une capacité, une décision, une preuve, un identifiant, un format historique ou une information documentaire existante. Tout document pertinent doit être lu et son rôle compris avant modification.

## Ordre de lecture obligatoire

1. `00_START_HERE.md`
2. `GOVERNANCE.md`
3. `README.md`
4. `AGENTS.md`
5. `SOURCE_OF_TRUTH.md`
6. `PROJECT_CONTEXT.md`
7. `STATUS.md`
8. `SUIVI.md`
9. `TODO.md`
10. `NEXT_ACTION.md`
11. `LOOP_STATE.md`
12. `CURRENT_ITERATION.md`
13. `LOOP_ENGINEERING.md`
14. `docs/DECISIONS.md`
15. `docs/ARCHITECTURE.md`
16. `docs/PROSPECTUS_ENGINE_SPEC.md`
17. `docs/REGULATORY_MAPPING.md`
18. la spécification, la source, le schéma, la matrice, le document historique ou l’adaptateur directement concerné ;
19. les derniers commits pertinents et l’état des contrôles/CI disponibles.

Cet ordre complète, sans les supprimer, les obligations déjà inscrites dans `AGENTS.md`.

## Branche canonique

Pour `chainsolutions-wealthtech/Regulatory` :

```text
CANONICAL_WORK_BRANCH = main
NEW_BRANCH_CREATION = FORBIDDEN
NORMAL_WORK_PR = NOT_REQUIRED
FORCE_PUSH = FORBIDDEN
```

Le travail normal reste sur `main`. Aucun agent ne crée une branche temporaire, cachée ou spécialisée pour contourner cette règle.

## Avant toute action

- confirmer le dépôt `chainsolutions-wealthtech/Regulatory` ;
- confirmer `main` et relever le HEAD courant ;
- ne créer aucune branche et ne pas changer de branche ;
- inspecter l’arborescence et les derniers commits ;
- identifier les documents canoniques, adaptateurs, historiques, opérationnels et artefacts machine-readable ;
- lire tout document directement concerné avant de conclure qu’il est redondant ou obsolète ;
- rechercher les travaux existants avant toute création ;
- capturer une baseline des contrôles disponibles ;
- distinguer toute défaillance préexistante d’une régression introduite ;
- établir l’impact et les risques de régression ;
- inscrire l’action dans la boucle active.

## Principe de modification

Toujours privilégier, dans cet ordre :

`RÉUTILISER → CORRIGER → RENFORCER → ÉTENDRE → MIGRER COMPATIBLEMENT`.

Ne jamais recommencer, remplacer ou simplifier avec perte d’information lorsque l’existant peut être consolidé.

## Fin d’intervention

Mettre à jour, selon la portée réelle : `WORK_LOG.md`, `STATUS.md`, `LOOP_STATE.md`, `NEXT_ACTION.md`, `HANDOFF.md`, `SUIVI.md`, `TODO.md` et `CHANGELOG.md`. Aucune validation réglementaire, juridique, fiscale, technique ou de production ne doit être inventée.

## Checklist

- [ ] Ordre lu intégralement.
- [ ] `GOVERNANCE.md` et `AGENTS.md` respectés.
- [ ] Branche `main` et commit initial relevés.
- [ ] Source de vérité identifiée.
- [ ] Documents concernés lus et rôles compris.
- [ ] Artefacts existants préservés.
- [ ] Baseline et régressions préexistantes relevées.
- [ ] Action, contrôles et preuves consignés.
- [ ] Aucune nouvelle régression introduite.
