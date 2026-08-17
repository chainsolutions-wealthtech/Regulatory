# LOOP-GOV-002 — Réconciliation de gouvernance et d'état

> **Date d'ouverture :** 2026-08-13  
> **Statut :** `CLOSED_OBJECTIVE_COMPLETE`  
> **Nature :** gouvernance, mémoire persistante, non-régression  
> **Branche :** `main`

## Objectif borné

Renforcer la gouvernance mono-branche et la règle d'amélioration sans régression, puis réconcilier la mémoire persistante avec l'état réellement atteint par le dépôt, sans supprimer, renommer, déplacer ou réinitialiser les documents, décisions, artefacts réglementaires ou composants existants.

## Baseline Git vérifiée

- dépôt : `chainsolutions-wealthtech/Regulatory` ;
- visibilité GitHub observée le 2026-08-13 : `public` ;
- visibilité attendue par le propriétaire : `TO_VERIFY` ;
- branche par défaut : `main` ;
- branches observées : `main` uniquement ;
- HEAD initial : `6eb645fcf66fe6944d665f51fc6cf0a6e1846376` ;
- arbre initial : `d44446e18e390ae2f71750832a38078bf38aa441` ;
- dernier commit initial : `fix: preserve legacy structured-answer API compatibility`.

## Baseline documentaire

La précédente intégration Loop Engineering a déjà établi une architecture additive :

- `194` fichiers Markdown après intégration ;
- `176/176` chemins Markdown du kit présents ;
- `0` fichier supprimé ;
- `0` politique de remplacement ou renommage retenue ;
- documents historiques, décisions, sources, schémas et artefacts réglementaires préservés.

Cette boucle ne remet pas ce travail en cause. Elle le consolide.

## Architecture réellement observée

Le dépôt n'est plus au simple cadrage initial. Il contient notamment :

- Node.js `>=22` ;
- une application Next.js App Router + React + TypeScript sous `apps/web` ;
- un moteur historique sous `src/` avec catalogue, adaptateurs, CLI et core ;
- génération documentaire Markdown/JSON/DOCX ;
- scripts Python de génération/optimisation/validation DOCX ;
- JSON Schema canonique ;
- migrations et tests PostgreSQL 17 ;
- RLS multi-tenant, versionnement et audit append-only testés ;
- politiques RBAC/workflow/evidence ;
- corpus réglementaire, registres, matrices, preuves et validations ;
- GitHub Actions pour CI, sécurité et construction des catalogues réglementaires.

L'activation production de PostgreSQL, de l'identité réelle, du stockage objet et des contrôles d'exploitation reste distincte de leur implémentation/test.

## Écarts documentaires identifiés

1. `PROJECT_CONTEXT.md` décrivait le dépôt comme privé alors que GitHub l'expose actuellement comme public ; le contexte durable a été corrigé sans modifier la visibilité.
2. `PROJECT_CONTEXT.md` indiquait encore stack/base/build/test « à définir » alors qu'ils existent ; le contexte actuel a été enrichi.
3. `STATUS.md` portait une date de référence antérieure aux commits du 2026-08-10 ; un overlay courant idempotent a été ajouté.
4. `TODO.md` conserve ses checklists historiques ; un overlay courant les réconcilie sans supprimer l'historique.
5. `CURRENT_ITERATION.md` conserve sa baseline historique ; un overlay courant distingue les résultats réellement atteints.
6. `NEXT_ACTION.md` conserve l'ancien blocage GitHub Actions comme preuve historique ; l'overlay courant précise qu'il n'est plus le blocage actuel.
7. les états de dépendances externes de l'Instruction 66 sont réconciliés depuis le registre machine-readable courant.

## Baseline CI — régression préexistante traitée

Au HEAD initial `6eb645fc...` :

- `Security and Review Policy CI` : `SUCCESS` ;
- `Regulatory CI` : `FAILURE` ;
- schéma PostgreSQL : `PASS` ;
- catalogue web : `PASS` ;
- typecheck : `PASS` ;
- dépôt PostgreSQL transactionnel : `PASS` ;
- build Next.js : `PASS` ;
- test HTTP API : `FAIL` sur l'assertion `La composition historique doit réussir.` dans `scripts/test-web-api.mjs`.

Cette défaillance préexistante a été diagnostiquée sans supprimer de couverture : les routes de test inexistantes ont été séparées du contrat HTTP réel, la compatibilité descendante a reçu son propre test, et le non-déterminisme PDF a été attribué au champ LibreOffice `/DocChecksum` puis corrigé par normalisation déterministe de longueur fixe.

## État réglementaire courant utile à la reprise

