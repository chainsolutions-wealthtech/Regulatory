# MANIFEST — Manifeste documentaire Loop Engineering

> **Statut :** `APPLICABLE`  
> **Validation documentaire :** `COMPLETED_WITH_DECLARED_LIMITATIONS`  
> **Date :** `2026-08-05`

## Source

- Kit : `loop-engineering-starter-kit`
- Version : `1.0.0`
- Fichiers totaux dans le ZIP : `177`
- Fichiers Markdown prévus par le kit : `176`
- Manifeste JSON dans le kit : `1`
- ZIP reçu : `loop-engineering-starter-kit(1).zip`
- Taille : `112477` octets
- SHA-256 : `8054b1ea4799364b5d709166536c927b2e28ddd47aba84553469a5469ffecc95`

## État initial du dépôt

- Fichiers totaux : `21`
- Fichiers Markdown : `11`
- Fichiers non Markdown : `10`
- Commit de départ : `7433be04ce00d0108c1e01441d5e49f01fb994f4`
- Branche conservée : `main`

## État après intégration

- Fichiers totaux : `213`
- Fichiers Markdown : `194`
- Fichiers non Markdown : `19`
- Fichiers créés depuis le commit de départ : `192`
- Markdown créés : `183`
- Fragments Base64 de l’archive créés : `9`
- Chemins Markdown du kit présents : `176/176`
- Documents Markdown historiques conservés : `11/11`
- Fichiers supprimés : `0`
- Fichiers renommés ou déplacés : `0`

Le nombre de `183` nouveaux Markdown comprend les `176` chemins du kit qui n’existaient pas tous initialement, les sept ADR propres à cette intégration et les documents d’intégration complémentaires hors kit, avec déduction des chemins du kit déjà présents au départ. Le total final vérifié est la référence opérationnelle.

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
- `.github/copilot-instructions.md` — instructions historiques complétées par les points d’entrée canoniques ;
- `STATUS.md`, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `WORK_LOG.md`, `HANDOFF.md`, `NEXT_ACTION.md` — registres de boucle et de reprise.

## Préservation des artefacts non Markdown

Les fichiers suivants existaient avant la boucle et ont conservé leurs blobs Git :

- `regulatory/manifest.yaml` ;
- `regulatory/sources/CIRC005_CREPMF_2022.yaml` ;
- `regulatory/requirements/CIRC005_FCP_REQUIREMENTS_V0_1.yaml` ;
- les quatre matrices CSV `CIRC005_FCP_MATRIX_*` ;
- `regulatory/validation/CIRC005_FCP_BOOTSTRAP_VALIDATION.json` ;
- `schemas/UMOA_FCP_CANONICAL_MODEL_V0_1.yaml` ;
- `.github/CODEOWNERS`.

## Contrôles réalisés

- [x] présence de tous les chemins du manifeste du kit ;
- [x] absence de fichier du kit vide ;
- [x] absence de fichier du kit limité à un titre ;
- [x] cohérence des nombres avec l’arborescence Git ;
- [x] présence de `FILES_CATALOG.md` et `DOCUMENT_INTEGRATION_MATRIX.md` ;
- [x] conservation des documents et décisions historiques ;
- [x] préservation des blobs YAML, CSV, JSON et schéma de départ ;
- [x] absence de suppression dans la comparaison Git ;
- [x] branche `main` conservée et seule branche présente lors du contrôle ;
- [x] aucune fusion, migration ou opération de déploiement ;
- [x] taille et empreinte du ZIP source enregistrées.

## Limites

- les liens internes essentiels et les adaptateurs ont été contrôlés, sans exécution d’un crawler exhaustif de tous les liens Markdown ;
- la recherche de secrets a été ciblée, sans pipeline de scanner dédié ;
- les contrôles sont documentaires et structurels, non juridiques ;
- l’archive est conservée en fragments Base64 et doit être reconstruite puis comparée à l’empreinte ci-dessus avant toute utilisation comme source binaire.

Les preuves détaillées sont consignées dans `docs/09-loop/LOOP_HEALTH_CHECK.md`, `WORK_LOG.md`, `SUIVI.md` et `HANDOFF.md`.
