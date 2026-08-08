# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-REG-001`

## Action

Poursuivre **R4 — textes d'application explicitement appelés par l'Instruction n°66/CREPMF/2021**, en traitant maintenant le bloc **Article 5 — conditions d'agrément de la Société de Gestion d'OPC**.

La priorité de cette tranche est d'identifier et, si possible, matérialiser le **binaire officiel de l'Instruction n°64/CREPMF/2020**, puis de comparer son texte aux renvois procéduraux de l'article 5 et de l'article 17 avant tout rapprochement définitif.

État de référence :

- `regulatory/registries/INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1.json` ;
- `regulatory/validation/INST066_EXTERNAL_IMPLEMENTING_TEXTS_VALIDATION_V0_1.json` ;
- `regulatory/sources/INSTRUCTION_64_CREPMF_2020.yaml` ;
- `regulatory/sources/INSTRUCTION_61_CREPMF_2020.yaml` ;
- `regulatory/registries/INST066_SPECIFIC_ACCOUNTING_REGULATION_DEPENDENCY_V0_1.yaml` ;
- `regulatory/review-evidence/INST066_EXTERNAL_DEPENDENCIES/ART004_AUXILIARY_SERVICES_CIRCULAR_SEARCH_2026-08-08.yaml`.

## État R4 actuel

L'inventaire déterministe issu du PDF officiel hashé de l'Instruction 66 contient :

- `49` occurrences de dépendances externes ;
- `47` occurrences non résolues ;
- `26` articles concernés ;
- `34` renvois à des circulaires du Conseil Régional ;
- `7` renvois génériques à des instructions du Conseil Régional ;
- `5` renvois à la réglementation comptable spécifique ;
- `2` occurrences explicitement reliées à l'Instruction 58 matérialisée ;
- `1` dépendance explicitement nommée supplémentaire : Instruction n°61/CREPMF/2020.

L'article 4 a atteint sa condition d'arrêt pour le périmètre public contrôlé : aucune référence officielle de la circulaire sur les limites de fourniture des services auxiliaires par les SGO n'a été identifiée. Aucun numéro n'a été inventé.

## Article 5 — dépendances à résoudre

L'Instruction 66 renvoie distinctement à :

1. une circulaire définissant les frais généraux servant au calcul du plancher de fonds propres ;
2. une circulaire précisant la liste des documents et le contenu/forme du programme d'activité ;
3. une instruction précisant le délai de notification des pièces manquantes ;
4. une instruction précisant les étapes du processus de traitement de la demande ;
5. une instruction précisant le délai d'acquittement des frais d'agrément.

Le registre officiel AMF-UMOA confirme actuellement :

- référence : `Instruction N°64/2020` ;
- intitulé : `Instruction relative aux conditions de traitement des dossiers de demande d'agrément ou d'approbation` ;
- statut observé au `2026-08-08` : `NON_ABROGE`.

Cette correspondance d'objet fait de l'Instruction 64 un candidat officiel fort pour une partie des renvois procéduraux des articles 5 et 17, mais **elle n'est pas encore une résolution** : son propre texte officiel doit être matérialisé et comparé.

Les recherches publiques par objet exact sur les circulaires « frais généraux » et « programme d'activité » n'ont pas encore donné de référence institutionnelle exploitable.

## Résultat attendu

Pour l'Instruction 64 :

- identifier une route binaire officielle AMF-UMOA, ancien CREPMF ou BRVM ;
- télécharger uniquement le binaire officiel ;
- vérifier `%PDF`, calculer SHA-256 et taille, confirmer la pagination ;
- extraire le texte avec OCR uniquement si nécessaire ;
- relever date d'acte, date d'effet, clauses d'abrogation/modification et statut documentaire ;
- comparer son périmètre mot à mot aux dépendances génériques des articles 5 et 17 ;
- ne passer une dépendance à `RESOLVED` que si le texte propre confirme la correspondance ;
- conserver les renvois non couverts en `REFERENCE_NOT_YET_IDENTIFIED`.

Si aucun binaire officiel de l'Instruction 64 n'est trouvé dans les routes institutionnelles publiques contrôlables, documenter `OFFICIAL_BINARY_NOT_MATERIALIZED` et poursuivre les deux circulaires de l'article 5 sans utiliser de copie tierce comme norme.

## R1 sanctions — blocage conservé

Le régime de sanctions 2016 ↔ 2022 reste prioritaire juridiquement mais bloqué par l'absence des binaires officiels nécessaires. Reprendre immédiatement R1 si un binaire officiel 2016 ou 2022 devient disponible.

## Invariants

- `candidate_match_is_resolution=false` tant que le binaire de l'Instruction 64 n'est pas comparé ;
- `automatic_dependency_resolution_allowed=false` ;
- `automatic_rule_reconstruction_allowed=false` ;
- `requirement_activation_allowed=false` pour tout candidat non validé ;
- revue juridique et conformité humaines obligatoires ;
- `ready_for_submission=false`.
