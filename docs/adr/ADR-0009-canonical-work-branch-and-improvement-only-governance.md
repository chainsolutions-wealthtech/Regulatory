# ADR-0009 — Branche canonique unique et gouvernance d'amélioration sans régression

> **Date :** 2026-08-13  
> **Statut :** `ACCEPTED`  
> **Portée :** gouvernance Git, agents, documentation, Loop Engineering  
> **Autorisation :** décision explicite du propriétaire dans le chantier de standardisation du dépôt.

## Contexte

Le dépôt `chainsolutions-wealthtech/Regulatory` possède déjà une gouvernance riche, un kit Loop Engineering intégré de manière additive, des documents historiques et opérationnels distincts, des artefacts réglementaires machine-readable, du code applicatif, des tests et des workflows CI.

Le propriétaire exige une règle renforcée : aucune régression ; toute intervention doit améliorer, corriger, renforcer ou étendre l'existant ; tous les documents doivent être lus et intégrés selon leur rôle plutôt que supprimés ou simplifiés parce qu'ils se recouvrent.

L'audit Git du 2026-08-13 constate une seule branche : `main`.

## Décision

1. `main` devient explicitement la `CANONICAL_WORK_BRANCH` de ce dépôt.
2. Le travail normal se fait uniquement sur cette branche.
3. La création de nouvelles branches par les agents reste interdite.
4. Une Pull Request n'est pas requise pour le travail normal gouverné sur `main`.
5. Force-push et réécriture d'historique restent interdits.
6. Toute modification suit une politique `IMPROVEMENT_ONLY` et `ZERO_REGRESSION`.
7. Tout document existant doit être lu, classifié et exploité avant toute décision de création, fusion, déplacement, dépréciation ou suppression.
8. Un recouvrement documentaire n'est jamais, seul, une preuve de redondance.
9. Les décisions, preuves, identifiants, sources, formats historiques et compatibilités existantes sont préservés.
10. Le Loop Engineering est renforcé par une baseline obligatoire, une vérification de non-régression et la persistance de l'état après chaque itération significative.
11. `GOVERNANCE.md` est créé comme adaptateur transversal vers les documents canoniques existants ; il ne remplace ni `AGENTS.md`, ni `SOURCE_OF_TRUTH.md`, ni `docs/01-governance/PROJECT_RULES.md`.

## Conséquences positives

- comportement uniforme des agents ;
- reprise fiable entre conversations ;
- réduction du risque de branches parallèles ;
- conservation des connaissances documentaires ;
- meilleure distinction entre amélioration et régression ;
- compatibilité descendante traitée comme exigence explicite ;
- meilleure traçabilité des états techniques et réglementaires.

## Risques

- une gouvernance très documentée peut diverger si les documents canoniques ne sont pas synchronisés ;
- le travail direct sur `main` exige des vérifications avant écriture et des commits atomiques ;
- les anciennes photographies d'état peuvent être interprétées à tort comme l'état courant si elles ne sont pas clairement marquées historiques.

## Mesures

- conserver `SOURCE_OF_TRUTH.md` comme matrice d'autorité ;
- utiliser les adaptateurs plutôt que dupliquer les règles ;
- mettre à jour `STATUS.md`, `SUIVI.md`, `TODO.md`, `LOOP_STATE.md`, `NEXT_ACTION.md`, `WORK_LOG.md` et `HANDOFF.md` selon la portée ;
- distinguer les régressions préexistantes de celles introduites par une itération ;
- conserver les anciens états historiques sans les réécrire.

## Rollback

Cette décision ne modifie aucun artefact métier, schéma, identifiant ou donnée. En cas de problème documentaire, les documents ajoutés peuvent être marqués `SUPERSEDED` par une ADR ultérieure ; l'historique ne doit pas être effacé.

## Preuves d'adoption

- branche observée : `main` uniquement ;
- HEAD de baseline : `6eb645fcf66fe6944d665f51fc6cf0a6e1846376` ;
- arbre de baseline : `d44446e18e390ae2f71750832a38078bf38aa441` ;
- documents historiques et Loop Engineering préexistants conservés ;
- aucune branche créée ;
- aucun artefact réglementaire métier modifié par cette décision.
