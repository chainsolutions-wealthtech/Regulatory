# Remaining work — 2026-08-08

## Statut de référence

Ce document est la photographie opérationnelle du reste à faire après la compilation des Instructions 66 et 58, la première passe historique de l'article 92 et l'ouverture de l'inventaire des textes d'application explicitement appelés par l'Instruction 66. Il ne remplace pas l'historique de `TODO.md`.

## Déjà réalisé

### Corpus réglementaire principal

- Circulaire n°05/CREPMF/2022 : `62` exigences V1 structurées pour le parcours FCP/SGO.
- Instruction n°66/CREPMF/2021 : PDF officiel matérialisé, SHA-256 `3f964f2f6ab9ceeb16912ccda13f34b5023a188dfb18fcba7065590c770d396`, `65` pages, articles `1–92` indexés, `92` atomes structuraux et `111` exigences candidates détaillées compilées.
- Instruction 66 : date d'acte `2021-12-16`, prise d'effet `2022-01-01`, statut `NON ABROGE` observé au registre officiel AMF-UMOA le `2026-08-06`.
- Instruction n°58/CREPMF/2019 : PDF officiel matérialisé, SHA-256 `38258d7cae5518a6bea6b195facbb717e4a98c1eb734b30bc5e7de91917d0c57`, `17` pages, articles `1–35` indexés, `35` blocs, `35` atomes et `32` exigences candidates détaillées compilées.
- Instruction 58 : article 34 enregistré comme abrogeant/remplaçant notamment l'Instruction n°31/2005 du 7 juin 2005 ; article 35 et bloc final établissent la signature et l'entrée en vigueur au `2019-07-24`.
- Crosswalk Instruction 58 : `18` liens vers CIRC005 et `9` liens vers INST066.
- Toutes les exigences INST066 et INST058 restent `FORBIDDEN`, avec revue juridique et conformité `PENDING`.

### Historique article 92 de l'Instruction 66

- Les sept textes explicitement abrogés par l'article 92 disposent désormais de `7/7` objets source distincts dans `regulatory/sources/`.
- Instruction n°46/2011 révisée : publication BRVM officielle retrouvée, PDF officiel matérialisé, SHA-256 `6ab1a373b7671457cafd0f36cfbb96d031ab9839c2ecc0c18fabac602f972478`, `3 474 284` octets, `9` pages, OCR français, articles `1–21` indexés, date de révision/signature et d'effet `2018-07-30`, délai transitoire de six mois de l'article 20 conservé.
- Instruction 46 révisée : chaîne de rematérialisation corrigée afin de préserver les blocs de sécurité et de devenir idempotente lorsque le binaire officiel est inchangé ; dernier workflow V2 contrôlé `success`.
- Instructions n°45/2011 et n°24/99 : référence et intitulé corroborés par plusieurs actes officiels distincts, mais leurs binaires propres restent à identifier.
- Décision n°2012-119 et Instructions n°23/99, n°22/99 et n°21/99 : objets source créés avec référence/intitulé issus de l'article 92 officiel ; leurs propres binaires restent à retrouver.
- Décision CREPMF `PCR/DA/2018/165` : preuve administrative corroborante officielle matérialisée, SHA-256 `282b603d99e80699203c4ca75abc683dee8e550f2a8f6f79eccd7e937b0c7337`, `4` pages ; elle cite 24/99, 45/2011 et 46/2011, mais pas 23/99, 22/99, 21/99 ni 2012-119.
- Décision CREPMF `PCR/DA/2017/121` : preuve administrative corroborante officielle matérialisée, SHA-256 `b33a03daf3416dd2710c65f23d7652d4732f8bca7d5b0f4e6b719e65bc1755b8`, `3` pages ; elle cite également 24/99, 45/2011 et 46/2011, mais pas 23/99, 22/99, 21/99 ni 2012-119.
- Première passe publique des Instructions n°23/99, n°22/99 et n°21/99 clôturée sans binaire propre ni seconde corroboration officielle ; cette conclusion est une limite de recherche publique, pas une conclusion sur leur existence historique.
- Validateur `INST066_HISTORICAL_SOURCE_REGISTRY_VALIDATION_V0_1` : `7/7` objets source et garde-fous historiques contrôlés automatiquement ; workflow vert après restauration du bloc `safety` de l'Instruction 46.

