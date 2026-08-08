# Remaining work — 2026-08-08

## Statut de référence

Ce document est une photographie opérationnelle du reste à faire après la compilation de l'Instruction 58. Il ne remplace pas l'historique de `TODO.md`, mais corrige son retard par rapport à l'état réel du dépôt.

### Déjà réalisé

- Circulaire n°05/CREPMF/2022 : `62` exigences V1 structurées pour le parcours FCP/SGO.
- Instruction n°66/CREPMF/2021 : PDF officiel matérialisé, SHA-256 calculé, `65` pages, articles `1–92` indexés, `92` atomes structuraux et `111` exigences candidates détaillées compilées.
- Instruction 66 : date d'acte `2021-12-16`, prise d'effet `2022-01-01`, statut `NON ABROGE` observé au registre officiel AMF-UMOA le `2026-08-06`, inventaire source des sept textes abrogés par l'article 92 et recherche de modificatifs/rectificatifs déjà tracée sans prétention d'exhaustivité.
- Instruction n°58/CREPMF/2019 : PDF officiel matérialisé, SHA-256 `38258d7cae5518a6bea6b195facbb717e4a98c1eb734b30bc5e7de91917d0c57`, `17` pages, articles `1–35` indexés, `35` blocs, `35` atomes et `32` exigences candidates détaillées compilées.
- Instruction 58 : article 34 relu et enregistré comme abrogeant/remplaçant notamment l'Instruction n°31/2005 du 7 juin 2005.
- Instruction 58 : article 35 relu ; entrée en vigueur à la date de signature ; date de signature enregistrée au `2019-07-24` à partir du bloc final de la source officielle matérialisée.
- Instruction 58 : étape CI séparée ajoutée pour enrichir les métadonnées juridiques relues sans transformer l'OCR en décision juridique automatique ; workflow spécialisé validé `success` le `2026-08-08`.
- Crosswalk Instruction 58 : `18` liens vers CIRC005 et `9` liens vers INST066.
- Toutes les exigences INST066 et INST058 restent `FORBIDDEN`, avec revue juridique et conformité `PENDING`.
- Le produit exécutable, le modèle canonique, PostgreSQL/RLS, le workflow de revue, le DOCX déterministe et les principales CI existent déjà.
- La dépendance de la Décision n° `CM/SJ/O01/03/2016` est enregistrée.
- L'adoption officielle d'un dispositif révisé des sanctions le `2022-06-24` est confirmée par le communiqué du Conseil des Ministres publié par la BCEAO.
- La référence de la décision 2022 est enregistrée comme `CM/10/06/2022`, avec statut `CORROBORATED_PENDING_OFFICIAL_BINARY` : son binaire normatif officiel n'est pas encore matérialisé.
- La CI ne peut plus écraser automatiquement `NEXT_ACTION.md` : le générateur PostgreSQL n'écrit plus ce fichier et le workflow vérifie son intégrité avant/après la génération des preuves.

## Reste réglementaire prioritaire

### R1 — Régime de sanctions 2016 ↔ 2022

État : `IN_PROGRESS_OFFICIAL_BINARIES_AND_LEGAL_RELATIONSHIP_PENDING`.

#### Décision 2016 — `CM/SJ/O01/03/2016`

- registre officiel AMF-UMOA identifié ;
- statut de registre observé : `NON_ABROGE` ;
- dépendance enregistrée dans `regulatory/sources/DECISION_CM_SJ_001_03_2016.yaml` ;
- PDF binaire officiel stable : `TO_IDENTIFY` ;
- SHA-256, taille, pagination et index : à produire ;
- atomisation : à produire.

#### Décision 2022 — `CM/10/06/2022`

- adoption du dispositif révisé le `2022-06-24` : `OFFICIALLY_CONFIRMED` ;
- dépendance enregistrée dans `regulatory/sources/DECISION_CM_10_06_2022.yaml` ;
- référence et intitulé : `CORROBORATED_PENDING_OFFICIAL_BINARY` ;
- PDF binaire officiel stable : `TO_IDENTIFY` ;
- statut juridique courant : à établir à partir des sources officielles ;
- SHA-256, taille, pagination et index : à produire après matérialisation ;
- atomisation : interdite tant que le binaire officiel n'est pas matérialisé.

#### Relation juridique 2016 ↔ 2022

- l'existence d'un dispositif révisé en 2022 est établie ;
- le fait que l'entrée 2016 soit encore affichée `NON_ABROGE` dans le registre AMF-UMOA est conservé comme observation de registre ;
- aucune conclusion automatique n'est autorisée quant à une abrogation, un remplacement, une modification partielle ou une coexistence ;
- cette relation doit être établie par comparaison des deux textes officiels et revue juridique.

