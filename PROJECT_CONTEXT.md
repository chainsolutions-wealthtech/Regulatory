# PROJECT_CONTEXT — Contexte canonique commun

> **Statut :** `APPLICABLE`  
> **Date de photographie initiale :** 2026-08-05  
> **Propriétaire :** propriétaire du dépôt. Responsables métier, conformité, juridique, fiscal, technique et sécurité : `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.`

## Projet

Dépôt privé `chainsolutions-wealthtech/Regulatory`. Le projet construit une plateforme de connaissance réglementaire et de génération assistée de prospectus OPCVM/FCP UMOA.

## Vision active

La société de gestion décrit son fonds avec des données préremplies et un questionnaire progressif. La plateforme applique un corpus réglementaire versionné, un modèle canonique, un graphe de décision, des clauses juridiques versionnées, des contrôles déterministes et un moteur de composition documentaire. La validation humaine reste obligatoire.

## État hérité avant LOOP-GOV-001

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
- Instruction n°66/CREPMF/2021 non encore atomisée.

## Contraintes permanentes

- aucune création ou modification de branche ;
- aucune réécriture d’historique ;
- aucune donnée inventée ;
- aucun contenu métier d’un autre projet ;
- aucune règle réglementaire sans source ;
- préservation des identifiants et artefacts non Markdown ;
- documentation et preuve intégrées au changement ;
- aucun déploiement dans la boucle documentaire.

## Architecture et environnement

Architecture fonctionnelle documentée. Stack applicative, base de données, environnements, commandes de build et de test : `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.`

## Questions et blocages

Voir `OPEN_QUESTIONS.md`, `TODO.md` et `STATUS.md`.

## Mise à jour

Mettre ce contexte à jour seulement lorsqu’un fait durable change. Les actions d’une intervention vont dans `WORK_LOG.md`; l’historique détaillé reste dans `SUIVI.md`.