### Gouvernance / CI

- Les générateurs historiques de preuves techniques ne peuvent plus posséder ni écraser `NEXT_ACTION.md` ; la CI protège ce document de contrôle de boucle par vérification de hash.
- Les dernières exécutions globales `Regulatory CI` et `Security and Review Policy CI` contrôlées après ces corrections sont `success`.
- `ready_for_submission=false` reste verrouillé.

## R1 — Régime de sanctions 2016 ↔ 2022

État : `BLOCKED_OFFICIAL_BINARY_ACQUISITION`.

### Décision 2016 — `CM/SJ/O01/03/2016`

- registre officiel AMF-UMOA identifié ;
- statut de registre observé : `NON_ABROGE` ;
- dépendance enregistrée dans `regulatory/sources/DECISION_CM_SJ_001_03_2016.yaml` ;
- fiche officielle AMF-UMOA identifiée ;
- PDF binaire officiel stable : `NOT_IDENTIFIED_IN_CHECKED_PUBLIC_OFFICIAL_ROUTES` ;
- SHA-256, taille, pagination et index : impossibles à produire avant acquisition du binaire ;
- atomisation : `FORBIDDEN_PENDING_OFFICIAL_BINARY`.

### Décision 2022 — `CM/10/06/2022`

- adoption du dispositif révisé le `2022-06-24` : `OFFICIALLY_CONFIRMED` ;
- dépendance enregistrée dans `regulatory/sources/DECISION_CM_10_06_2022.yaml` ;
- référence et intitulé : `CORROBORATED_PENDING_OFFICIAL_BINARY` ;
- finalité officielle de la révision : notamment alignement sur la Loi uniforme relative aux infractions boursières pour les mêmes agissements et adaptation aux évolutions du cadre de régulation ;
- PDF binaire officiel stable : `NOT_IDENTIFIED_IN_CHECKED_PUBLIC_OFFICIAL_ROUTES` ;
- statut juridique courant et date d'effet : à établir sur source officielle ;
- atomisation : `FORBIDDEN_PENDING_OFFICIAL_BINARY`.

### Relation juridique 2016 ↔ 2022

- l'existence d'un dispositif révisé en 2022 est établie ;
- le fait que l'entrée 2016 soit encore affichée `NON_ABROGE` est conservé comme observation de registre ;
- aucune conclusion automatique n'est autorisée quant à une abrogation, un remplacement, une modification partielle ou une coexistence ;
- la comparaison juridique exige les deux textes officiels ;
- les copies tierces sont exclues comme sources normatives.

Les décisions de sanctions restent nécessaires pour fermer `INST058_ART031_REQ001` et `INST058_ART032_REQ001`. Aucun montant, barème, catégorie de manquement ou calcul de sanction ne peut être activé.

**Condition de reprise immédiate :** disponibilité d'un binaire officiel 2016 ou 2022, d'une archive institutionnelle probante ou d'une transmission officielle du régulateur.

## R2 — Métadonnées juridiques Instruction 58

État : `PARTIALLY_CLOSED_CURRENT_STATUS_AND_LATER_TEXTS_PENDING`.

Terminé sur source officielle matérialisée :

- date de signature : `2019-07-24` ;
- règle d'entrée en vigueur : article 35, à compter de la date de signature ;
- date d'effet : `2019-07-24` ;
- prédécesseur explicitement cité : Instruction n°31/2005 du `2005-06-07` ;
- relation : article 34, `EXPLICITLY_ABROGATED_AND_REPLACED` ;
- chaîne CI reproductible conservant ces faits sans activation réglementaire.

Reste ouvert :

- obtenir une preuve directe suffisamment exploitable du statut courant de l'Instruction 58 dans le registre dynamique AMF-UMOA ;
- rechercher exhaustivement modificatifs, rectificatifs, décisions d'application ou textes postérieurs ;
- effectuer une relecture visuelle humaine du bloc de signature, l'OCR de cette zone étant dégradé ;
- matérialiser l'Instruction n°31/2005 seulement si son contenu est nécessaire à l'historique ou à l'analyse d'impact, sans la réactiver.

