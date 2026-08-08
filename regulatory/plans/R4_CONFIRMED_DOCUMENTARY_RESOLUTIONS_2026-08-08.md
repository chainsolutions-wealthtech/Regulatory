# R4 — Résolutions documentaires confirmées — 2026-08-08

> Complément au plan historique `R4_EXTERNAL_DEPENDENCIES_PROGRESS_2026-08-08.md`.  
> Registre courant : `regulatory/registries/INST066_CONFIRMED_EXTERNAL_DEPENDENCY_RESOLUTIONS_V0_1.yaml`.  
> `ready_for_submission=false`.

## Pourquoi ce complément

Le plan R4 historique conserve volontairement les états successifs de recherche : découverte de l'API AMF-UMOA, matérialisation des 16 circulaires 2022, puis matrice de candidats. Depuis cette étape, le contenu propre des binaires officiels a été confronté aux renvois de l'Instruction 66.

Ces nouvelles conclusions ne suppriment pas les anciennes preuves : elles ajoutent un niveau de résolution documentaire vérifié au-dessus de l'inventaire brut.

## État confirmé

**25 des 34 occurrences de dépendances de type `COUNCIL_CIRCULAR` sont désormais documentées comme `RESOLVED` au niveau de l'identification de l'instrument.**

Sources officielles confirmées et utilisées :

- Circulaire n°02/CREPMF/2022 — agrément des SGO ;
- Circulaire n°03/CREPMF/2022 — agrément/enregistrement des OPC ;
- Circulaire n°04/CREPMF/2022 — contrat et missions du dépositaire ;
- Circulaire n°05/CREPMF/2022 — contenu du prospectus ;
- Circulaire n°06/CREPMF/2022 — DICI ;
- Circulaire n°07/CREPMF/2022 — communications publicitaires ;
- Circulaire n°08/CREPMF/2022 — rapports périodiques des OPC ;
- Circulaire n°09/CREPMF/2022 — informations au Conseil Régional ;
- Circulaire n°10/CREPMF/2022 — frais généraux / niveau de fonds propres des SGO ;
- Circulaire n°11/CREPMF/2022 — frais de l'OPC ;
- Circulaire n°12/CREPMF/2022 — évaluation des OPC et de leurs actifs ;
- Circulaire n°13/CREPMF/2022 — classes de parts/actions ;
- Circulaire n°14/CREPMF/2022 — outils de gestion de la liquidité ;
- Circulaire n°15/CREPMF/2022 — gestion des risques des OPC ;
- Circulaire n°16/CREPMF/2022 — conflits d'intérêts et règles de conduite.

Le détail dependencyId → source officielle est conservé dans le registre de résolution confirmé.

## Neuf renvois circulaires encore ouverts

Après superposition du registre confirmé sur les 34 occurrences circulaires brutes, les neuf familles/occurrences résiduelles sont :

1. article 4 — limites applicables aux services auxiliaires proposés par une SGO ;
2. article 14 — conditions de délégation évitant une SGO « boîte aux lettres » ;
3. article 21 — contenu du rapport annuel du Dépositaire (`INST066_ART021_DEP_CIRC_01`) ;
4. article 23 — conditions d'admission des actions d'une SICAV aux négociations sur un marché réglementé ;
5. article 23 — conditions de délégation globale de gestion du portefeuille d'une SICAV à une SGO ;
6. article 59 — contenu détaillé, forme et mode de transmission des informations aux investisseurs dans une fusion ;
7. article 74 — conditions d'information et modalités de fonctionnement de la structure maître-nourricier (`INST066_ART074_DEP_CIRC_03`) ;
8. article 75 — contenu du rapport annuel du Conseil de Surveillance d'un FCPE ;
9. article 76 — contenu du rapport annuel du Conseil de Surveillance d'une SICAVAS.

Les articles 75 et 76 ne sont **pas** assimilés automatiquement à la Circulaire 08 : leur objet est le rapport annuel du Conseil de Surveillance, distinct du reporting périodique général de l'OPC. De même, le premier renvoi de l'article 21 n'est pas assimilé à la Circulaire 04 tant que son contenu de reporting annuel n'est pas retrouvé dans un texte officiel.

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
- 34 occurrences `COUNCIL_CIRCULAR` ;
- 25/34 occurrences circulaires maintenant résolues documentairement ;
- 9/34 occurrences circulaires encore ouvertes ;
- 2 occurrences Instruction 58 déjà résolues dans l'inventaire initial ;
- les autres familles (`COUNCIL_INSTRUCTION`, réglementation comptable, instruction nommée) restent gérées séparément.

Sur l'ensemble des 49 occurrences, **27 sont donc documentées comme résolues au niveau source** à ce stade : les 2 occurrences Instruction 58 de l'inventaire initial + les 25 résolutions circulaires confirmées. Cela laisse 22 occurrences de toutes familles encore ouvertes avant revue de statut juridique et activation humaine.

## Recherche institutionnelle des neuf résidus

Le portail public actuel de l'AMF-UMOA expose une rubrique `Circulaires & Avis` et le site indique 39 circulaires publiées. Le corpus matérialisé 2022 ne couvre que 16 objets. L'absence de résultat dans une recherche textuelle publique ne permet donc pas de conclure à l'absence d'un texte : les neuf renvois résiduels peuvent relever de millésimes antérieurs ou d'objets dont l'indexation publique est incomplète.

La prochaine recherche doit construire un catalogue API officiel multi-millésimes, puis confronter les titres et contenus aux neuf formulations résiduelles.

## Prochaine séquence R4

1. construire le catalogue complet/multi-millésimes des circulaires depuis l'API officielle AMF-UMOA ;
2. rechercher les neuf renvois résiduels par contenu et non par titre seul ;
3. distinguer correspondance exacte, parenté thématique et absence de preuve ;
4. vérifier le statut juridique courant et les éventuels textes modificatifs pour les 25 instruments déjà identifiés ;
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
