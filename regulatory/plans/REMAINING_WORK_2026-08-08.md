# Remaining work — 2026-08-08

## Statut de référence

Ce document est une photographie opérationnelle du reste à faire après la compilation de l'Instruction 58 et l'ouverture du cross-check historique de l'Instruction 66. Il ne remplace pas l'historique de `TODO.md`.

### Déjà réalisé

- Circulaire n°05/CREPMF/2022 : `62` exigences V1 structurées pour le parcours FCP/SGO.
- Instruction n°66/CREPMF/2021 : PDF officiel matérialisé, SHA-256 calculé, `65` pages, articles `1–92` indexés, `92` atomes structuraux et `111` exigences candidates détaillées compilées.
- Instruction 66 : date d'acte `2021-12-16`, prise d'effet `2022-01-01`, statut `NON ABROGE` observé au registre officiel AMF-UMOA le `2026-08-06` et inventaire des sept textes explicitement abrogés par l'article 92.
- Instruction n°46/2011 révisée : publication BRVM officielle retrouvée, PDF officiel matérialisé, SHA-256 `6ab1a373b7671457cafd0f36cfbb96d031ab9839c2ecc0c18fabac602f972478`, `3 474 284` octets, `9` pages, OCR français, articles `1–21` indexés, date de révision/signature et d'effet `2018-07-30`, délai transitoire de six mois de l'article 20 conservé, statut historique abrogé par l'article 92 de l'Instruction 66 maintenu.
- Instruction n°58/CREPMF/2019 : PDF officiel matérialisé, SHA-256 `38258d7cae5518a6bea6b195facbb717e4a98c1eb734b30bc5e7de91917d0c57`, `17` pages, articles `1–35` indexés, `35` blocs, `35` atomes et `32` exigences candidates détaillées compilées.
- Instruction 58 : article 34 enregistré comme abrogeant/remplaçant notamment l'Instruction n°31/2005 du 7 juin 2005 ; article 35 et bloc final établissent la signature et l'entrée en vigueur au `2019-07-24`.
- Instruction 58 : chaîne CI séparée d'enrichissement juridique validée `success`.
- Crosswalk Instruction 58 : `18` liens vers CIRC005 et `9` liens vers INST066.
- Toutes les exigences INST066 et INST058 restent `FORBIDDEN`, avec revue juridique et conformité `PENDING`.
- Le produit exécutable, le modèle canonique, PostgreSQL/RLS, le workflow de revue, le DOCX déterministe et les principales CI existent déjà.
- Les générateurs historiques de preuves techniques ne peuvent plus posséder ni écraser `NEXT_ACTION.md` ; la CI protège maintenant ce document de contrôle de boucle par vérification de hash.
- La dépendance de la Décision n° `CM/SJ/O01/03/2016` est enregistrée et son entrée AMF-UMOA est observée `NON_ABROGE`.
- L'adoption officielle d'un dispositif révisé des sanctions le `2022-06-24` est confirmée par le communiqué du Conseil des Ministres publié par la BCEAO.
- La référence de la décision 2022 est enregistrée comme `CM/10/06/2022`, avec statut `CORROBORATED_PENDING_OFFICIAL_BINARY`.
- La recherche publique des binaires sanctions 2016/2022 est documentée dans `regulatory/review-evidence/SANCTIONS_2016_2022/OFFICIAL_BINARY_SEARCH_2026-08-08.yaml`.
- Le cross-check historique de l'article 92 est documenté dans `regulatory/review-evidence/INST066_HISTORICAL_CROSSCHECK/OFFICIAL_SOURCE_SEARCH_2026-08-08.yaml`.

## Reste réglementaire prioritaire

### R1 — Régime de sanctions 2016 ↔ 2022

État : `BLOCKED_OFFICIAL_BINARY_ACQUISITION`.

#### Décision 2016 — `CM/SJ/O01/03/2016`

- registre officiel AMF-UMOA identifié ;
- statut de registre observé : `NON_ABROGE` ;
- dépendance enregistrée dans `regulatory/sources/DECISION_CM_SJ_001_03_2016.yaml` ;
- fiche officielle AMF-UMOA identifiée ;
- PDF binaire officiel stable : `NOT_IDENTIFIED_IN_CHECKED_PUBLIC_OFFICIAL_ROUTES` ;
- SHA-256, taille, pagination et index : impossibles à produire avant acquisition du binaire ;
- atomisation : `FORBIDDEN_PENDING_OFFICIAL_BINARY`.

