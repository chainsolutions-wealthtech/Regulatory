# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-REG-001`

## Action

Poursuivre le **cross-check historique de l'article 92 de l'Instruction n°66/CREPMF/2021**, en recherchant en priorité une source officielle pour l'**Instruction n°45/2011** relative à l'organisation, au fonctionnement et à la gestion des OPCVM, puis matérialiser son binaire officiel s'il est identifié.

L'état de référence est enregistré dans :

- `regulatory/registries/INST066_ABROGATED_TEXTS_INVENTORY_V0_1.yaml` ;
- `regulatory/review-evidence/INST066_HISTORICAL_CROSSCHECK/OFFICIAL_SOURCE_SEARCH_2026-08-08.yaml`.

L'Instruction n°46/2011 révisée est déjà matérialisée depuis une source BRVM officielle, hashée, extraite et indexée. Six références historiques restent sans binaire officiel matérialisé :

1. Décision n°2012-119 ;
2. Instruction n°45/2011 ;
3. Instruction n°24/99 ;
4. Instruction n°23/99 ;
5. Instruction n°22/99 ;
6. Instruction n°21/99.

## R1 sanctions — blocage conservé

Le régime de sanctions 2016 ↔ 2022 reste prioritaire juridiquement mais sa condition d'arrêt documentaire a été atteinte pour le périmètre public contrôlé le 2026-08-08 :

- la Décision n° `CM/SJ/O01/03/2016` est confirmée dans le registre AMF-UMOA, avec statut observé `NON_ABROGE` ;
- l'adoption d'un dispositif révisé le 24 juin 2022 est officiellement confirmée ;
- la référence `CM/10/06/2022` est corroborée par une source d'autorité publique ;
- aucun binaire normatif officiel stable de ces deux décisions n'a été identifié dans les routes officielles publiquement indexées contrôlées ;
- la preuve de recherche est enregistrée dans `regulatory/review-evidence/SANCTIONS_2016_2022/OFFICIAL_BINARY_SEARCH_2026-08-08.yaml`.

R1 doit être repris immédiatement si un binaire officiel 2016 ou 2022 devient disponible, mais aucune copie tierce ne doit être utilisée comme substitut normatif.

## Résultat attendu de l'action courante

Pour l'Instruction n°45/2011 :

- rechercher les routes institutionnelles AMF-UMOA, BRVM et archives officielles disponibles ;
- confirmer l'identité du texte avant tout téléchargement ;
- si un binaire officiel est identifié : vérifier `%PDF`, calculer SHA-256 et taille, confirmer la pagination, extraire le texte avec OCR uniquement si nécessaire et créer un enregistrement source historique ;
- relier explicitement cette source à l'article 92 de l'Instruction 66 ;
- conserver son statut historique abrogé ;
- ne réactiver aucune obligation issue du texte historique ;
- si aucune route officielle n'est trouvée, documenter la recherche négative puis passer à la référence historique suivante sans utiliser de copie tierce.

## Invariants

- `historical_rule_reactivation_allowed=false` ;
- `requirement_activation_allowed=false` pour tout candidat non validé ;
- aucune règle historique n'est automatiquement migrée vers l'Instruction 66 ;
- revue juridique et conformité humaines obligatoires ;
- `ready_for_submission=false`.
