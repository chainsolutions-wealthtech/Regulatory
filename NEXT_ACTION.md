# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY_WITH_EXTERNAL_CI_BLOCKER`
> **Boucle :** `LOOP-REG-001`

## Action prioritaire

Reprendre **R1 — sanctions 2016 ↔ 2022** avec un objectif documentaire unique :

> **obtenir le binaire officiel ou institutionnel de la Décision n° CM/10/06/2022 du 24 juin 2022**, puis comparer ses clauses au binaire officiel 2016 déjà matérialisé.

Le binaire 2016 n'est plus un verrou :

- source : `DECISION_CM_SJ_001_03_2016` ;
- PDF : `regulatory/sources/amf-umoa-priority-api-documents/DECISION_SANCTIONS_2016.pdf` ;
- SHA-256 : `888b971071f32a6453647b979f3f9cc551d686e1bc7135d6a659e8907aa9dbe2` ;
- 12 pages ;
- signé le `2016-03-24` ;
- entrée en vigueur : `2017-01-01` selon l'article 12 ;
- quantums et grilles présents mais **strictement inactifs**.

## Décision 2022 — preuves acquises

La Décision `CM/10/06/2022` est institutionnellement attestée :

- BCEAO : le Conseil des Ministres a adopté le **24 juin 2022** un dispositif révisé des sanctions pécuniaires applicables au marché financier régional de l'UMOA ;
- CENTIF Sénégal : référence explicite `DECISION n° CM / 10 / 06 / 2022` sous l'intitulé relatif au dispositif des sanctions pécuniaires ;
- le registre AMF-UMOA actuel contient toujours la Décision 2016 avec statut affiché `NON_ABROGE`, mais ne contient pas `CM/10/06/2022` parmi les dix Décisions visibles ;
- quatre autres Décisions de 2022 sont présentes dans le registre AMF actuel mais portent sur d'autres objets et ne doivent pas être confondues avec `CM/10/06/2022`.

Fichiers :

- `regulatory/sources/DECISION_CM_SJ_001_03_2016.yaml` ;
- `regulatory/sources/DECISION_CM_10_06_2022.yaml` ;
- `regulatory/review-evidence/SANCTIONS_2016_2022/OFFICIAL_BINARY_SEARCH_2026-08-08.yaml`.

### Routes de récupération prioritaires 2022

1. lien documentaire / archive institutionnelle CENTIF Sénégal ;
2. archive Conseil des Ministres UMOA / BCEAO ;
3. Journal officiel ou archive gouvernementale d'un État membre ;
4. archive AMF-UMOA/CREPMF non exposée dans la catégorie courante `Decision` ;
5. E-DOCUCENTER UEMOA ou autre dépôt documentaire institutionnel.

### Lecture obligatoire dès acquisition du binaire 2022

- référence complète et bloc de signature ;
- date d'effet ;
- clause d'abrogation / modification / remplacement ;
- dispositions transitoires ;
- annexe 1 : classification des manquements ;
- annexe 2 : quantums de sanctions ;
- relation avec `CM/SJ/O01/03/2016` ;
- relation avec la Loi Uniforme sur les infractions boursières et la Décision `CM/07/09/2021`.

Aucun montant ou barème sanctions ne doit être activé avant cette comparaison et les revues juridique/conformité.

---

## R4 — état après revue des Circulaires AMF-UMOA 01–16/2022

La série 2022 est désormais entièrement acquise :

- `16/16` objets API officiels ;
- `16/16` PDF Base64 décodés ;
- hashes, pagination et texte/OCR conservés ;
- catalogue : `regulatory/registries/AMF_UMOA_2022_CIRCULAR_CATALOG_V0_1.json`.

Revue curatée des `34` renvois `COUNCIL_CIRCULAR` de l'Instruction 66 :

- `26` correspondances de contenu fortes ou exactes ;
- `2` relations partielles uniquement ;
- `6` sans correspondance démontrée dans la série 2022 ;
- `0` dépendance passée à `resolved=true` ;
- `0` exigence activée.

