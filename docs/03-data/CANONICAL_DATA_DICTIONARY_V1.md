# Dictionnaire de données canonique V1

> **Statut :** `IMPLEMENTATION_BASELINE`  
> **Périmètre :** OPCVM / FCP / UMOA / prospectus  
> **Contrat machine-readable :** `schemas/canonical/PROSPECTUS_CANONICAL_MODEL_V1.schema.json`  
> **Persistance cible :** `database/migrations/0001_regulatory_core.sql`

Ce dictionnaire décrit le contrat technique du Prospectus Composer. Il ne constitue ni une interprétation juridique définitive, ni une validation conformité, ni une décision de l’AMF-UMOA.

## 1. Principes

1. Une information métier possède un chemin canonique stable.
2. Une collection répétable possède un identifiant de ligne stable et unique dans la version du projet.
3. Les données préremplies, saisies, dérivées et extraites conservent leur provenance.
4. Une donnée présente n’est pas nécessairement confirmée.
5. Les validations juridiques, conformité, fiscales, risques et sécurité sont historisées séparément.
6. `ready_for_submission` reste verrouillé à `false` dans le schéma V1.
7. Le snapshot JSON exact et les lignes relationnelles normalisées sont conservés ensemble : le premier assure la reproductibilité, les secondes assurent l’intégrité et les requêtes.

## 2. Métadonnées réglementaires

| Chemin / table | Type | Cardinalité | Sensibilité | Source attendue | Validation principale |
|---|---|---:|---|---|---|
| `regulatory_context.jurisdiction` | enum | 1 | publique | configuration | `UMOA` |
| `regulatory_context.authority` | enum | 1 | publique | configuration | `AMF-UMOA` |
| `regulatory_context.rule_pack` | string | 1 | interne | registre réglementaire | non vide |
| `regulatory_context.rule_pack_version` | string | 0..1 | interne | manifeste | version ou empreinte |
| `regulatory_context.source_versions[]` | string[] | 0..n | publique | registres de sources | identifiants uniques |
| `regulatory_sources.sha256` | SHA-256 | 0..1 | publique | copie binaire officielle | 64 caractères hexadécimaux |
| `requirements.requirement_code` | string | 1 | publique | atomisation | unique et immuable |

## 3. Projet et versions

| Champ | Type | Cardinalité | Sensibilité | Source | Règle |
|---|---|---:|---|---|---|
| `projects.id` | UUID | 1 | interne | système | immuable |
| `projects.organization_id` | UUID | 1 | confidentielle | session tenant | obligatoire |
| `projects.canonical_slug` | string | 1 | interne | création | unique par organisation |
| `projects.legal_name` | string | 1 | publique | utilisateur / preuve | non vide |
| `projects.status` | enum | 1 | interne | workflow | transition contrôlée |
| `project_versions.version_number` | integer | 1 | interne | système | croissant, unique par projet |
| `project_versions.frozen_at` | timestamp | 0..1 | interne | approbation interne | version non modifiable après gel |
| `canonical_snapshots.snapshot_sha256` | SHA-256 | 1 | interne | générateur | unique par version |
| `canonical_snapshots.canonical_data` | JSONB | 1 | selon contenu | moteur | conforme au JSON Schema |

## 4. Fonds et organisations

| Chemin | Type | Cardinalité | Sensibilité | Source attendue | Statut initial |
|---|---|---:|---|---|---|
| `fund.canonical_id` | slug | 0..1 | publique | système | généré |
| `fund.legal_name` | string | 1 | publique | statuts / agrément | en attente de preuve si saisi |
| `fund.legal_form` | enum | 1 | publique | configuration | `FCP` |
| `fund.country_of_constitution` | ISO 3166-1 alpha-2 | 1 | publique | agrément | membre UMOA |
| `fund.currency` | ISO 4217 | 0..1 | publique | règlement | à confirmer |
| `fund.constitution_date` | date | 0..1 | publique | acte constitutif | à confirmer |
| `manager.legal_name` | string | 0..1 | publique | registre AMF-UMOA | prérempli, puis vérifié |
| `depositary.legal_name` | string | 0..1 | publique | agrément / convention | prérempli, puis vérifié |

## 5. Collections canoniques V1

### 5.1 Classes de parts — `share_classes[]`

| Champ | Type | Unité | Règle |
|---|---|---|---|
| `class_id` | stable ID | — | unique, `A-Z0-9_-`, 1 à 48 caractères |
| `currency` | ISO 4217 | — | trois lettres |
| `income_policy` | enum | — | `CAPITALIZED` ou `DISTRIBUTED` |
| `initial_nav` | decimal | devise de la classe | strictement positive |
| `initial_subscription_minimum.display` | string | — | non vide |
| `decimalization.display` | string | — | non vide |

### 5.2 Fourchettes d’allocation — `investment_policy.asset_class_ranges[]`

| Champ | Type | Unité | Règle |
|---|---|---|---|
| `range_id` | stable ID | — | unique |
| `asset_class` | référentiel | — | unique dans la version |
| `minimum_percent` | decimal | % | 0 à 100 |
| `target_percent` | decimal | % | 0 à 100 |
| `maximum_percent` | decimal | % | 0 à 100 |
| `review_status` | enum | — | `UNREVIEWED`, `PENDING_REVIEW`, `CONFIRMED` |

