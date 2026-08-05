# MANIFEST — Manifeste documentaire Loop Engineering

> **Statut :** `APPLICABLE`  
> **Validation documentaire :** `COMPLETED_WITH_DECLARED_LIMITATIONS`  
> **Date :** `2026-08-05`

## Source

- Kit : `loop-engineering-starter-kit`
- Version : `1.0.0`
- Fichiers totaux dans le ZIP source : `177`
- Fichiers Markdown prévus par le kit : `176`
- Manifeste JSON dans le kit : `1`
- ZIP reçu : `loop-engineering-starter-kit(1).zip`
- Taille du ZIP source : `112477` octets
- SHA-256 du ZIP source : `8054b1ea4799364b5d709166536c927b2e28ddd47aba84553469a5469ffecc95`

## État initial du dépôt

- Fichiers totaux : `21`
- Fichiers Markdown : `11`
- Fichiers non Markdown : `10`
- Commit de départ : `7433be04ce00d0108c1e01441d5e49f01fb994f4`
- Branche conservée : `main`

## État après intégration des chemins

- Fichiers totaux avant les mises à jour finales : `213`
- Fichiers Markdown : `194`
- Fichiers non Markdown : `19`
- Fichiers créés depuis le commit de départ : `192`
- Markdown créés : `183`
- Fragments Base64 historiques créés : `9`
- Chemins Markdown du kit présents : `176/176`
- Documents Markdown historiques conservés : `11/11`
- Fichiers supprimés : `0`
- Fichiers renommés ou déplacés : `0`

Le nombre de `183` nouveaux Markdown comprend les chemins du kit absents au départ, les sept ADR propres à cette intégration et les documents d’intégration complémentaires hors kit. Le total final de `194` Markdown est la référence documentaire.

## Documents canoniques historiques maintenus

- `README.md`
- `AGENTS.md`
- `SUIVI.md`
- `TODO.md`
- `docs/DECISIONS.md`
- `docs/ARCHITECTURE.md`
- `docs/PROSPECTUS_ENGINE_SPEC.md`
- `docs/REGULATORY_MAPPING.md`

## Adaptateurs ou index principaux

- `00_START_HERE.md` — ordre de lecture ;
- `SOURCE_OF_TRUTH.md` — hiérarchie d’autorité ;
- `DECISIONS.md` — index vers le registre historique et les ADR ;
- `docs/03-architecture/ARCHITECTURE.md` — adaptateur vers l’architecture canonique ;
- `CLAUDE.md` et `GEMINI.md` — adaptateurs vers les règles communes ;
- `.github/copilot-instructions.md` — adaptateur vers les points d’entrée canoniques ;
- `STATUS.md`, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `WORK_LOG.md`, `HANDOFF.md`, `NEXT_ACTION.md` — registres de boucle et de reprise.

## Préservation des artefacts non Markdown historiques

Les fichiers suivants existaient avant la boucle et doivent conserver leurs blobs Git :

- `regulatory/manifest.yaml` ;
- `regulatory/sources/CIRC005_CREPMF_2022.yaml` ;
- `regulatory/requirements/CIRC005_FCP_REQUIREMENTS_V0_1.yaml` ;
- les quatre matrices CSV `CIRC005_FCP_MATRIX_*` ;
- `regulatory/validation/CIRC005_FCP_BOOTSTRAP_VALIDATION.json` ;
- `schemas/UMOA_FCP_CANONICAL_MODEL_V0_1.yaml` ;
- `.github/CODEOWNERS`.

## Intégrité de l’archive source

Les neuf fichiers sous `docs/kits/parts/` sont des fragments historiques non validés. Ils ne constituent pas une copie fidèle du ZIP :

- Base64 attendu : `149972` caractères en `13` parties à `12000` caractères, dernière partie `5972` ;
- fragments présents : `9` ;
- longueur cumulée observée : `164786` caractères ;
- reconstruction et SHA-256 : non conformes ou non exécutables de manière fiable.

Ils sont conservés pour la traçabilité et portent le statut `INVALID_UNVERIFIED_LEGACY_FRAGMENTS`. La source de vérité documentaire repose sur l’empreinte du ZIP reçu, son manifeste, l’inventaire et la présence des `176/176` chemins intégrés. Voir `docs/kits/README.md`.

## Contrôles réalisés

- [x] présence de tous les chemins du manifeste du kit ;
- [x] absence de fichier Markdown du kit vide ;
- [x] absence de fichier Markdown du kit limité à un titre ;
- [x] cohérence des nombres de chemins avec l’arborescence Git ;
- [x] présence de `FILES_CATALOG.md` et `DOCUMENT_INTEGRATION_MATRIX.md` ;
- [x] conservation des documents et décisions historiques ;
- [x] préservation des blobs YAML, CSV, JSON et schéma de départ ;
- [x] absence de suppression dans la comparaison Git ;
- [x] branche `main` conservée ;
- [x] aucune fusion, migration ou opération de déploiement ;
- [x] taille et empreinte du ZIP source enregistrées ;
- [x] anomalie des fragments Base64 détectée et déclarée ;
- [ ] copie binaire exacte du ZIP archivée dans le dépôt.

## Limites

- les liens internes essentiels et les adaptateurs ont été contrôlés, sans crawler exhaustif de tous les liens Markdown ;
- la recherche de secrets est ciblée, sans pipeline de scanner dédié ;
- les contrôles sont documentaires et structurels, non juridiques ;
- les neuf fragments Base64 actuels sont inutilisables comme preuve binaire et ne doivent pas être reconstruits comme archive canonique.

Les preuves détaillées sont consignées dans `docs/09-loop/LOOP_HEALTH_CHECK.md`, `WORK_LOG.md`, `SUIVI.md`, `HANDOFF.md` et `docs/kits/README.md`.