Preuve :

`regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/CIRCULAR_2022_CONTENT_SCOPE_REVIEW_2026-08-08.yaml`

### 6 résidus R4 à rechercher hors série 2022

1. `INST066_ART004_DEP_CIRC_01` — limites des services auxiliaires des SGO ;
2. `INST066_ART014_DEP_CIRC_01` — délégation / interdiction de devenir une « boîte aux lettres » ;
3. `INST066_ART023_DEP_CIRC_01` — règle SICAV / admission au marché ;
4. `INST066_ART023_DEP_CIRC_02` — délégation du portefeuille global de la SICAV ;
5. `INST066_ART075_DEP_CIRC_01` — contenu du rapport annuel du Conseil de Surveillance FCPE ;
6. `INST066_ART076_DEP_CIRC_01` — contenu du rapport annuel du Conseil de Surveillance SICAVAS.

`NO_CONFIRMED_MATCH_IN_2022_SERIES` ne signifie jamais que l'instrument n'existe pas ; l'API AMF-UMOA expose `39` circulaires au total, donc la recherche doit se poursuivre dans le corpus antérieur/postérieur.

### 2 relations partielles à approfondir

- `INST066_ART059_DEP_CIRC_01` ↔ Circulaire `03/2022` : relation fusion/information des porteurs, sans preuve que la Circulaire 03 couvre l'intégralité des informations exigées par l'article 59 ;
- `INST066_ART074_DEP_CIRC_03` ↔ Circulaire `06/2022` : information DICI maître/nourricier, sans preuve de couverture de toutes les modalités de fonctionnement.

---

## Instruction 64/2020 — acquisition fermée

L'Instruction 64 n'est plus à rechercher :

- actualiteId : `1000110` ;
- PDF officiel matérialisé ;
- SHA-256 : `db5091c4388e5c050c22b028e7494522e36d6b5b041ba265cf96ccedada24469` ;
- 97 pages ;
- signée le `2020-12-10` ;
- entrée en vigueur le `2021-01-01` ;
- article 3 : quatre étapes du traitement des dossiers ;
- articles 8/13 : délais de 20 jours ouvrés pour certains compléments, avec clôture ;
- article 14 : délai maximal de trois mois pour la décision ;
- aucune occurrence de « frais » / « frais d'agrément » identifiée dans son texte pour le délai de règlement des frais.

Preuve de rapprochement :

`regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/INSTRUCTION_64_SCOPE_MATCH_2026-08-08.yaml`

---

## Blocage GitHub Actions à ne pas confondre avec un échec de code

Le workflow de validation machine de la matrice de contenu n'a **pas démarré**.

Annotation GitHub observée : le job n'a pas été lancé parce que des paiements récents du compte ont échoué ou que la limite de dépense doit être augmentée.

Preuve :

`regulatory/validation/GITHUB_ACTIONS_BILLING_BLOCKER_2026-08-08.yaml`

Conséquences :

- ne pas déclarer le workflow `PASS` ;
- ne pas le déclarer « code failure » ;
- la revue curatée `34 = 26 + 2 + 6` reste disponible, mais sa revalidation machine doit être relancée après rétablissement de GitHub Actions ;
- après rétablissement : relancer la matrice, puis `Regulatory CI` et `Security & Review Policy CI`.

## Invariants

- `candidate_match_is_resolution=false` ;
- `content_scope_match_is_legal_resolution=false` ;
- `binary_materialization_is_resolution=false` ;
- `automatic_dependency_resolution_allowed=false` ;
- `automatic_rule_reconstruction_allowed=false` ;
- `automatic_requirement_activation_allowed=false` ;
- `sanction_amount_calculation_allowed=false` tant que 2022 n'est pas comparé ;
- aucune substitution d'un type d'instrument par un autre ;
- revue juridique et conformité humaines obligatoires ;
- `ready_for_submission=false`.
