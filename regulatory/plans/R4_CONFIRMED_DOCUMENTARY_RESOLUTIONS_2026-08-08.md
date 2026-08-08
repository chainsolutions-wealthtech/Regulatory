# R4 — Résolutions documentaires confirmées — 2026-08-08

> Complément au plan historique `R4_EXTERNAL_DEPENDENCIES_PROGRESS_2026-08-08.md`.  
> Overlays courants : `INST066_CONFIRMED_EXTERNAL_DEPENDENCY_RESOLUTIONS_V0_1.yaml` et `INST066_CONFIRMED_INSTRUCTION_DEPENDENCY_RESOLUTIONS_V0_1.yaml`.  
> `ready_for_submission=false`.

## Pourquoi ce complément

Le plan R4 historique conserve volontairement les états successifs de recherche. Les résolutions confirmées sont superposées à l'inventaire brut ; elles ne le réécrivent pas.

`RESOLVED` signifie ici uniquement que le renvoi documentaire de l'Instruction 66 a été relié à un instrument officiel suffisamment identifié. Cela ne vaut ni activation de règle ni validation juridique finale.

## Circulaires

**25 des 34 occurrences `COUNCIL_CIRCULAR` sont documentées comme résolues au niveau source.**

Les instruments 2022 confirmés utilisés sont les Circulaires n°02 à n°16/CREPMF/2022 selon les mappings exacts conservés dans `INST066_CONFIRMED_EXTERNAL_DEPENDENCY_RESOLUTIONS_V0_1.yaml`.

### Neuf renvois circulaires encore ouverts

1. article 4 — limites applicables aux services auxiliaires proposés par une SGO ;
2. article 14 — conditions de délégation évitant une SGO « boîte aux lettres » ;
3. article 21 — contenu du rapport annuel du Dépositaire (`INST066_ART021_DEP_CIRC_01`) ;
4. article 23 — conditions d'admission des actions d'une SICAV aux négociations sur un marché réglementé ;
5. article 23 — conditions de délégation globale de gestion du portefeuille d'une SICAV à une SGO ;
6. article 59 — contenu détaillé, forme et mode de transmission des informations aux investisseurs dans une fusion ;
7. article 74 — conditions d'information et modalités de fonctionnement de la structure maître-nourricier (`INST066_ART074_DEP_CIRC_03`) ;
8. article 75 — contenu du rapport annuel du Conseil de Surveillance d'un FCPE ;
9. article 76 — contenu du rapport annuel du Conseil de Surveillance d'une SICAVAS.

Les articles 75/76 ne sont pas assimilés automatiquement à la Circulaire 08. Le premier renvoi de l'article 21 n'est pas assimilé à la Circulaire 04 faute de contenu exact retrouvé pour le rapport annuel du Dépositaire.

## Instructions

### Instruction n°64/CREPMF/2020

Son binaire officiel AMF-UMOA est matérialisé et le registre public la liste `NON ABROGE` au 2026-08-08.

Trois dépendances `COUNCIL_INSTRUCTION` sont maintenant résolues documentairement :

- `INST066_ART005_DEP_INST_01` — délai maximal de décision d'agrément SGO ;
- `INST066_ART005_DEP_INST_02` — étapes du processus d'agrément ;
- `INST066_ART017_DEP_INST_02` — délai de transmission des compléments et clôture du dossier.

Quatre dépendances `COUNCIL_INSTRUCTION` restent ouvertes :

- `INST066_ART005_DEP_INST_03` — délai de règlement des frais ;
- `INST066_ART017_DEP_INST_01` — délai spécifique de notification après décision FCP ;
- `INST066_ART021_DEP_INST_01` — procédures de contrôle du calcul de la valeur des parts/actions par le Dépositaire ;
- `INST066_ART025_DEP_INST_01` — délai applicable à une Société d'Investissement, gardé ouvert pour confirmation spécifique de périmètre.

### Instruction n°61/CREPMF/2020

