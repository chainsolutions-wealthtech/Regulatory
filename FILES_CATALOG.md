# FILES_CATALOG — Catalogue documentaire

> **Statut :** `APPLICABLE`  
> **Photographie :** `2026-08-05`  
> **Autorité :** ce catalogue décrit les familles ; `SOURCE_OF_TRUTH.md` définit leur autorité.

## 1. Métriques documentaires

- fichiers Markdown avant `LOOP-GOV-001` : `11` ;
- fichiers Markdown après intégration : `194` ;
- chemins Markdown du kit version `1.0.0` : `176/176` présents ;
- ADR de gouvernance propres à l’intégration : `7` ;
- fragments Base64 historiques : `9`, statut `INVALID_UNVERIFIED_LEGACY_FRAGMENTS` ;
- copie binaire exacte du ZIP dans le dépôt : non disponible.

## 2. Documents canoniques historiques

| Domaine | Document canonique | Usage |
|---|---|---|
| Vision et périmètre | `README.md` | finalité, périmètre fonctionnel et état général |
| Règles agents | `AGENTS.md` | règles communes, branche, continuité, non-régression et boucle |
| Historique | `SUIVI.md` | journal chronologique immuable par ajout |
| Registre opérationnel | `TODO.md` | phases, tâches terminées, en cours, à faire et bloquées |
| Décisions historiques | `docs/DECISIONS.md` | décisions `DEC-*` et leur statut |
| Architecture | `docs/ARCHITECTURE.md` | architecture fonctionnelle et technique canonique |
| Spécification produit | `docs/PROSPECTUS_ENGINE_SPEC.md` | comportement du Prospectus Composer UMOA |
| Mapping réglementaire | `docs/REGULATORY_MAPPING.md` | traduction initiale des textes en exigences et objets |
| Artefacts structurés | `regulatory/` et `schemas/` | sources, exigences, matrices, validation et modèle canonique |

## 3. Point d’entrée et registres de boucle

| Fichier | Rôle | Ne remplace pas |
|---|---|---|
| `00_START_HERE.md` | ordre de lecture obligatoire | `AGENTS.md` |
| `SOURCE_OF_TRUTH.md` | hiérarchie d’autorité | les documents qu’il référence |
| `PROJECT_CONTEXT.md` | contexte stable et limites | `README.md` |
| `STATUS.md` | photographie actuelle | `SUIVI.md` |
| `LOOP_STATE.md` | état persistant d’une boucle | `TODO.md` |
| `CURRENT_ITERATION.md` | objectif borné en cours ou clôturé | `SUIVI.md` |
| `WORK_LOG.md` | actions, preuves et anomalies d’une boucle | `SUIVI.md` |
| `NEXT_ACTION.md` | une seule action exécutable | la feuille de route complète |
| `HANDOFF.md` | transmission au prochain intervenant | les sources canoniques |
| `OPEN_QUESTIONS.md` | informations non fournies ou non vérifiées | décisions formelles |

## 4. Index et adaptateurs

| Chemin | Nature | Autorité réelle |
|---|---|---|
| `DECISIONS.md` | index racine | `docs/DECISIONS.md` et `docs/adr/` |
| `docs/03-architecture/ARCHITECTURE.md` | adaptateur | `docs/ARCHITECTURE.md` |
| `CLAUDE.md` | adaptateur agent | `00_START_HERE.md` et `AGENTS.md` |
| `GEMINI.md` | adaptateur agent | `00_START_HERE.md` et `AGENTS.md` |
| `.github/copilot-instructions.md` | adaptateur agent | `00_START_HERE.md`, `AGENTS.md`, `SOURCE_OF_TRUTH.md` |
| `docs/adr/README.md` | index ADR | ADR individuelles et registre historique |

Un adaptateur ne doit pas recopier intégralement son document canonique. Toute divergence est une anomalie à enregistrer dans `DRIFT_DETECTION.md`.

## 5. Familles documentaires

| Famille | Emplacement | Rôle | Statut d’usage |
|---|---|---|---|
| Gouvernance | racine et `docs/01-governance/` | contexte, décisions, responsabilités, changements, audit | applicable selon le document |
| Produit | `docs/02-product/` | vision, usages, exigences, priorisation et validation | fonctionnel ou conditionnel |
| Architecture | `docs/03-architecture/` | vues détaillées ; architecture historique canonique | spécialisations et adaptateurs |
| Développement | `docs/04-development/` | conventions, workflow, configuration et dépendances | plusieurs éléments à déterminer |
| Qualité | `docs/05-quality/` | stratégie de test, validations et non-régression | documentaire avant code |
| Delivery | `docs/06-delivery/` | build, versionnement, release et procédures conditionnelles | non opérationnel sans stack |
| Opérations | `docs/07-operations/` | exploitation, incidents, sauvegarde, SLO et runbooks | conditionnel, production absente |
| Sécurité | `docs/08-security/` | accès, secrets, vulnérabilités, vie privée et menace | principes applicables, mise en œuvre à définir |
| Boucle | `docs/09-loop/` | itérations, apprentissages, preuves et santé | applicable |
| IA | `docs/10-ai/` | contexte, autonomie, outils, limites et revues | applicable aux agents |
| Modèles | `docs/11-templates/` | modèles sans données réelles | utilisables après adaptation |
| Optionnel | `docs/12-optional/` | modules non confirmés | `À DÉTERMINER` ou non applicable avec justification |
| ADR | `docs/adr/` | décisions structurantes détaillées | applicable |
| Kit | `docs/kits/` | métadonnées et historique de l’intégration | fragments binaires exclus de la source de vérité |

## 6. Catalogues et preuves de l’intégration

- `DOCUMENT_INTEGRATION_MATRIX.md` : action retenue par famille et invariant de non-régression ;
- `MANIFEST.md` : nombres, source, contrôles et limites ;
- `docs/09-loop/LOOP_HEALTH_CHECK.md` : critères de santé et clôture ;
- `WORK_LOG.md` : journal des opérations et anomalies ;
- `docs/kits/README.md` : intégrité du kit et statut des fragments ;
- `CHANGELOG.md` : changements livrables ;
- `SUIVI.md` : historique chronologique canonique.

## 7. Règles de maintenance

Après toute évolution documentaire importante :

1. vérifier `SOURCE_OF_TRUTH.md` ;
2. rapprocher l’arborescence de `MANIFEST.md` ;
3. mettre à jour `DOCUMENT_INTEGRATION_MATRIX.md` si une nouvelle correspondance apparaît ;
4. contrôler que les adaptateurs ne divergent pas ;
5. mettre à jour `STATUS.md`, `WORK_LOG.md`, `SUIVI.md`, `TODO.md` et `HANDOFF.md` selon la portée ;
6. ne jamais supprimer ou renommer un chemin canonique sans ADR, migration, compatibilité et rollback ;
7. ne jamais utiliser les fragments Base64 historiques comme archive du kit.
