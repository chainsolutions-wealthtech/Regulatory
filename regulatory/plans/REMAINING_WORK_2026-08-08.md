# Remaining work — 2026-08-08

## Statut de référence

Ce document est une photographie opérationnelle du reste à faire après la compilation de l'Instruction 58. Il ne remplace pas l'historique de `TODO.md`, mais corrige son retard par rapport à l'état réel du dépôt.

### Déjà réalisé

- Circulaire n°05/CREPMF/2022 : `62` exigences V1 structurées pour le parcours FCP/SGO.
- Instruction n°66/CREPMF/2021 : PDF officiel matérialisé, SHA-256 calculé, `65` pages, articles `1–92` indexés, `92` atomes structuraux et `111` exigences candidates détaillées compilées.
- Instruction n°58/CREPMF/2019 : PDF officiel matérialisé, SHA-256 `38258d7cae5518a6bea6b195facbb717e4a98c1eb734b30bc5e7de91917d0c57`, `17` pages, articles `1–35` indexés, `35` blocs, `35` atomes et `32` exigences candidates détaillées compilées.
- Crosswalk Instruction 58 : `18` liens vers CIRC005 et `9` liens vers INST066.
- Toutes les exigences INST066 et INST058 restent `FORBIDDEN`, avec revue juridique et conformité `PENDING`.
- Le produit exécutable, le modèle canonique, PostgreSQL/RLS, le workflow de revue, le DOCX déterministe et les principales CI existent déjà.

## Reste réglementaire prioritaire

### R1 — Décision sanctions CM/SJ/O01/03/2016

État : `IN_PROGRESS`.

- registre officiel AMF-UMOA identifié ;
- statut observé : `NON_ABROGE` ;
- dépendance enregistrée dans `regulatory/sources/DECISION_CM_SJ_001_03_2016.yaml` ;
- PDF binaire officiel stable : `TO_IDENTIFY` ;
- SHA-256, taille, pagination et index : à produire ;
- atomisation : à produire ;
- barèmes/montants : strictement interdits avant matérialisation et double revue.

Cette source est nécessaire pour fermer les dépendances de `INST058_ART031_REQ001` et `INST058_ART032_REQ001`.

### R2 — Métadonnées juridiques Instruction 58

État : `OPEN`.

- confirmer visuellement la date exacte de signature sur le PDF officiel ;
- confirmer la date d'effet ;
- vérifier le prédécesseur et la portée de l'abrogation de l'Instruction n°31/2005 ;
- rechercher modificatifs, rectificatifs ou textes postérieurs ;
- vérifier le statut actuel directement dans le registre dynamique AMF-UMOA.

### R3 — Métadonnées et historique complet Instruction 66

État : `OPEN`.

- fermer l'inventaire des textes cités et prédécesseurs ;
- rechercher les modificatifs et rectificatifs ;
- conserver une preuve officielle de chaque statut courant ;
- revoir juridiquement les seuils, exemptions et délais extraits par OCR.

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

1. matérialiser la Décision CM/SJ/O01/03/2016 ;
2. fermer les métadonnées juridiques de l'Instruction 58 ;
3. inventorier et matérialiser les autres textes OPC complémentaires ;
4. lancer la double revue humaine INST066/INST058 ;
5. activer uniquement les règles explicitement approuvées ;
6. terminer l'infrastructure réelle et la recette ;
7. seulement ensuite préparer une version réellement prête pour dépôt.
