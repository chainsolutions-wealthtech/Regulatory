# R4 — Progression des textes d'application externes de l'Instruction 66

> Date de référence : `2026-08-08`  
> Statut : `IN_PROGRESS`  
> Source de vérité des occurrences : `regulatory/registries/INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1.json`  
> File de recherche : `regulatory/registries/INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_V0_1.json`

## Inventaire déterministe

L'inventaire est dérivé des blocs OCR rattachés au PDF officiel hashé de l'Instruction n°66/CREPMF/2021.

État courant :

- `49` occurrences de dépendances externes ;
- `47` occurrences non résolues ;
- `2` occurrences déjà reliées à l'Instruction n°58/CREPMF/2019 matérialisée ;
- `26` articles concernés ;
- `34` renvois à une circulaire du Conseil Régional ;
- `7` renvois génériques à une instruction du Conseil Régional ;
- `5` renvois à la réglementation comptable spécifique ;
- `2` occurrences explicites de l'Instruction 58 ;
- `1` Instruction CREPMF supplémentaire explicitement nommée : Instruction n°61/CREPMF/2020.

Aucun regroupement d'occurrences ne vaut preuve qu'elles renvoient au même instrument.

## Dépendances nommées / candidates déjà structurées

### Instruction n°61/CREPMF/2020

- référence et intitulé observés directement dans l'Instruction 66 officielle matérialisée ;
- objet source : `regulatory/sources/INSTRUCTION_61_CREPMF_2020.yaml` ;
- propre binaire officiel et statut courant : encore à confirmer directement ;
- aucune publication secondaire n'est utilisée comme source normative ;
- activation : `FORBIDDEN_PENDING_OFFICIAL_SOURCE_IDENTIFICATION_AND_REVIEW`.

### Instruction n°64/CREPMF/2020

- registre AMF-UMOA : référence, intitulé et statut `NON_ABROGE` confirmés au `2026-08-08` ;
- objet source : `regulatory/sources/INSTRUCTION_64_CREPMF_2020.yaml` ;
- candidat officiel fort pour des renvois procéduraux des articles 5 et 17 ;
- propre binaire officiel non identifié dans la première passe publique ;
- aucun rapprochement Article 5/17 n'est marqué `RESOLVED` sans comparaison du texte propre.

### Règlement n°09/2006/CM/UEMOA — règles comptables spécifiques

- objet source : `regulatory/sources/REGLEMENT_09_2006_CM_UEMOA_ACCOUNTING.yaml` ;
- route gouvernementale institutionnelle identifiée via le Secrétariat Général du Gouvernement du Mali ;
- source d'archive gouvernementale matérialisée et contrôlée par la chaîne dédiée ;
- cinq occurrences `SPECIFIC_ACCOUNTING_REGULATION` sont mappées vers ce candidat dans `regulatory/registries/INST066_ACCOUNTING_DEPENDENCY_MAPPING_V0_1.json` ;
- les cinq restent `NOT_RESOLVED_CURRENT_VERSION_AND_SCOPE_REVIEW_PENDING` ;
- la recherche de version courante est documentée dans `regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/ACCOUNTING_CURRENT_VERSION_SEARCH_2026-08-08.yaml` ;
- aucun acte postérieur clairement identifié n'a été trouvé dans le périmètre public contrôlé permettant de conclure sur l'issue de la révision comptable AMF-UMOA annoncée en 2023 ;
- `current_version_inference_allowed=false`.

## Passes de recherche publique déjà documentées

### Article 4 — services auxiliaires des SGO

Preuve :
`regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/ART004_AUXILIARY_SERVICES_CIRCULAR_SEARCH_2026-08-08.yaml`

Résultat : `OFFICIAL_PUBLIC_REFERENCE_NOT_IDENTIFIED`.

### Article 5 — agrément des SGO

Résultat courant :

- Instruction 64/2020 = candidat officiel fort mais non textuellement comparé ;
- circulaire sur les frais généraux = référence officielle non identifiée ;
- circulaire sur liste des documents / programme d'activité = référence officielle non identifiée ;
- aucune dépendance Article 5 n'est résolue automatiquement.