#### Décision 2022 — `CM/10/06/2022`

- adoption du dispositif révisé le `2022-06-24` : `OFFICIALLY_CONFIRMED` ;
- dépendance enregistrée dans `regulatory/sources/DECISION_CM_10_06_2022.yaml` ;
- référence et intitulé : `CORROBORATED_PENDING_OFFICIAL_BINARY` ;
- finalité officielle de la révision : notamment alignement sur la Loi uniforme relative aux infractions boursières pour les mêmes agissements et adaptation aux évolutions du cadre de régulation ;
- PDF binaire officiel stable : `NOT_IDENTIFIED_IN_CHECKED_PUBLIC_OFFICIAL_ROUTES` ;
- statut juridique courant et date d'effet : à établir sur source officielle ;
- atomisation : `FORBIDDEN_PENDING_OFFICIAL_BINARY`.

#### Relation juridique 2016 ↔ 2022

- l'existence d'un dispositif révisé en 2022 est établie ;
- le fait que l'entrée 2016 soit encore affichée `NON_ABROGE` est conservé comme observation de registre ;
- aucune conclusion automatique n'est autorisée quant à une abrogation, un remplacement, une modification partielle ou une coexistence ;
- la comparaison juridique exige les deux textes officiels ;
- les copies tierces sont exclues comme sources normatives.

Les décisions de sanctions restent nécessaires pour fermer `INST058_ART031_REQ001` et `INST058_ART032_REQ001`. Aucun montant, barème, catégorie de manquement ou calcul de sanction ne peut être activé.

**Condition de reprise immédiate :** disponibilité d'un binaire officiel 2016 ou 2022, d'une archive institutionnelle probante ou d'une transmission officielle du régulateur.

### R2 — Métadonnées juridiques Instruction 58

État : `PARTIALLY_CLOSED_CURRENT_STATUS_AND_LATER_TEXTS_PENDING`.

Terminé sur source officielle matérialisée :

- date de signature : `2019-07-24` ;
- règle d'entrée en vigueur : article 35, à compter de la date de signature ;
- date d'effet : `2019-07-24` ;
- prédécesseur explicitement cité : Instruction n°31/2005 du `2005-06-07` ;
- relation : article 34, `EXPLICITLY_ABROGATED_AND_REPLACED` ;
- chaîne CI reproductible conservant ces faits sans activation réglementaire.

Reste ouvert :

- vérifier le statut actuel dans une source officielle dynamique AMF-UMOA suffisamment probante ;
- rechercher exhaustivement modificatifs, rectificatifs, décisions d'application ou textes postérieurs ;
- effectuer une relecture visuelle humaine du bloc de signature, l'OCR de cette zone étant dégradé ;
- matérialiser l'Instruction n°31/2005 seulement si son contenu est nécessaire à l'historique ou à l'analyse d'impact, sans la réactiver.

### R3 — Métadonnées et historique complet Instruction 66

État : `IN_PROGRESS_1_OF_7_HISTORICAL_SOURCES_MATERIALIZED`.

Déjà établi et tracé :

- source Instruction 66 officielle matérialisée et hashée ;
- date d'acte : `2021-12-16` ;
- date d'effet : `2022-01-01` ;
- statut de registre : `NON_ABROGE` observé au `2026-08-06` ;
- sept références explicitement abrogées par l'article 92 inventoriées à partir des pages 64–65 ;
- bibliothèque BRVM historique parcourue jusqu'aux publications de 1999 ;
- recherches institutionnelles exactes exécutées pour les références historiques ;
- Instruction n°46/2011 révisée entièrement matérialisée et indexée comme source historique ;
- relation précise entre l'Instruction 46 révisée et la Décision n°2012-119 toujours laissée `PENDING` faute de binaire officiel de cette décision.

#### Progression des sept textes de l'article 92