Les décisions de sanctions sont nécessaires pour fermer les dépendances de `INST058_ART031_REQ001` et `INST058_ART032_REQ001`. Les barèmes, montants, catégories de manquements et calculs de sanctions restent strictement interdits avant matérialisation des textes applicables et double revue juridique/conformité.

### R2 — Métadonnées juridiques Instruction 58

État : `PARTIALLY_CLOSED_CURRENT_STATUS_AND_LATER_TEXTS_PENDING`.

Terminé sur source officielle matérialisée :

- date de signature : `2019-07-24` ;
- règle d'entrée en vigueur : article 35, à compter de la date de signature ;
- date d'effet enregistrée : `2019-07-24` ;
- prédécesseur explicitement cité : Instruction n°31/2005 du `2005-06-07` ;
- relation : article 34, `EXPLICITLY_ABROGATED_AND_REPLACED` ;
- chaîne de matérialisation enrichie pour conserver ces faits dans le YAML, le `metadata.json` et la validation CI tout en maintenant l'activation interdite.

Reste ouvert :

- vérifier le statut actuel directement dans une source officielle dynamique AMF-UMOA suffisamment probante ;
- rechercher exhaustivement modificatifs, rectificatifs, décisions d'application ou textes postérieurs ;
- effectuer une relecture visuelle humaine du bloc de signature, l'OCR de cette zone étant dégradé ;
- matérialiser l'Instruction n°31/2005 seulement si son contenu est nécessaire à l'historique ou à l'analyse d'impact, sans la réactiver.

### R3 — Métadonnées et historique complet Instruction 66

État : `PARTIALLY_CLOSED_HISTORICAL_CROSSCHECK_PENDING`.

Déjà établi et tracé :

- source officielle matérialisée et hashée ;
- date d'acte : `2021-12-16` ;
- date d'effet : `2022-01-01` ;
- statut de registre : `NON_ABROGE` observé au `2026-08-06` ;
- sept références explicitement abrogées par l'article 92 inventoriées à partir des pages 64–65 ;
- recherche de modificatifs/rectificatifs effectuée sur un périmètre officiel sans texte séparé identifié, mais sans déclaration d'exhaustivité.

Reste ouvert :

- cross-check historique officiel des sept références abrogées : Décision n°2012-119, Instruction n°46/2011 révisée, Instructions n°45/2011, n°24/99, n°23/99, n°22/99 et n°21/99 ;
- matérialiser les textes historiques nécessaires lorsque leur contenu est utile à l'analyse de migration réglementaire ;
- fermer la recherche de modificatifs et rectificatifs sur les registres/bulletins officiels disponibles ;
- conserver une preuve officielle datée de chaque statut historique vérifiable ;
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
- revue fiscale des clauses et champs fiscaux ;
- validation des clauses juridiques avant passage éventuel à `APPROVED/ACTIVE`.

Tant que ces revues ne sont pas terminées :

- aucune exigence candidate n'est activée ;
- aucune sanction n'est calculée ;
- aucun document n'est présenté comme automatiquement conforme ;
- `ready_for_submission=false` reste obligatoire.

## Reste produit / exploitation

### P1 — Connexion du corpus validé au moteur

- n'intégrer dans le catalogue exécutable que les exigences humainement validées ;
- conserver version, provenance et date de validité de chaque règle ;
- gérer les migrations réglementaires sans régression.

### P2 — Administration réglementaire

- interface d'administration des sources ;
- workflow d'approbation des exigences et clauses ;
- vue crosswalk CIRC005 ↔ INST066 ↔ INST058 ↔ champs ↔ preuves ↔ clauses ↔ contrôles ;
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

## Ordre recommandé

1. identifier et matérialiser les binaires officiels des Décisions `CM/SJ/O01/03/2016` et `CM/10/06/2022` ;
2. comparer 2016 ↔ 2022 et faire établir juridiquement le régime applicable ;
3. terminer R2 par la vérification du statut courant et des éventuels textes postérieurs de l'Instruction 58 ;
4. terminer R3 par le cross-check historique officiel et la fermeture des modificatifs/rectificatifs de l'Instruction 66 ;
5. inventorier et matérialiser les autres textes OPC complémentaires ;
6. lancer la double revue humaine INST066/INST058 et la revue du régime de sanctions ;
7. activer uniquement les règles explicitement approuvées ;
8. terminer l'infrastructure réelle et la recette ;
9. seulement ensuite préparer une version réellement prête pour dépôt.