`INST066_ART011_DEP_NAMED_INST_01` est désormais résolue documentairement vers `INSTRUCTION_61_CREPMF_2020` : l'Instruction 66 cite expressément son numéro, son objet de contrôle interne et son rôle. Son binaire officiel est matérialisé ; la revue complète du statut juridique courant reste à terminer.

## Réglementation comptable

Les cinq occurrences `SPECIFIC_ACCOUNTING_REGULATION` restent ouvertes.

Le Règlement n°09/2006/CM/UEMOA est identifié par une source gouvernementale officielle et son adoption du 29 juin 2006 est corroborée par la BCEAO. Cependant, sur le HEAD courant :

- le PDF matérialisé n'est pas présent ;
- le texte et les métadonnées matérialisées ne sont pas présents ;
- le mapping dérivé n'est pas présent ;
- le workflow de matérialisation existe et doit être exécuté lorsque GitHub Actions fonctionne ;
- l'AMF-UMOA a documenté en 2023 un chantier de révision du référentiel, sans qu'un acte public de remplacement ait été identifié dans la recherche actuelle.

Ces cinq occurrences restent donc `PENDING_BINARY_AND_CURRENT_VERSION_REVIEW`.

## État quantitatif courant

Inventaire brut : **49 occurrences externes**.

État documentaire courant :

- 2 occurrences Instruction 58 déjà résolues dans l'inventaire initial ;
- 25 occurrences circulaires résolues par l'overlay circulaires ;
- 3 occurrences `COUNCIL_INSTRUCTION` résolues vers Instruction 64 ;
- 1 dépendance nommée résolue vers Instruction 61 ;
- **31/49 dépendances reliées à une source officielle au niveau documentaire** ;
- **18/49 encore ouvertes**.

Détail :

- `COUNCIL_CIRCULAR` : 25/34 résolues, 9 ouvertes ;
- `COUNCIL_INSTRUCTION` : 3/7 résolues, 4 ouvertes ;
- `EXPLICIT_NAMED_CREPMF_INSTRUCTION` : 1/1 résolue ;
- `SPECIFIC_ACCOUNTING_REGULATION` : 0/5 résolue au niveau courant ;
- Instruction 58 explicite : 2/2 résolues dans l'inventaire brut.

Le générateur `scripts/build_inst066_current_external_dependency_state.py` calcule cet état sans muter l'inventaire historique. Son workflow est manuel tant que GitHub Actions est bloqué avant démarrage des jobs.

## Recherche institutionnelle

Le portail public actuel de l'AMF-UMOA expose une rubrique `Circulaires & Avis` et indique 39 circulaires publiées. Le corpus 2022 matérialisé ne couvre que 16 objets. Le constructeur `scripts/build_amf_umoa_circular_api_catalog.py` est prêt à bâtir un catalogue officiel multi-millésimes borné dès que les runners repartent.

## Frontière juridique

Aucune de ces résolutions ne signifie :

- statut juridique courant définitivement validé ;
- absence d'un texte modificatif/postérieur ;
- revue juridique terminée ;
- revue conformité terminée ;
- activation d'une exigence ;
- autorisation de calcul/contrôle réglementaire automatique ;
- `ready_for_submission=true`.

## Prochaine séquence R4

1. exécuter le catalogue API multi-millésimes pour les neuf circulaires résiduelles dès reprise des runners ;
2. rechercher les quatre `COUNCIL_INSTRUCTION` résiduelles dans les textes officiels ;
3. matérialiser le Règlement 09/2006 et vérifier l'issue de la révision comptable ;
4. vérifier les versions courantes/amendements des instruments déjà identifiés ;
5. conserver R1 sanctions prioritaire dès qu'un binaire institutionnel CM/10/06/2022 devient accessible ;
6. revue juridique et conformité avant toute activation.

## Invariants

- inventaire brut non réécrit ;
- aucune résolution automatique ;
- aucune activation automatique ;
- aucune inférence de version courante ;
- `ready_for_submission=false` ;
- déploiement production interdit avant clôture des huit gates.
