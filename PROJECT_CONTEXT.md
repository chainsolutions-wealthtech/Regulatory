# PROJECT_CONTEXT — Contexte canonique commun

> **Statut :** `APPLICABLE`  
> **Date de photographie initiale :** 2026-08-05  
> **Dernière réconciliation factuelle :** 2026-08-13  
> **Propriétaire :** propriétaire du dépôt. Responsables métier, conformité, juridique, fiscal, technique et sécurité : `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.`

## Projet

Dépôt `chainsolutions-wealthtech/Regulatory`. GitHub expose actuellement le dépôt comme `public` au 2026-08-13. La visibilité attendue ou souhaitée par le propriétaire n’est pas déduite de cet état et reste `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.`

Le projet construit une plateforme de connaissance réglementaire et de génération assistée de prospectus OPCVM/FCP UMOA.

Branche de travail canonique actuelle : `main`. Une seule branche a été observée lors de la réconciliation du 2026-08-13.

## Vision active

La société de gestion décrit son fonds avec des données préremplies et un questionnaire progressif. La plateforme applique un corpus réglementaire versionné, un modèle canonique, un graphe de décision, des clauses juridiques versionnées, des contrôles déterministes et un moteur de composition documentaire. La validation humaine reste obligatoire.

Le produit est actuellement une plateforme de **pré-conformité** : aucune sortie ne doit être présentée comme agréée, visée, approuvée ou prête à soumission sans les validations formelles prévues. `ready_for_submission` reste `false`.

## État hérité avant LOOP-GOV-001

Cette section conserve la photographie historique antérieure au développement applicatif :

- documentation de gouvernance existante ;
- décisions `DEC-001` à `DEC-014` ;
- architecture canonique dans `docs/ARCHITECTURE.md` ;
- spécification dans `docs/PROSPECTUS_ENGINE_SPEC.md` ;
- mapping initial de la Circulaire n°05/CREPMF/2022 ;
- 62 exigences V1 atomisées ;
- quatre matrices CSV de 62 lignes au total ;
- modèle canonique V0.1 de 30 objets ;
- manifeste et validation structurelle ;
- aucune clause `APPROVED` ou `ACTIVE` ;
- Instruction n°66/CREPMF/2021 non encore atomisée à cette date.

Cette photographie n’est pas l’état courant ; voir `STATUS.md` et les artefacts machine-readable.

## Architecture et environnement actuellement vérifiés

- runtime racine : Node.js `>=22` ;
- application web : Next.js App Router + React + TypeScript sous `apps/web` ;
- architecture UI : Atomic Design ;
- moteur historique : `src/catalog`, `src/core`, `src/adapters`, `src/cli` ;
- génération : Markdown/JSON et DOCX déterministe ;
- génération/optimisation/validation DOCX : scripts Python ;
- modèle canonique : JSON Schema versionné ;
- base : migrations et tests PostgreSQL 17 ;
- persistance active du prototype : `local-json` ;
- adaptateur PostgreSQL transactionnel : implémenté et testé, non assimilé à une activation production ;
- sécurité applicative : politiques RBAC, workflow de revue et stockage de preuves structurés ;
- CI : GitHub Actions avec contrôles PostgreSQL, catalogues, TypeScript, build, API, moteurs et sécurité ;
- environnement de production réellement configuré/déployé : `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.`

Les commandes principales sont déclarées dans `package.json`, notamment `npm test`, `npm run document`, `npm run web:typecheck`, `npm run web:build`, `npm run web:test:api` et `npm run check`.

## Contraintes permanentes

- `CANONICAL_WORK_BRANCH = main` ;
- aucune création ou permutation de branche pour le travail normal ;
- aucune réécriture d’historique ;
- amélioration compatible uniquement, aucune régression ;
- aucune donnée inventée ;
- aucun contenu métier d’un autre projet ;
- aucune règle réglementaire sans source ;
- préservation des identifiants, formats historiques et artefacts non Markdown ;
- tout document pertinent est lu et intégré selon son rôle ;
- documentation et preuve intégrées au changement ;
- aucun déploiement implicite ;
- validations humaines obligatoires lorsque prévues.

## Baseline technique à ne pas masquer

Au HEAD `6eb645fcf66fe6944d665f51fc6cf0a6e1846376` précédant `LOOP-GOV-002`, la CI Regulatory présente une défaillance préexistante sur le test HTTP de composition historique, tandis que le schéma PostgreSQL, le catalogue, le typecheck, le repository PostgreSQL et le build Next.js passent ; la CI de sécurité passe. Voir `docs/09-loop/LOOP-GOV-002-GOVERNANCE-RECONCILIATION-2026-08-13.md`.

## Questions et blocages

Voir `OPEN_QUESTIONS.md`, `TODO.md`, `STATUS.md`, `LOOP_STATE.md` et `NEXT_ACTION.md`.

## Mise à jour

Mettre ce contexte à jour seulement lorsqu’un fait durable change. Les actions d’une intervention vont dans `WORK_LOG.md`; l’historique détaillé reste dans `SUIVI.md`.