## R3 — Historique Instruction 66

État : `FIRST_PUBLIC_HISTORICAL_PASS_COMPLETE_7_SOURCE_RECORDS_1_BINARY_MATERIALIZED`.

### Progression des sept textes de l'article 92

1. Décision n°2012-119 — `SOURCE_RECORD_CREATED / ARTICLE_92_OFFICIAL_SOURCE_ONLY / BINARY_MISSING` ;
2. Instruction n°46/2011 révisée — `SOURCE_RECORD_CREATED / MATERIALIZED_HASHED_INDEXED_1_TO_21` ;
3. Instruction n°45/2011 — `SOURCE_RECORD_CREATED / MULTIPLE_OFFICIAL_ACTS_CORROBORATED / BINARY_MISSING` ;
4. Instruction n°24/99 — `SOURCE_RECORD_CREATED / MULTIPLE_OFFICIAL_ACTS_CORROBORATED / BINARY_MISSING` ;
5. Instruction n°23/99 — `SOURCE_RECORD_CREATED / ARTICLE_92_OFFICIAL_SOURCE_ONLY / FIRST_PUBLIC_SEARCH_PASS_CLOSED` ;
6. Instruction n°22/99 — `SOURCE_RECORD_CREATED / ARTICLE_92_OFFICIAL_SOURCE_ONLY / FIRST_PUBLIC_SEARCH_PASS_CLOSED` ;
7. Instruction n°21/99 — `SOURCE_RECORD_CREATED / ARTICLE_92_OFFICIAL_SOURCE_ONLY / FIRST_PUBLIC_SEARCH_PASS_CLOSED`.

Reste ouvert :

- reprendre immédiatement l'un des six binaires historiques manquants si une nouvelle archive institutionnelle, un nouveau binaire propre ou un acte officiel pertinent devient disponible ;
- retrouver en particulier la Décision n°2012-119 pour fermer la chaîne 2011 → 2012 → 2018 → 2022 de l'Instruction 46 ;
- fermer la recherche de modificatifs et rectificatifs propres à l'Instruction 66 ;
- revoir juridiquement les seuils, exemptions, délais, exceptions et applicabilités issus de l'OCR avant toute activation.

## R4 — Textes d'application explicitement appelés par l'Instruction 66

État : `EXPLICIT_EXTERNAL_TEXT_INVENTORY_IN_PROGRESS`.

### Correction de périmètre

L'Instruction 66 contient déjà elle-même une grande partie des règles de fond relatives notamment à :

- la classification des OPC et plusieurs seuils/ratios ;
- l'allocation et les limites d'investissement ;
- la valorisation et le calcul de la valeur nette d'inventaire ;
- le DICI ;
- les communications et la commercialisation ;
- la gestion de liquidité et la suspension des rachats ;
- les frais et rémunérations au niveau de principe.

R4 ne doit donc pas rechercher artificiellement « un nouveau texte par thème ». Il doit identifier les **textes externes auxquels l'Instruction 66 renvoie expressément** pour les modalités détaillées.

### Inventaire machine-reproductible

Fichiers de référence :

- `regulatory/registries/INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1.json` ;
- `regulatory/validation/INST066_EXTERNAL_IMPLEMENTING_TEXTS_VALIDATION_V0_1.json`.

État après détection des Instructions CREPMF explicitement numérotées :

- `49` occurrences de dépendances externes ;
- `47` occurrences non résolues ;
- `2` occurrences déjà reliées à l'Instruction 58 matérialisée ;
- `26` articles de l'Instruction 66 concernés ;
- `34` renvois à une `COUNCIL_CIRCULAR` ;
- `7` renvois génériques à une `COUNCIL_INSTRUCTION` ;
- `5` renvois à la réglementation comptable spécifique ;
- `2` occurrences explicites de l'Instruction 58 ;
- `1` dépendance supplémentaire explicitement nommée : Instruction n°61/CREPMF/2020.

