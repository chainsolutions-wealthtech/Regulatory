# STATUS — État courant du projet

> **Statut :** `APPLICABLE`  
> **Photographie au :** 2026-08-05  
> **Référence de boucle :** `LOOP-REG-001` — `IN_PROGRESS`.

## Terminé

- cadrage OPCVM/FCP UMOA ;
- gouvernance initiale et décisions `DEC-001` à `DEC-014` ;
- mapping machine-readable initial de la Circulaire n°05/CREPMF/2022 ;
- `62` exigences V1, quatre matrices CSV et `30` objets canoniques ;
- intégration additive des `176/176` chemins Markdown du kit Loop Engineering dans `LOOP-GOV-001` ;
- clôture de `TASK-GOV-001` sans suppression, branche, fusion, migration ou déploiement ;
- identification du registre officiel AMF-UMOA des Instructions ;
- confirmation que l’Instruction n°66/2021 est listée `NON ABROGE` au contrôle du 2026-08-05 ;
- identification de la publication BRVM du 12 janvier 2022 et du PDF de `65` pages ;
- création de `regulatory/sources/INSTRUCTION_66_CREPMF_2021.yaml` ;
- création de `regulatory/plans/INSTRUCTION_66_ATOMIZATION_PLAN_V0_1.yaml` ;
- mise à jour du manifeste réglementaire sans modification des `62` identifiants CIRC005 existants.

## En cours — LOOP-REG-001

- contrôle de l’intégrité binaire de la copie PDF ;
- confirmation de la date exacte de signature et de prise d’effet ;
- identification du texte précédent annulé et remplacé ;
- inventaire des éventuels modificatifs, rectificatifs et textes connexes ;
- préparation de l’index des titres, chapitres, sections et articles ;
- préparation du futur crosswalk `INST066 ↔ CIRC005 ↔ modèle canonique`.

## État documentaire vérifié

- branche conservée : `main` ;
- aucune autre branche présente au démarrage de `LOOP-REG-001` ;
- commit de départ de la boucle : `4a62d87520ce62fcea52c8794f1c9b72cbec439d` ;
- documents canoniques historiques maintenus ;
- artefacts CIRC005, matrices et modèle canonique préservés ;
- aucune règle INST066 n’a encore le statut `VALIDATED`, `APPROVED` ou `ACTIVE`.

## Anomalie historique conservée — archive binaire du kit Loop Engineering

Les neuf fragments Base64 sous `docs/kits/parts/` ne permettent pas de reconstruire fidèlement le ZIP source. Ils restent exclus de la source de vérité et marqués `INVALID_UNVERIFIED_LEGACY_FRAGMENTS`.

## Bloqué ou non vérifié

- SHA-256 et taille exacte du PDF de l’Instruction n°66/2021 ;
- date exacte de signature et date d’effet de l’Instruction n°66/2021 ;
- identité du texte précédent annulé et remplacé ;
- existence et portée de modificatifs ou rectificatifs postérieurs ;
- date officielle de publication et état juridique actuel de la Circulaire n°05/CREPMF/2022 ;
- responsables métier, conformité, juridique, fiscal, technique et sécurité ;
- stack, environnements, base, build, tests et déploiement ;
- validation juridique et conformité des clauses et mappings.

## Risques immédiats

- confondre le statut `NON ABROGE` du registre avec une validation juridique exhaustive de toutes les versions ;
- atomiser à partir d’une copie non empreintée sans déclarer la limite ;
- créer des doublons entre `INST066` et `CIRC005` au lieu de lier les exigences ;
- transformer une observation de prospectus en règle normative ;
- activer un wording avant revue juridique et conformité.

## Prochaine action unique

Voir `NEXT_ACTION.md` : compléter le contrôle de source de l’Instruction n°66/2021, puis produire son index structurel machine-readable avant toute atomisation détaillée.
