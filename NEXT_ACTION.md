# NEXT_ACTION — Une seule action exécutable

> **Statut :** `READY`  
> **Boucle active :** `LOOP-REG-001`.

## Action

Matérialiser une copie exploitable du PDF de l’Instruction n°66/CREPMF/2021, calculer sa taille et son SHA-256, puis produire l’index machine-readable complet de ses titres, chapitres, sections et articles sans encore créer les exigences atomiques détaillées.

## Préconditions déjà satisfaites

- registre officiel AMF-UMOA identifié ;
- Instruction n°66/2021 listée `NON ABROGE` au 2026-08-05 ;
- publication BRVM du 12 janvier 2022 identifiée ;
- PDF distant de `65` pages identifié ;
- source enregistrée dans `regulatory/sources/INSTRUCTION_66_CREPMF_2021.yaml` ;
- plan enregistré dans `regulatory/plans/INSTRUCTION_66_ATOMIZATION_PLAN_V0_1.yaml` ;
- branche `main` conservée.

## Fichiers concernés

- `regulatory/sources/INSTRUCTION_66_CREPMF_2021.yaml`
- `regulatory/requirements/INST066_ARTICLE_INDEX_V0_1.yaml`
- `regulatory/manifest.yaml`
- `docs/REGULATORY_MAPPING.md`
- `STATUS.md`
- `LOOP_STATE.md`
- `CURRENT_ITERATION.md`
- `WORK_LOG.md`
- `SUIVI.md`
- `TODO.md`

## Résultat attendu

- copie locale ou référence d’archive exploitable ;
- taille exacte ;
- SHA-256 ;
- nombre de pages confirmé ;
- date de signature et date d’effet relevées lorsqu’elles sont lisibles ;
- index complet des articles avec coordonnées de page ;
- aucune exigence détaillée déclarée `VALIDATED` ;
- aucun identifiant `CIRC005_*` modifié.

## Preuves attendues

- URL de la source ;
- empreinte et taille ;
- index des articles ;
- contrôle d’unicité et de continuité des numéros ;
- liste des pages illisibles ou ambiguës ;
- diff Git contrôlé ;
- journal des limitations.

## Condition d’arrêt

En cas d’impossibilité de matérialiser fidèlement le PDF, enregistrer la limitation et ne pas inventer l’empreinte. L’index peut être préparé uniquement à partir de pages effectivement consultables, avec provenance et niveau de confiance explicites.