1. Décision n°2012-119 — `OFFICIAL_PUBLIC_ROUTE_NOT_IDENTIFIED` ;
2. Instruction n°46/2011 révisée — `MATERIALIZED_HASHED_INDEXED_1_TO_21` ;
3. Instruction n°45/2011 — `OFFICIAL_PUBLIC_ROUTE_NOT_IDENTIFIED` ;
4. Instruction n°24/99 — `OFFICIAL_PUBLIC_ROUTE_NOT_IDENTIFIED` ;
5. Instruction n°23/99 — `OFFICIAL_PUBLIC_ROUTE_NOT_IDENTIFIED` ;
6. Instruction n°22/99 — `OFFICIAL_PUBLIC_ROUTE_NOT_IDENTIFIED` ;
7. Instruction n°21/99 — `OFFICIAL_PUBLIC_ROUTE_NOT_IDENTIFIED`.

Reste ouvert :

- poursuivre la recherche institutionnelle de l'Instruction n°45/2011 en priorité ;
- rechercher ensuite les Instructions n°24/99, n°23/99, n°22/99 et n°21/99 et la Décision n°2012-119 ;
- matérialiser immédiatement chaque binaire officiel retrouvé avec hash, taille, pagination et extraction ;
- fermer la recherche de modificatifs et rectificatifs de l'Instruction 66 sur les registres/bulletins officiels disponibles ;
- conserver une preuve datée de chaque recherche négative ou positive ;
- revoir juridiquement les seuils, exemptions, délais, exceptions et applicabilités issus de l'OCR avant toute activation.

### R4 — Textes OPC complémentaires encore nécessaires

État : `OPEN`.

Identifier, matérialiser et atomiser les textes officiels qui portent explicitement sur :

- classification des OPC ;
- ratios et limites d'investissement ;
- valorisation ;
- outils de gestion de liquidité ;
- frais, commissions et rémunérations ;
- DICI ;
- commercialisation / distribution dans les États membres ;
- services auxiliaires des sociétés de gestion ;
- fiscalité nationale applicable aux fonds et porteurs.

Aucune obligation ne doit être inventée à partir d'un thème si aucun texte source explicite n'est identifié.

## Reste de validation humaine

État : `BLOCKING_FOR_ACTIVATION`.

- revue juridique des `111` candidats INST066 ;
- revue conformité des `111` candidats INST066 ;
- revue juridique des `32` candidats INST058 ;
- revue conformité des `32` candidats INST058 ;
- revue juridique/conformité du régime sanctions 2016 ↔ 2022 après matérialisation ;
- revue des éléments historiques nécessaires à l'analyse de migration, sans réactivation ;
- revue fiscale des clauses et champs fiscaux ;
- validation des clauses juridiques avant passage éventuel à `APPROVED/ACTIVE`.

Tant que ces revues ne sont pas terminées :

- aucune exigence candidate n'est activée ;
- aucune règle historique n'est réactivée ;
- aucune sanction n'est calculée ;
- aucun document n'est présenté comme automatiquement conforme ;
- `ready_for_submission=false` reste obligatoire.

## Reste produit / exploitation

### P1 — Connexion du corpus validé au moteur

- n'intégrer dans le catalogue exécutable que les exigences humainement validées ;
- conserver version, provenance et date de validité de chaque règle ;
- gérer les migrations réglementaires sans régression ;
- séparer strictement règles courantes et textes historiques abrogés.

### P2 — Administration réglementaire

- interface d'administration des sources ;
- workflow d'approbation des exigences et clauses ;
- vue crosswalk CIRC005 ↔ INST066 ↔ INST058 ↔ champs ↔ preuves ↔ clauses ↔ contrôles ;
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
2. **en attendant R1** : poursuivre R3 avec l'Instruction n°45/2011 puis les cinq autres références historiques non matérialisées ;
3. terminer R2 par la vérification du statut courant et des éventuels textes postérieurs de l'Instruction 58 ;
4. fermer la recherche de modificatifs/rectificatifs de l'Instruction 66 ;
5. inventorier et matérialiser les autres textes OPC complémentaires ;
6. lancer la double revue humaine INST066/INST058 et la revue du régime de sanctions lorsqu'il sera matérialisé ;
7. activer uniquement les règles explicitement approuvées ;
8. terminer l'infrastructure réelle et la recette ;
9. seulement ensuite préparer une version réellement prête pour dépôt.