### Articles 12–13 — liquidité / valorisation

Preuve :
`regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/ART012_013_LIQUIDITY_VALUATION_CIRCULAR_SEARCH_2026-08-08.yaml`

Résultats :

- circulaire risque de liquidité / profil / stress tests = `OFFICIAL_PUBLIC_REFERENCE_NOT_IDENTIFIED` ;
- circulaire critères/procédures de valorisation = `OFFICIAL_PUBLIC_REFERENCE_NOT_IDENTIFIED` ;
- dépendance comptable = mappée au candidat matérialisé Règlement 09/2006, mais version courante non conclue.

### Article 32 — communications publicitaires

Preuve :
`regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/ART032_ADVERTISING_CIRCULAR_SEARCH_2026-08-08.yaml`

Résultat : `OFFICIAL_PUBLIC_REFERENCE_NOT_IDENTIFIED`.

### Article 37 — reporting / états financiers

Preuve :
`regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/ART037_047_REPORTING_REDEMPTION_SUSPENSION_SEARCH_2026-08-08.yaml`

État :

- Instruction 58 = source matérialisée, mais toujours soumise à revue humaine ;
- réglementation comptable = candidat 09/2006 non résolu quant à la version courante ;
- circulaire de reporting = `OFFICIAL_PUBLIC_REFERENCE_NOT_IDENTIFIED`.

### Article 47 — suspension des rachats

Même preuve que ci-dessus.

Résultat : circulaire = `OFFICIAL_PUBLIC_REFERENCE_NOT_IDENTIFIED`.

### Article 53 — rémunérations, frais et commissions

Preuve :
`regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/ART053_FEES_REMUNERATION_CIRCULAR_SEARCH_2026-08-08.yaml`

Résultat : aucune référence officielle numérotée n'est identifiée pour les renvois relatifs aux rémunérations, frais, commissions ou méthodes de calcul.

### Articles 55 et 59 — pondérations / dérivés / risques

Preuve :
`regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/ART055_059_RISK_DERIVATIVES_CIRCULAR_SEARCH_2026-08-08.yaml`

Résultats :

- Article 55 : `OFFICIAL_PUBLIC_REFERENCE_NOT_IDENTIFIED` ;
- Article 59 : `OFFICIAL_PUBLIC_REFERENCE_NOT_IDENTIFIED`.

## File restante

La file machine-readable doit désormais piloter le traitement des articles non encore couverts par une passe structurée :

`regulatory/registries/INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_V0_1.json`

Les articles déjà marqués par le générateur comme `SEARCH_PASS_RECORDED_OR_IN_PROGRESS` ne doivent pas être recherchés de nouveau sans nouvelle source ou nouvel indice.

Les articles `74`, `75`, `76` et `80` sont classés `NEXT_TAIL_REVIEW` dans la file afin de fermer en priorité la fin du corpus, puis les articles intermédiaires encore `PENDING_STRUCTURED_REVIEW` seront traités dans l'ordre déterministe de la queue.

## Règles de résolution

Une dépendance ne passe à `RESOLVED` que si :

1. la référence ou le texte d'application est identifié depuis une source institutionnelle ;
2. son propre binaire officiel ou une copie institutionnelle juridiquement probante est matérialisé lorsque nécessaire ;
3. son identité, sa version, son statut et son périmètre sont comparés au renvoi exact de l'Instruction 66 ;
4. les modificatifs/rectificatifs pertinents sont contrôlés ;
5. la revue juridique est réalisée ;
6. la revue conformité est réalisée.

La simple proximité d'intitulé, la matérialisation d'un ancien texte ou une reproduction tierce ne vaut jamais résolution.

## Invariants

- `automatic_reference_inference_allowed=false` ;
- `automatic_dependency_resolution_allowed=false` ;
- `automatic_rule_reconstruction_allowed=false` ;
- `automatic_requirement_activation_allowed=false` ;
- `current_version_inference_allowed=false` lorsqu'une version actuelle n'est pas établie ;
- `ready_for_submission=false` ;
- revue juridique et conformité humaines obligatoires.