Le registre `INST066_CURRENT_EXTERNAL_DEPENDENCY_STATE_V0_1.json` indique :

- occurrences de dépendances : `49` ;
- résolues documentairement : `33` ;
- non résolues : `16` ;
- circulaires : `34`, dont `25` résolues et `9` non résolues ;
- instructions génériques : `7`, dont `5` résolues et `2` non résolues ;
- activation automatique : interdite ;
- revues juridique et conformité : en attente.

La prochaine action réglementaire `CM/10/06/2022` reste substantiellement valide : la référence, l'objet et l'adoption sont institutionnellement attestés, mais le binaire officiel/institutionnel n'est toujours pas matérialisé.

## Décisions de la boucle

- `CANONICAL_WORK_BRANCH = main` ;
- aucune nouvelle branche ;
- aucune PR de travail normale ;
- aucune suppression ou simplification documentaire par principe ;
- tous les documents doivent être lus et intégrés selon leur rôle ;
- amélioration uniquement ;
- compatibilité descendante et non-régression obligatoires ;
- création de `GOVERNANCE.md` comme adaptateur transversal, sans concurrence avec les documents canoniques existants ;
- création de l'ADR-0009 ;
- réconciliation des photographies d'état sans réécrire l'histoire ;
- réparation de la CI préexistante sans affaiblir les invariants ;
- maintien de `ready_for_submission=false`.

## Critères de sortie

- [x] gouvernance transversale créée ;
- [x] agents alignés sur la branche canonique et la règle improvement-only ;
- [x] contexte courant corrigé ;
- [x] état courant réconcilié ;
- [x] TODO doté d'un overlay courant sans suppression de l'historique ;
- [x] état des boucles clarifié ;
- [x] prochaine action réconciliée ;
- [x] handoff, suivi, journal et changelog synchronisés ;
- [x] HEAD distant vérifié ;
- [x] aucune branche créée ;
- [x] aucun artefact réglementaire métier supprimé ou réinitialisé ;
- [x] aucune régression nouvelle introduite ;
- [x] Regulatory CI validée ;
- [x] Security and Review Policy CI validée.

## Clôture et point de reprise

`LOOP-GOV-002 = CLOSED_OBJECTIVE_COMPLETE`.

La question de savoir si la visibilité GitHub `public` est intentionnelle reste une question propriétaire distincte et non bloquante ; aucune modification automatique de visibilité n'a été effectuée.

`POINT_DE_REPRISE_EXACT = RECOVER_OFFICIAL_OR_INSTITUTIONAL_BINARY_CM_10_06_2022_THEN_COMPARE_2016_2022`.

La prochaine action appartient à `LOOP-REG-001` : obtenir le binaire officiel ou institutionnel non indexé de la Décision `CM/10/06/2022` du 24 juin 2022, puis comparer ses clauses avec la décision sanctions 2016 déjà matérialisée. Aucune règle, sanction ou dépendance ne doit être activée automatiquement avant les revues humaines prévues.

<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:START -->
## Mise à jour automatique de preuve

Statut de la boucle : `CLOSED_OBJECTIVE_COMPLETE`.

- branche canonique : `main` ;
- HEAD source vérifié par la boucle : `d0f961b257a964f41f401e4eb2d49d1ce9030ddb` ;
- date du HEAD source : `2026-08-17` ;
- run Regulatory CI : `32062079858` ;
- validation API CIRC005 : `PASS` ;
- compatibilité descendante des 10 collections structurées : `PASS` ;
- persistance canonique des anciens payloads : `PASS` ;
- reproductibilité PDF après normalisation fixe des métadonnées LibreOffice, dont `/DocChecksum` : `PASS` ;
- dépôt PostgreSQL transactionnel : `PASS` ;
- `ready_for_submission` : `false` ;
- dépendances externes Instruction 66 : `49` occurrences, `33` résolues documentairement, `16` non résolues ;
- circulaires : `34` total, `25` résolues, `9` non résolues ;
- instructions génériques : `7` total, `5` résolues, `2` non résolues ;
- activation réglementaire automatique : `FORBIDDEN` ;
- revues juridique et conformité : `PENDING`.

Les critères de sortie sont satisfaits : gouvernance active, agents alignés, mémoire réconciliée sans suppression, CI fonctionnelle et sécurité validées, HEAD distant vérifié et une seule branche `main` confirmée. La visibilité GitHub souhaitée reste une question propriétaire distincte et non bloquante ; aucune modification automatique de visibilité n’a été effectuée.

`POINT_DE_REPRISE_EXACT = RECOVER_OFFICIAL_OR_INSTITUTIONAL_BINARY_CM_10_06_2022_THEN_COMPARE_2016_2022`.
<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:END -->
