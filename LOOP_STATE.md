# LOOP_STATE — État persistant de la boucle

> **Statut :** `APPLICABLE`

## Identité

- Loop : `LOOP-REG-001`
- Tâche : `TASK-REG-001 — Enregistrer et préparer l’atomisation de l’Instruction n°66/CREPMF/2021`
- Type : corpus et exigences réglementaires
- État : `IN_PROGRESS`
- Date d’ouverture : `2026-08-05`
- Branche conservée : `main`
- Commit de départ : `4a62d87520ce62fcea52c8794f1c9b72cbec439d`
- Création ou changement de branche : interdit et non réalisé
- Boucle précédente : `LOOP-GOV-001` — `CLOSED`

## Objectif

Établir une provenance vérifiable de l’Instruction n°66/CREPMF/2021, enregistrer ses métadonnées et préparer une atomisation exhaustive sans modifier les identifiants, matrices et résultats existants de la Circulaire n°05/CREPMF/2022.

## Entrées vérifiées

- registre officiel AMF-UMOA des Instructions ;
- statut affiché pour l’Instruction n°66/2021 : `NON ABROGE` au 2026-08-05 ;
- publication BRVM datée du 12 janvier 2022 ;
- PDF distant identifié, `65` pages ;
- déclaration de publication : « Annule et remplace le précédent » ;
- corpus, mapping et schéma existants du dépôt.

## Sorties créées

- `regulatory/sources/INSTRUCTION_66_CREPMF_2021.yaml` ;
- `regulatory/plans/INSTRUCTION_66_ATOMIZATION_PLAN_V0_1.yaml` ;
- enregistrement de la source dans `regulatory/manifest.yaml` ;
- mise à jour de l’état et des questions ouvertes.

## Invariants

- conserver les identifiants `CIRC005_*` ;
- attribuer des identifiants distincts `INST066_*` ;
- relier les exigences équivalentes au lieu de les dupliquer silencieusement ;
- enregistrer article, paragraphe, page, applicabilité, produit et période d’effet ;
- ne rien marquer `VALIDATED`, `APPROVED` ou `ACTIVE` sans preuve de revue formelle ;
- ne pas inventer de seuil, ratio, date, dispense ou formulation.

## État des contrôles

- registre officiel et statut courant : `CONFIRMED` ;
- publication BRVM et date de publication : `CONFIRMED` ;
- URL du PDF et nombre de pages : `CONFIRMED` ;
- copie binaire locale, taille et SHA-256 : `PENDING` ;
- date de signature et date d’effet : `PENDING` ;
- prédécesseur annulé et remplacé : `PENDING` ;
- modificatifs et rectificatifs : `PENDING` ;
- atomisation article par article : `NOT_STARTED`.

## Conditions de fermeture

- intégrité binaire ou limitation documentaire formellement résolue ;
- index de structure complet ;
- inventaire des versions et textes liés ;
- plan d’atomisation validé structurellement ;
- documentation, suivi et prochaine action mis à jour ;
- aucune régression sur les artefacts CIRC005.
