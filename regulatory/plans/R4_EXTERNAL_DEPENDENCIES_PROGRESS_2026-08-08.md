# R4 — Progression des textes d'application externes de l'Instruction 66

> Date de référence : `2026-08-08`  
> Statut : `IN_PROGRESS — OFFICIAL_2022_CIRCULAR_SERIES_DISCOVERED`  
> Source de vérité des occurrences : `regulatory/registries/INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1.json`  
> File de recherche : `regulatory/registries/INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_V0_1.json`

## Inventaire déterministe Instruction 66

L'inventaire est dérivé des blocs OCR rattachés au PDF officiel hashé de l'Instruction n°66/CREPMF/2021.

État :

- `49` occurrences de dépendances externes ;
- `47` occurrences initialement non résolues ;
- `2` occurrences déjà reliées à l'Instruction n°58/CREPMF/2019 matérialisée ;
- `26` articles concernés ;
- `34` renvois à une circulaire du Conseil Régional ;
- `7` renvois génériques à une instruction du Conseil Régional ;
- `5` renvois à la réglementation comptable spécifique ;
- `2` occurrences explicites de l'Instruction 58 ;
- `1` Instruction CREPMF supplémentaire explicitement nommée : Instruction n°61/CREPMF/2020.

Aucun regroupement d'occurrences ne vaut preuve qu'elles renvoient au même instrument.

## Découverte structurante — API publique actuelle AMF-UMOA

Les premières passes de recherche web avaient laissé plusieurs circulaires au statut `OFFICIAL_PUBLIC_REFERENCE_NOT_IDENTIFIED`. Cette conclusion décrivait correctement le périmètre **indexé par les moteurs**, mais pas l'existence de textes dans le système documentaire de l'AMF-UMOA.

Le frontend actuel `https://www.amf-umoa.org` a été analysé de manière non mutatrice. Son bundle Angular expose :

- `JupiterPortailService` ;
- `SERVICE_PREFIX = /service/api/elastic` ;
- `fetchActualities(criteria)` → `GET /service/api/elastic/actualite` ;
- la page `actuality-details` appelle ce service avec `id=actualiteId` et `langue`.

Le diagnostic est conservé dans :

`regulatory/diagnostics/AMF_UMOA_FRONTEND_ENDPOINT_DISCOVERY_2026-08-08.json`

### Validation par témoins

Avant tout balayage, deux objets institutionnels connus ont été imposés comme témoins :

- `actualiteId=1000138` doit retourner `CIRCULAIRE N°010-2022` ;
- `actualiteId=1000141` doit retourner `CIRCULAIRE N°013-2022`.

Les deux témoins ont passé la validation.

Le scan API borné a ensuite produit :

`regulatory/registries/AMF_UMOA_2022_CIRCULAR_API_REGISTRY_V0_1.json`

Résultat :

- `status = COMPLETE_01_TO_16` ;
- `discoveredCount = 16` ;
- `missingNumbers = []` ;
- `duplicates = []` ;
- API : `https://www.amf-umoa.org/service/api/elastic/actualite` ;
- chaque objet est rattaché à son `actualiteId` ;
- les objets observés portent `categorie=Circulaire`, `valide=true`, `abroge=false` ;
- le champ `doc` contient un PDF encodé en Base64 ;
- le champ `documentUrl` conserve également un identifiant de fichier PDF.

Le champ API `date=2023-09-12` et les `createdDate` de septembre 2023 sont traités comme métadonnées de publication/enregistrement du portail. Ils **ne sont pas promus en date d'adoption ou d'effet** des circulaires référencées `2022`.

## Catalogue officiel des Circulaires 01 à 16/2022

Catalogue compact :

`regulatory/registries/AMF_UMOA_2022_CIRCULAR_METADATA_CATALOG_V0_1.json`

Validation : `COMPLETE_16_METADATA_OBJECTS`, `entryCount=16`, `failures=[]`.