Articles concernés : `4, 5, 9, 11, 12, 13, 14, 17, 21, 23, 25, 28, 32, 33, 36, 37, 38, 40, 47, 53, 55, 59, 74, 75, 76, 80`.

Toutes les dépendances non résolues restent :

`FORBIDDEN_PENDING_OFFICIAL_SOURCE_IDENTIFICATION_AND_REVIEW`.

### Dépendances déjà structurées

#### Article 4 — services auxiliaires des SGO

- renvoi explicite à une circulaire fixant les limites de fourniture des services auxiliaires ;
- recherche ciblée AMF-UMOA / BRVM / ancien CREPMF exécutée le `2026-08-08` ;
- aucune référence officielle publique n'a été identifiée ;
- preuve : `regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/ART004_AUXILIARY_SERVICES_CIRCULAR_SEARCH_2026-08-08.yaml` ;
- aucun numéro, titre, seuil ou limite n'est inféré.

#### Instruction n°61/CREPMF/2020 — contrôle interne

- explicitement citée par l'article 11 de l'Instruction 66 sous la référence `61/CREPMF/2020` ;
- intitulé tiré du texte officiel hashé de l'Instruction 66 : organisation du système de contrôle interne des acteurs agréés du marché financier régional de l'UMOA ;
- objet source créé : `regulatory/sources/INSTRUCTION_61_CREPMF_2020.yaml` ;
- propre binaire officiel et statut courant : encore à confirmer directement ;
- publications secondaires seulement corroborantes, jamais normatives.

#### Instruction n°64/CREPMF/2020 — traitement des demandes d'agrément/approbation

- registre officiel AMF-UMOA contrôlé le `2026-08-08` : `Instruction N°64/2020`, intitulé relatif aux conditions de traitement des dossiers de demande d'agrément ou d'approbation, statut `NON_ABROGE` ;
- objet source créé : `regulatory/sources/INSTRUCTION_64_CREPMF_2020.yaml` ;
- candidat officiel fort pour certains renvois procéduraux des articles 5 et 17 ;
- **pas encore considéré comme résolution**, faute de matérialisation et comparaison de son propre texte officiel ;
- propre binaire officiel encore à identifier.

#### Référentiel / réglementation comptable spécifique

- cinq occurrences détectées dans l'Instruction 66 ;
- l'AMF-UMOA confirme officiellement l'existence d'un référentiel comptable spécifique appliqué depuis plus de dix ans et sa mise en révision en 2023 ;
- objet de dépendance : `regulatory/registries/INST066_SPECIFIC_ACCOUNTING_REGULATION_DEPENDENCY_V0_1.yaml` ;
- référence juridique, version actuellement applicable et binaire officiel : encore à identifier ;
- aucune version n'est déduite de l'actualité de 2023.

### Article 5 — recherche en cours

Renvois déjà distingués :

- circulaire définissant les frais généraux servant au calcul du plancher de fonds propres ;
- circulaire précisant la liste des documents et le contenu/forme du programme d'activité ;
- instruction précisant le délai de notification des pièces manquantes ;
- instruction précisant les étapes du processus de traitement de la demande ;
- instruction précisant le délai d'acquittement des frais d'agrément.

État :

- les recherches institutionnelles exactes sur les circulaires « frais généraux » et « programme d'activité » n'ont pas donné de référence publique exploitable ;
- Instruction 64/2020 demeure le candidat officiel principal pour les renvois procéduraux, mais n'est pas juridiquement rapprochée tant que son texte propre n'est pas comparé.

### Prochaines dépendances prioritaires après l'article 5

- article 12 : réglementation comptable + circulaire sur le dispositif de gestion du risque de liquidité ;
- article 13 : réglementation comptable + circulaire sur les critères et procédures de valorisation ;
- article 32 : circulaire sur les communications publicitaires et le format électronique ;
- article 37 : circulaire de reporting + réglementation comptable + Instruction 58 ;
- article 47 : circulaire sur la suspension temporaire des rachats ;
- article 53 : circulaires sur rémunérations, frais, commissions et méthode de calcul ;
- article 55 : circulaires sur pondérations, marges et décotes ;
- article 59 : circulaires sur exposition aux dérivés OTC et méthodes de gestion des risques.

