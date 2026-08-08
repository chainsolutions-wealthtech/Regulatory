# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-REG-001`

## Action

Poursuivre le **cross-check historique de l'article 92 de l'Instruction n°66/CREPMF/2021**, en recherchant maintenant une source officielle propre ou une seconde corroboration officielle pour l'**Instruction n°21/99**, relative à la classification des Organismes de Placement Collectif en Valeurs Mobilières.

L'état de référence est enregistré dans :

- `regulatory/registries/INST066_ABROGATED_TEXTS_INVENTORY_V0_1.yaml` ;
- `regulatory/review-evidence/INST066_HISTORICAL_CROSSCHECK/OFFICIAL_SOURCE_SEARCH_2026-08-08.yaml` ;
- `regulatory/sources/INSTRUCTION_21_CREPMF_1999.yaml`.

Le référentiel historique de l'article 92 couvre `7/7` sources distinctes :

- `1/7` possède son propre binaire officiel matérialisé : Instruction n°46/2011 révisée ;
- `2/7` — Instructions n°45/2011 et n°24/99 — sont corroborées par plusieurs actes officiels distincts, sans binaire propre ;
- `4/7` restent au niveau de preuve de l'article 92 officiel : Décision n°2012-119 et Instructions n°23/99, n°22/99 et n°21/99.

Les Instructions n°23/99 et n°22/99 ont atteint leur condition d'arrêt pour le périmètre public contrôlé le 2026-08-08 : leurs binaires propres n'ont pas été identifiés, les recherches institutionnelles sont documentées, et les décisions officielles `PCR/DA/2017/121` et `PCR/DA/2018/165` ne les citent pas.

Cette absence ne vaut pas preuve d'inexistence historique ; ces textes devront être repris si une archive institutionnelle, un binaire propre ou un nouvel acte officiel pertinent devient disponible.

## R1 sanctions — blocage conservé

Le régime de sanctions 2016 ↔ 2022 reste prioritaire juridiquement mais bloqué par l'absence des binaires officiels nécessaires. La preuve de recherche est conservée dans :

`regulatory/review-evidence/SANCTIONS_2016_2022/OFFICIAL_BINARY_SEARCH_2026-08-08.yaml`

R1 doit être repris immédiatement si un binaire officiel 2016 ou 2022 devient disponible. Aucune copie tierce ne peut être utilisée comme substitut normatif.

## Résultat attendu de l'action courante

Pour l'Instruction n°21/99 :

- rechercher les routes institutionnelles AMF-UMOA, ancien CREPMF, BRVM et archives officielles disponibles ;
- rechercher des actes administratifs officiels susceptibles de la citer explicitement dans leurs visas ;
- tenir compte du fait que les décisions officielles 2017 et 2018 déjà matérialisées ne citent pas 21/99 ;
- distinguer strictement une preuve corroborante de l'acte normatif propre ;
- si un binaire officiel propre est identifié : vérifier `%PDF`, calculer SHA-256 et taille, confirmer la pagination, extraire le texte avec OCR uniquement si nécessaire et matérialiser la source ;
- si un nouvel acte officiel de corroboration est trouvé : l'archiver séparément et ne promouvoir que les éléments réellement observés ;
- conserver le statut historique abrogé par l'article 92 de l'Instruction 66 ;
- ne reconstruire aucune classification historique depuis une copie tierce ;
- si aucune nouvelle route officielle n'est trouvée, documenter la condition d'arrêt et clôturer la première passe publique sur les sept textes de l'article 92.

## Invariants

- `historical_rule_reactivation_allowed=false` ;
- `requirement_activation_allowed=false` pour tout candidat non validé ;
- `automatic_rule_reconstruction_allowed=false` pour les textes historiques non matérialisés ;
- aucune règle historique n'est automatiquement migrée vers l'Instruction 66 ;
- revue juridique et conformité humaines obligatoires ;
- `ready_for_submission=false`.
