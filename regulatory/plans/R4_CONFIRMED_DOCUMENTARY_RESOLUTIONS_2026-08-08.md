# R4 — Résolutions documentaires confirmées — 2026-08-08

> Complément au plan historique `R4_EXTERNAL_DEPENDENCIES_PROGRESS_2026-08-08.md`.  
> Registre courant : `regulatory/registries/INST066_CONFIRMED_EXTERNAL_DEPENDENCY_RESOLUTIONS_V0_1.yaml`.  
> `ready_for_submission=false`.

## Pourquoi ce complément

Le plan R4 historique conserve volontairement les états successifs de recherche : découverte de l'API AMF-UMOA, matérialisation des 16 circulaires, puis matrice de candidats. Depuis cette étape, le contenu propre de plusieurs binaires officiels a été confronté aux renvois de l'Instruction 66.

Ces nouvelles conclusions ne suppriment pas les anciennes preuves : elles ajoutent un niveau de résolution documentaire vérifié au-dessus de l'inventaire brut.

## État confirmé

Cinq occurrences de dépendances circulaires sont désormais documentées comme `RESOLVED` au niveau de l'identification de l'instrument :

| dependencyId | Article INST066 | Source officielle confirmée | Base de résolution |
|---|---:|---|---|
| `INST066_ART005_DEP_CIRC_01` | 5 | Circulaire n°10/CREPMF/2022 | La circulaire cite expressément l'article 5 de l'Instruction 66 et définit les éléments des frais généraux liés au niveau de fonds propres des SGO. |
| `INST066_ART013_DEP_CIRC_01` | 13 | Circulaire n°12/CREPMF/2022 | La circulaire définit l'Instruction comme l'Instruction 66 et reprend les trois sujets délégués : procédures d'évaluation/VNI, garanties de l'expert externe et fréquence. |
| `INST066_ART032_DEP_CIRC_01` | 32 | Circulaire n°07/CREPMF/2022 | Correspondance exacte des exigences relatives aux communications publicitaires. |
| `INST066_ART012_DEP_CIRC_01` | 12 | Circulaire n°14/CREPMF/2022 | La circulaire se rattache expressément à l'Instruction 66 et couvre systèmes/procédures de liquidité, simulations de crise et outils de liquidité. |
| `INST066_ART047_DEP_CIRC_01` | 47 | Circulaire n°14/CREPMF/2022 | La circulaire couvre explicitement les méthodes de suspension temporaire des rachats/remboursements et les conditions post-suspension. |

## Sources canoniques ajoutées

- `regulatory/sources/CIRCULAIRE_07_CREPMF_2022.yaml`
- `regulatory/sources/CIRCULAIRE_10_CREPMF_2022.yaml`
- `regulatory/sources/CIRCULAIRE_12_CREPMF_2022.yaml`
- `regulatory/sources/CIRCULAIRE_14_CREPMF_2022.yaml`

Les PDF et textes restent ceux du corpus officiel API déjà matérialisé sous `regulatory/sources/amf-umoa-2022-circulars/`.

## Frontière juridique

`RESOLVED` signifie ici uniquement : **le renvoi documentaire de l'Instruction 66 a été relié à l'instrument officiel qui l'implémente**.

Cela ne signifie pas :

- statut juridique courant définitivement validé ;
- absence d'une circulaire modificative ou d'un texte postérieur ;
- revue juridique terminée ;
- revue conformité terminée ;
- activation d'une exigence dans le moteur ;
- autorisation de calcul/contrôle automatique ;
- `ready_for_submission=true`.

Les métadonnées API de ces circulaires portent encore `legalStatus=TO_VERIFY`. Une vérification de version courante et d'éventuelles modifications ultérieures reste obligatoire.

## État quantitatif R4

Inventaire brut historique :

- 49 occurrences externes ;
- 2 occurrences Instruction 58 déjà résolues dans l'inventaire initial ;
- 5 occurrences supplémentaires désormais résolues documentairement par le registre de résolution confirmé ;
- les autres occurrences restent à examiner selon leur famille (`COUNCIL_CIRCULAR`, `COUNCIL_INSTRUCTION`, réglementation comptable, instruction nommée).

Le calcul d'une nouvelle file « unresolved » doit être effectué par un générateur qui superpose le registre de résolution confirmé à l'inventaire brut, sans modifier rétroactivement ce dernier.

## Prochaine séquence R4

1. confronter les autres correspondances fortes des circulaires 2022 au texte exact des articles concernés ;
2. priorités : rapports périodiques (C08), informations au Conseil Régional (C09), frais OPC (C11), risques (C15), conflits/règles de conduite (C16), prospectus (C05), DICI (C06) ;
3. distinguer une correspondance exacte d'une simple relation thématique ;
4. vérifier le statut juridique courant et les éventuels textes modificatifs ;
5. maintenir les renvois qualifiés d'`Instruction` séparés des circulaires ;
6. conserver le chantier sanctions R1 prioritaire dès qu'un binaire institutionnel de CM/10/06/2022 devient accessible ;
7. revue juridique et conformité avant toute activation.

## Invariants

- inventaire brut non réécrit ;
- aucune résolution automatique ;
- aucune activation automatique ;
- aucune inférence de version courante ;
- `ready_for_submission=false` ;
- déploiement production interdit avant clôture des huit gates.