### Travail R4 restant

- construire une file de recherche dédupliquée sans supposer que plusieurs occurrences renvoient au même instrument ;
- identifier chaque référence officielle depuis AMF-UMOA, BRVM, bulletins ou archives institutionnelles ;
- matérialiser chaque binaire officiel trouvé ;
- comparer son périmètre aux occurrences INST066 concernées ;
- ne marquer `RESOLVED` qu'après preuve de correspondance, statut juridique et revue humaine ;
- conserver les recherches négatives comme preuves de périmètre afin d'éviter les boucles répétitives.

## Reste de validation humaine

État : `BLOCKING_FOR_ACTIVATION`.

- revue juridique des `111` candidats INST066 ;
- revue conformité des `111` candidats INST066 ;
- revue juridique des `32` candidats INST058 ;
- revue conformité des `32` candidats INST058 ;
- revue juridique/conformité du régime sanctions 2016 ↔ 2022 après matérialisation ;
- revue des textes externes R4 lorsqu'ils seront identifiés ;
- revue des éléments historiques nécessaires à l'analyse de migration, sans réactivation ;
- revue fiscale des clauses et champs fiscaux ;
- validation des clauses juridiques avant passage éventuel à `APPROVED/ACTIVE`.

Tant que ces revues ne sont pas terminées :

- aucune exigence candidate n'est activée ;
- aucune règle historique n'est réactivée ;
- aucune dépendance R4 non identifiée n'est reconstruite ;
- aucune sanction n'est calculée ;
- aucun document n'est présenté comme automatiquement conforme ;
- `ready_for_submission=false` reste obligatoire.

## Reste produit / exploitation

### P1 — Connexion du corpus validé au moteur

- n'intégrer dans le catalogue exécutable que les exigences humainement validées ;
- conserver version, provenance et date de validité de chaque règle ;
- gérer les migrations réglementaires sans régression ;
- séparer strictement règles courantes, textes historiques abrogés et dépendances externes non résolues.

### P2 — Administration réglementaire

- interface d'administration des sources ;
- workflow d'approbation des exigences et clauses ;
- vue crosswalk CIRC005 ↔ INST066 ↔ INST058 ↔ textes d'application ↔ champs ↔ preuves ↔ clauses ↔ contrôles ;
- vue historique prédécesseur/modificatif/abrogation ;
- comparaison de versions réglementaires.

### P3 — Infrastructure réelle

- fournisseur d'identité réel et secrets hors dépôt ;
- stockage objet de production ;
- antivirus réel ;
- chiffrement et sauvegardes d'exploitation ;
- politique de rétention et restauration testée.

### P4 — Cycle documentaire complet

- import DOCX/PDF d'un prospectus existant avec statut `EXTRACTED_UNVERIFIED` ;
- comparaison entre versions ;
- génération PDF finale déterministe ;
- dossier ZIP de revue/dépôt ;
- tests navigateurs, accessibilité, sécurité et exploitation.

## Ordre recommandé à partir de l'état actuel

1. **R1 dès qu'une source officielle devient disponible** : matérialiser les décisions sanctions 2016/2022 et établir leur relation juridique ;
2. **en attendant R1** : poursuivre R4 occurrence par occurrence, actuellement article 5 après condition d'arrêt de l'article 4 ;
3. tenter de matérialiser Instruction 64/2020 et Instruction 61/2020 depuis une source institutionnelle dès qu'une route binaire est identifiée ;
4. identifier la référence/version du référentiel comptable spécifique ;
5. traiter ensuite les renvois liquidité/valorisation/publicité/reporting/frais/risques selon la file R4 ;
6. reprendre R3 uniquement lorsqu'une nouvelle archive ou source officielle historique devient disponible ;
7. terminer R2 par le statut courant et les éventuels textes postérieurs de l'Instruction 58 ;
8. lancer la double revue humaine INST066/INST058 et la revue des textes d'application identifiés ;
9. activer uniquement les règles explicitement approuvées ;
10. terminer l'infrastructure réelle et la recette ;
11. seulement ensuite préparer une version réellement prête pour dépôt.
