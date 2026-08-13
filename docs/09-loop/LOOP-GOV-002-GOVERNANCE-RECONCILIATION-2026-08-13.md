# LOOP-GOV-002 — Réconciliation de gouvernance et d'état

> **Date d'ouverture :** 2026-08-13  
> **Statut :** `IN_PROGRESS`  
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

1. `PROJECT_CONTEXT.md` décrit encore le dépôt comme privé alors que GitHub l'expose actuellement comme public.
2. `PROJECT_CONTEXT.md` indique encore stack/base/build/test « à définir » alors qu'ils existent désormais.
3. `STATUS.md` porte une date de référence antérieure aux commits du 2026-08-10.
4. `TODO.md` conserve des checklists historiques non réconciliées avec des fonctionnalités déjà implémentées et testées ; elles doivent être conservées comme historique mais surmontées d'un overlay courant.
5. `CURRENT_ITERATION.md` conserve sa baseline historique et des critères initiaux devenus partiellement atteints ; cette histoire ne doit pas être supprimée.
6. `NEXT_ACTION.md` conserve un ancien blocage GitHub Actions lié à la facturation, alors que des workflows du 2026-08-10 ont réellement démarré et exécuté les tests.
7. les états de dépendances externes de l'Instruction 66 ont évolué après certaines photographies documentaires.

## Baseline CI actuelle — régression préexistante

Au HEAD initial `6eb645fc...` :

- `Security and Review Policy CI` : `SUCCESS` ;
- `Regulatory CI` : `FAILURE` ;
- schéma PostgreSQL : `PASS` ;
- catalogue web : `PASS` ;
- typecheck : `PASS` ;
- dépôt PostgreSQL transactionnel : `PASS` ;
- build Next.js : `PASS` ;
- test HTTP API : `FAIL` sur l'assertion `La composition historique doit réussir.` dans `scripts/test-web-api.mjs`.

Cette défaillance existe avant toute écriture de `LOOP-GOV-002`. Elle doit être traitée comme `PREEXISTING_REGRESSION_OR_TEST_FAILURE` et ne doit jamais être présentée comme un succès.

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
- réconciliation des photographies d'état sans réécrire l'histoire.

## Critères de sortie

- [ ] gouvernance transversale créée ;
- [ ] agents alignés sur la branche canonique et la règle improvement-only ;
- [ ] contexte courant corrigé ;
- [ ] état courant réconcilié ;
- [ ] TODO doté d'un overlay courant sans suppression de l'historique ;
- [ ] état des boucles clarifié ;
- [ ] prochaine action réconciliée ;
- [ ] handoff, suivi, journal et changelog synchronisés ;
- [ ] HEAD final vérifié ;
- [ ] aucune branche créée ;
- [ ] aucun artefact réglementaire métier modifié ;
- [ ] aucune régression nouvelle introduite.

## Prochaine action de cette boucle

Propager la décision de gouvernance dans les points d'entrée et adaptateurs existants, puis réconcilier les documents d'état avec le HEAD réel avant de reprendre les travaux métier.

<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:START -->
## Mise à jour automatique de preuve

Statut de la boucle : `VALIDATION_PASSED_CONTINUING_RECONCILIATION`.

- branche canonique : `main` ;
- HEAD source vérifié par la boucle : `6ab56d356cbf77caae1a5bc3f226113d86ab6a38` ;
- date du HEAD source : `2026-08-13` ;
- run Regulatory CI : `31663043558` ;
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

La clôture définitive exige encore la vérification du HEAD distant après le commit automatique de preuves et la confirmation qu’aucune branche n’a été créée. La visibilité GitHub souhaitée reste une question propriétaire distincte et ne bloque pas la conservation de l’état actuel.
<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:END -->
