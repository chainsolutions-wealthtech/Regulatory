# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-REG-001`

## Action

Poursuivre **R4 — textes d'application explicitement appelés par l'Instruction n°66/CREPMF/2021** en exploitant désormais la **série officielle des Circulaires AMF-UMOA n°01 à 16/2022**, découverte directement via l'API publique utilisée par le frontend actuel de l'AMF-UMOA.

La priorité immédiate est :

1. terminer la matérialisation des `16/16` binaires depuis le champ API `doc` encodé en Base64 ;
2. vérifier `%PDF`, SHA-256, taille, pagination et extraction texte/OCR de chaque circulaire ;
3. comparer le contenu de chaque circulaire aux `34` occurrences `COUNCIL_CIRCULAR` de l'Instruction 66 ;
4. transformer uniquement les correspondances textuellement démontrées en **candidats juridiquement documentés** ;
5. conserver `resolved=false` tant que la portée exacte, la date d'effet, les éventuelles clauses modificatives/abrogatoires et la revue juridique/conformité ne sont pas fermées ;
6. ne jamais utiliser une circulaire pour résoudre automatiquement une dépendance explicitement qualifiée d'`Instruction du Conseil Régional` ou de `réglementation comptable spécifique`.

## Nouvelle source institutionnelle canonique

Le frontend actuel `https://www.amf-umoa.org` expose le service :

`GET /service/api/elastic/actualite?id=<actualiteId>&langue=fr`

Le code du frontend montre que `JupiterPortailService.fetchActualities()` utilise ce service pour `actuality-details`.

Le probe déterministe a validé deux témoins connus avant tout scan :

- `actualiteId=1000138` → `CIRCULAIRE N°010-2022` ;
- `actualiteId=1000141` → `CIRCULAIRE N°013-2022`.

Le scan borné témoin-validé a ensuite retrouvé exactement :

- `16` circulaires ;
- numéros `01` à `16` sans manque ;
- `0` doublon ;
- un champ `doc` contenant un PDF Base64 pour les objets contrôlés ;
- un champ `documentUrl` ;
- `valide=true` et `abroge=false` dans les métadonnées API observées au `2026-08-08`.

Attention : les champs `date=2023-09-12` / `createdDate` de l'API sont des métadonnées de publication/enregistrement du portail et **ne doivent pas être assimilés à la date d'adoption ou d'effet** des textes référencés `2022`.

## Catalogue officiel 01–16

Le catalogue de métadonnées officiel identifie :

1. `01/2022` — annulation de la Circulaire n°01-2018 relative à la scission des FCP / transformation en SICAV ;
2. `02/2022` — processus d'agrément, modification des conditions initiales et retrait d'agrément des Sociétés de Gestion d'OPC ;
3. `03/2022` — documents et informations à joindre à la demande d'agrément d'un OPC et modalités de dépôt des demandes d'enregistrement ;
4. `04/2022` — contrat et missions du Dépositaire ;
5. `05/2022` — contenu du prospectus des OPC ;
6. `06/2022` — document d'informations clés à fournir à l'investisseur d'un OPC ;
7. `07/2022` — exigences en matière de communications publicitaires ;
8. `08/2022` — rapports périodiques des OPC ;
9. `09/2022` — informations à fournir au Conseil Régional ;
10. `10/2022` — modalités de calcul des frais généraux pour la détermination du niveau de capitaux propres d'une Société de Gestion d'OPC ;
11. `11/2022` — frais de l'OPC ;
12. `12/2022` — évaluation des OPC et de leurs actifs ;
13. `13/2022` — classes de parts / actions ;
14. `14/2022` — outils de gestion de la liquidité ;
15. `15/2022` — gestion des risques des OPC ;
16. `16/2022` — règles applicables aux OPC en matière de conflits d'intérêts et règles de conduite.

## État R4 de référence

Inventaire déterministe Instruction 66 :

- `49` occurrences de dépendances externes ;
- `47` occurrences initialement non résolues ;
- `26` articles concernés ;
- `34` renvois à des circulaires du Conseil Régional ;
- `7` renvois génériques à des instructions du Conseil Régional ;
- `5` renvois à la réglementation comptable spécifique ;
- `2` occurrences explicitement reliées à l'Instruction 58 ;
- Instruction n°61/CREPMF/2020 explicitement nommée dans l'Instruction 66.

Fichiers de pilotage :

- `regulatory/registries/INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_V0_1.json` ;
- `regulatory/registries/AMF_UMOA_2022_CIRCULAR_API_REGISTRY_V0_1.json` ;
- `regulatory/registries/AMF_UMOA_2022_CIRCULAR_METADATA_CATALOG_V0_1.json` ;
- `regulatory/registries/INST066_TO_AMF_UMOA_2022_CIRCULAR_CANDIDATE_MATRIX_V0_1.json` ;
- `regulatory/sources/CIRCULAIRE_010_AMF_UMOA_2022.yaml` ;
- `regulatory/sources/CIRCULAIRE_013_AMF_UMOA_2022.yaml`.

## Correspondances déjà fortes mais non résolues

À confirmer sur le texte binaire propre :

- Article 5 — frais généraux → forte correspondance avec `10/2022` ;
- publicité → `07/2022` ;
- rapports périodiques → `08/2022` ;
- frais OPC → `11/2022` ;
- évaluation / valorisation → `12/2022` ;
- classes de parts/actions → `13/2022` ;
- liquidité → `14/2022` ;
- gestion des risques → `15/2022` ;
- conflits d'intérêts / règles de conduite → `16/2022`.

Ne pas assimiler une similitude lexicale à une résolution. Exemple : le renvoi Article 5 sur le programme d'activité d'une **Société de Gestion** ne doit pas être automatiquement attribué à la Circulaire `03/2022`, dont l'intitulé porte sur le dossier d'agrément d'un **OPC**.

## Instruction 64/2020

Le registre AMF-UMOA confirme toujours :

- `Instruction N°64/2020` ;
- objet : conditions de traitement des dossiers de demande d'agrément ou d'approbation ;
- statut observé : `NON_ABROGE`.

Son binaire officiel propre reste à matérialiser. Elle demeure un candidat distinct pour les renvois procéduraux qualifiés d'**Instruction du Conseil Régional** et ne doit pas être remplacée par les Circulaires 02/2022 ou 03/2022 sans comparaison normative.

## R1 sanctions — blocage prioritaire conservé

Le régime sanctions `2016 ↔ 2022` reste prioritaire juridiquement mais bloqué par l'absence des binaires officiels nécessaires. Reprendre immédiatement R1 dès qu'un binaire officiel des décisions sanctions devient accessible.

## Invariants

- `candidate_match_is_resolution=false` ;
- `metadata_match_is_resolution=false` ;
- `binary_materialization_is_resolution=false` ;
- `automatic_dependency_resolution_allowed=false` ;
- `automatic_rule_reconstruction_allowed=false` ;
- `automatic_requirement_activation_allowed=false` ;
- aucune substitution d'un type d'instrument par un autre ;
- revue juridique et conformité humaines obligatoires ;
- `ready_for_submission=false`.