Contrôle interchamp : `minimum ≤ cible ≤ maximum`. La somme des minima ne peut pas dépasser 100 %. Aucune limite réglementaire supplémentaire n’est inventée par le schéma.

### 5.3 Frais et rémunérations — `fees.transaction[]` et `remunerations[]`

| Champ | Type | Unité | Règle |
|---|---|---|---|
| `fee_id` | stable ID | — | unique |
| `fee_type` | enum | — | souscription, rachat, gestion, dépositaire, audit, distribution, transaction ou autre |
| `payer_type` | enum | — | porteur ou actifs du fonds |
| `beneficiary` | string | — | non vide |
| `basis` | string | — | non vide |
| `rate_type` | enum | — | pourcentage, pour-mille, fixe, néant ou autre |
| `rate_percent` | decimal | % | requis si pourcentage |
| `rate_per_mille` | decimal | ‰ | requis si pour-mille |
| `amount` + `currency` | decimal + ISO 4217 | devise | requis si montant fixe |
| `frequency` | string | — | non vide |

### 5.4 Méthodes de valorisation — `valuation.methods[]`

| Champ | Type | Règle |
|---|---|---|
| `method_id` | stable ID | unique |
| `asset_class` | référentiel | une méthode principale par classe |
| `primary_method` | texte | non vide |
| `price_source` | texte | non vide |
| `fallback_method` | texte | non vide |
| `frequency` | texte | non vide |
| `exception_process` | texte | non vide |

Chaque classe d’actifs dont le maximum est supérieur à zéro doit disposer d’une méthode de valorisation.

### 5.5 Gouvernance et intervenants — `manager.governance_members[]` et `service_providers[]`

| Champ | Type | Sensibilité | Règle |
|---|---|---|---|
| `party_id` | stable ID | interne | unique |
| `role` | enum | publique | rôle canonique |
| `legal_name` | string | publique | obligatoire pour une organisation |
| `person_name` | string | personnelle | obligatoire pour un membre de gouvernance |
| `function_title` | string | publique | obligatoire pour un membre de gouvernance |
| `approval_number` | string | publique | à rapprocher du registre officiel |
| `conflicts` | texte | confidentielle | revue conformité / juridique |
| `verification_status` | enum | interne | la valeur par défaut n’est jamais `VERIFIED` |

### 5.6 Risques — `risks[]`

| Champ | Type | Règle |
|---|---|---|
| `risk_id` | stable ID | unique |
| `category` | enum | catégorie canonique |
| `label` | string | non vide |
| `description` | texte | non vide |
| `source` | enum | dérivé, utilisateur ou référentiel réglementaire |
| `review_status` | enum | confirmation risques/conformité requise |

### 5.7 Dispositifs pays — `distribution_countries[]`

| Champ | Type | Règle |
|---|---|---|
| `arrangement_id` | stable ID | unique |
| `country_code` | membre UMOA | unique dans la version |
| `is_home_state` | boolean | un seul État d’établissement par version |
| `marketing_authorization_reference` | string | non vide |
| `paying_agents` | texte | non vide |
| `redemption_locations` | texte | non vide |
| `information_locations` | texte | non vide |

Les codes sélectionnés dans `distribution.marketing_country_codes[]` sont distincts de ces objets détaillés.

### 5.8 Justificatifs — `evidence[]`

| Champ | Type | Sensibilité | Règle |
|---|---|---|---|
| `evidence_id` | stable ID | interne | unique |
| `evidence_type` | enum | interne | catégorie canonique |
| `title` | string | interne | non vide |
| `reference` | string | selon document | non vide |
| `issuer` | string | publique | non vide |
| `issue_date` | date | publique | format ISO |
| `file_reference` | URI / chemin logique | confidentielle | aucun binaire dans le JSON canonique |
| `file_sha256` | SHA-256 | interne | requis lors de la matérialisation sécurisée |
| `verification_status` | enum | interne | vérification humaine documentée |

## 6. Provenance et revue

Chaque réponse conserve :

- `questionId` ;
- exigences réglementaires ;
- chemins canoniques ;
- valeur ;
- source : `USER`, `PREFILLED`, `DERIVED` ou `EXTRACTED_UNVERIFIED` ;
- statut de revue ;
- horodatage et acteur.

Les décisions de revue ne modifient pas silencieusement la réponse. Elles créent une décision horodatée et, en cas de correction, une nouvelle version de projet.

## 7. Sensibilité

| Niveau | Exemples | Mesures attendues |
|---|---|---|
| publique | dénomination, agrément publié, clause finale publiée | intégrité et historisation |
| interne | réponses, contrôles, snapshots, règles | contrôle d’accès et audit |
| confidentielle | conflits, commentaires juridiques, pièces non publiques | chiffrement, accès au besoin d’en connaître |
| personnelle | noms, courriels, décisions nominatives | minimisation, rétention, droits d’accès |
| secret | clés, jetons, mots de passe | interdit dans le modèle canonique et le dépôt |

## 8. Compatibilité

- Une version mineure peut ajouter un champ facultatif.
- Une version majeure est obligatoire pour retirer, renommer ou changer le sens d’un champ.
- Les snapshots anciens restent lisibles par un adaptateur versionné.
- Une migration ne supprime jamais un champ non repris sans journal de perte explicite.
- Les identifiants réglementaires, de question et de ligne restent stables.