| N° | actualiteId | Objet officiel API |
|---:|---:|---|
| 01 | 1000129 | Annulation de la Circulaire n°01-2018 relative aux modalités de scission des FCP ou de leur transformation en SICAV |
| 02 | 1000130 | Processus d'agrément, modification des conditions initiales d'agrément et retrait d'agrément des Sociétés de Gestion d'OPC |
| 03 | 1000131 | Documents et informations à joindre à la demande d'agrément d'un OPC et modalités de dépôt des demandes d'enregistrement |
| 04 | 1000132 | Contrat et missions du Dépositaire |
| 05 | 1000133 | Contenu du prospectus des OPC |
| 06 | 1000134 | Document d'informations clés à fournir à l'investisseur d'un OPC |
| 07 | 1000135 | Exigences en matière de communications publicitaires |
| 08 | 1000136 | Rapports périodiques des OPC |
| 09 | 1000137 | Informations à fournir au Conseil Régional |
| 10 | 1000138 | Modalités de calcul des frais généraux pour la détermination du niveau de capitaux propres d'une Société de Gestion d'OPC |
| 11 | 1000139 | Frais de l'OPC |
| 12 | 1000140 | Évaluation des OPC et de leurs actifs |
| 13 | 1000141 | Classes de parts / actions |
| 14 | 1000142 | Outils de gestion de la liquidité |
| 15 | 1000143 | Gestion des risques des OPC |
| 16 | 1000144 | Règles applicables aux OPC en matière de conflits d'intérêts et règles de conduite |

Les fichiers sources spécifiques 010 et 013 ont été enrichis avec la provenance API actuelle :

- `regulatory/sources/CIRCULAIRE_010_AMF_UMOA_2022.yaml` ;
- `regulatory/sources/CIRCULAIRE_013_AMF_UMOA_2022.yaml`.

## Matérialisation des 16 binaires

Workflow canonique :

`.github/workflows/materialize-amf-umoa-2022-circular-binaries.yml`

Script :

`scripts/materialize_amf_umoa_2022_circular_binaries.py`

Méthode :

1. relire les `16` actualiteId depuis le registre API validé ;
2. exiger que `titre` corresponde au numéro attendu ;
3. décoder le champ `doc` Base64 ;
4. exiger la signature `%PDF` ;
5. calculer SHA-256, taille et pagination ;
6. tenter `pdftotext` ;
7. utiliser Tesseract français uniquement en fallback lorsque le document est image-only ;
8. produire PDF, texte et métadonnées par circulaire ;
9. ne jamais convertir cette matérialisation en résolution automatique d'une dépendance.

État à la dernière mise à jour de ce fichier : workflow en cours d'exécution.

## Matrice de recherche INST066 ↔ Circulaires 2022

Fichier :

`regulatory/registries/INST066_TO_AMF_UMOA_2022_CIRCULAR_CANDIDATE_MATRIX_V0_1.json`

Validation :

- `49` dépendances préservées ;
- `34` dépendances de type `COUNCIL_CIRCULAR` comparées ;
- `15` dépendances d'un autre type exclues de la recherche circulaire ;
- aucune ligne n'est passée à `RESOLVED` ;
- une Circulaire 2022 ne peut pas résoudre automatiquement une dépendance qualifiée d'Instruction ou de réglementation comptable.

Cette matrice est **un outil de navigation de recherche**, pas une analyse juridique. Les scores lexicaux peuvent produire des faux positifs. Exemple : l'article 4 sur les services auxiliaires reçoit des candidats sur les seuls mots « gestion » / « parts » ; aucun de ces candidats ne doit être promu sans preuve textuelle.

## Correspondances fortement orientées par l'intitulé officiel — toujours non résolues

À confirmer sur les binaires propres :

- Article 5, frais généraux → `Circulaire 10/2022` ;
- prospectus OPC → `Circulaire 05/2022` ;
- DICI / informations clés → `Circulaire 06/2022` ;
- communications publicitaires → `Circulaire 07/2022` ;
- rapports périodiques → `Circulaire 08/2022` ;
- informations à transmettre au Conseil Régional → `Circulaire 09/2022` ;
- frais de l'OPC → `Circulaire 11/2022` ;
- évaluation / valorisation → `Circulaire 12/2022` ;
- classes de parts / actions → `Circulaire 13/2022` ;
- outils de gestion de la liquidité → `Circulaire 14/2022` ;
- gestion des risques → `Circulaire 15/2022` ;
- conflits d'intérêts / règles de conduite → `Circulaire 16/2022`.

### Nuance Article 5

Le renvoi relatif aux documents/programme d'activité d'une **Société de Gestion** ne doit pas être résolu sur la seule Circulaire 03/2022 : celle-ci porte, selon son intitulé officiel API, sur les documents et informations à joindre à la demande d'agrément **d'un OPC**.

La Circulaire 02/2022 porte sur le processus d'agrément des **Sociétés de Gestion d'OPC**, mais son propre contenu doit être lu pour déterminer si elle couvre le renvoi précis de l'article 5. Les renvois de l'article 5 qualifiés d'`Instruction du Conseil Régional` restent par ailleurs distincts de ces circulaires.

## Dépendances nommées / autres familles structurées

### Instruction n°61/CREPMF/2020

- référence et intitulé observés directement dans l'Instruction 66 officielle matérialisée ;
- objet source : `regulatory/sources/INSTRUCTION_61_CREPMF_2020.yaml` ;
- propre binaire officiel et statut courant : encore à confirmer directement ;
- activation interdite tant que la source propre n'est pas fermée.

### Instruction n°64/CREPMF/2020

- registre AMF-UMOA : référence, intitulé et statut `NON_ABROGE` confirmés au `2026-08-08` ;
- objet source : `regulatory/sources/INSTRUCTION_64_CREPMF_2020.yaml` ;
- candidat officiel pour des renvois procéduraux qualifiés d'Instruction aux articles 5/17 ;
- propre binaire officiel non identifié dans la première passe publique ;
- aucune Circulaire 02/2022 ou 03/2022 ne peut lui être substituée automatiquement.

### Règlement n°09/2006/CM/UEMOA — règles comptables spécifiques

- objet source : `regulatory/sources/REGLEMENT_09_2006_CM_UEMOA_ACCOUNTING.yaml` ;
- source d'archive gouvernementale matérialisée ;
- cinq occurrences `SPECIFIC_ACCOUNTING_REGULATION` mappées au candidat 09/2006 ;
- cinq occurrences restent `NOT_RESOLVED_CURRENT_VERSION_AND_SCOPE_REVIEW_PENDING` ;
- la révision du référentiel annoncée par l'AMF-UMOA en 2023 empêche toute inférence automatique de version courante.

## Réinterprétation des anciennes recherches négatives

Les fichiers de preuve créés lors des premières recherches publiques restent conservés : ils décrivent fidèlement ce qui était identifiable dans les routes et moteurs alors contrôlés.

Ils ne doivent plus être lus comme « le texte n'existe pas » mais comme :

`NOT_IDENTIFIED_THROUGH_PREVIOUS_PUBLIC_INDEXED_ROUTES`.

L'API officielle actuelle a depuis permis d'identifier notamment :

- publicité → 07/2022 ;
- reporting → 08/2022 ;
- frais généraux → 10/2022 ;
- frais OPC → 11/2022 ;
- évaluation → 12/2022 ;
- classes de parts → 13/2022 ;
- liquidité → 14/2022 ;
- risques → 15/2022 ;
- conflits/règles de conduite → 16/2022.

Les preuves historiques négatives ne sont donc pas supprimées ; leur portée est explicitement bornée.

## Voies expérimentales retirées

Après validation de l'API officielle, deux méthodes devenues redondantes et instables ont été retirées :

- rendu Chrome / découverte du Rapport annuel 2022 pour reconstruire la liste des circulaires ;
- scan rendu des anciennes pages `crepmf.org/actuality-details`.

Le domaine historique CREPMF présentait des difficultés TLS/DNS dans le runner. **Aucune vérification TLS n'a été désactivée.**

La voie canonique est désormais l'API du domaine actuel `www.amf-umoa.org`.

## Prochaine séquence

1. terminer la matérialisation PDF/texte 16/16 ;
2. créer un index de sections/articles pour chaque circulaire ;
3. chercher dans chaque texte les formulations exactes des renvois INST066 ;
4. construire une matrice `dependencyId → circular → pages/articles/snippets` ;
5. distinguer : `NO_MATCH`, `RELATED`, `STRONG_SCOPE_MATCH`, `EXACT_IMPLEMENTING_MATCH_PENDING_LEGAL_REVIEW` ;
6. contrôler date d'acte, date d'effet, clauses d'annulation/abrogation/modification ;
7. revue juridique ;
8. revue conformité ;
9. seulement ensuite envisager `RESOLVED` / activation.

## R1 sanctions

Le régime sanctions `2016 ↔ 2022` reste prioritaire juridiquement mais bloqué par l'absence des binaires officiels nécessaires. Reprendre immédiatement R1 dès qu'un binaire officiel devient accessible.

## Invariants

- `automatic_reference_inference_allowed=false` ;
- `metadata_match_is_resolution=false` ;
- `lexical_candidate_is_resolution=false` ;
- `binary_materialization_is_resolution=false` ;
- `automatic_dependency_resolution_allowed=false` ;
- `automatic_rule_reconstruction_allowed=false` ;
- `automatic_requirement_activation_allowed=false` ;
- `current_version_inference_allowed=false` lorsqu'une version actuelle n'est pas établie ;
- `ready_for_submission=false` ;
- revue juridique et conformité humaines obligatoires.
