# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-REG-001`

## Action

Poursuivre le **cross-check historique de l'article 92 de l'Instruction n°66/CREPMF/2021**, en recherchant maintenant en priorité une source officielle propre ou une seconde corroboration officielle pour l'**Instruction n°23/99**, relative aux actifs gérés par les Organismes de Placement Collectif en Valeurs Mobilières.

L'état de référence est enregistré dans :

- `regulatory/registries/INST066_ABROGATED_TEXTS_INVENTORY_V0_1.yaml` ;
- `regulatory/review-evidence/INST066_HISTORICAL_CROSSCHECK/OFFICIAL_SOURCE_SEARCH_2026-08-08.yaml` ;
- `regulatory/sources/INSTRUCTION_23_CREPMF_1999.yaml`.

Le référentiel historique de l'article 92 couvre désormais `7/7` sources distinctes :

- `1/7` possède son propre binaire officiel matérialisé : Instruction n°46/2011 révisée ;
- `2/7` ont leur référence et leur intitulé corroborés par deux actes officiels distincts mais leur propre binaire manque : Instructions n°45/2011 et n°24/99 ;
- `4/7` restent pour l'instant au niveau de preuve de l'article 92 officiel : Décision n°2012-119 et Instructions n°23/99, n°22/99 et n°21/99.

L'Instruction n°45/2011 a atteint sa condition d'arrêt pour le périmètre public contrôlé : son propre binaire officiel n'a pas été identifié, la recherche négative est documentée, et son identité est désormais corroborée par la Décision officielle `PCR/DA/2018/165`. Elle doit être reprise si une archive institutionnelle ou son binaire propre devient disponible.

## R1 sanctions — blocage conservé

Le régime de sanctions 2016 ↔ 2022 reste prioritaire juridiquement mais bloqué par l'absence des binaires officiels nécessaires. La preuve de recherche est conservée dans :

`regulatory/review-evidence/SANCTIONS_2016_2022/OFFICIAL_BINARY_SEARCH_2026-08-08.yaml`

R1 doit être repris immédiatement si un binaire officiel 2016 ou 2022 devient disponible. Aucune copie tierce ne peut être utilisée comme substitut normatif.

## Résultat attendu de l'action courante

Pour l'Instruction n°23/99 :

- rechercher les routes institutionnelles AMF-UMOA, ancien CREPMF, BRVM et archives officielles disponibles ;
- rechercher également des actes administratifs officiels antérieurs ou postérieurs qui la citent explicitement dans leurs visas, afin d'obtenir une seconde corroboration institutionnelle ;
- distinguer strictement une preuve corroborante d'un acte normatif propre ;
- si un binaire officiel propre est identifié : vérifier `%PDF`, calculer SHA-256 et taille, confirmer la pagination, extraire le texte avec OCR uniquement si nécessaire et matérialiser la source ;
- si seule une décision officielle de corroboration est trouvée : l'archiver séparément et ne promouvoir que la référence et l'intitulé réellement observés ;
- conserver le statut historique abrogé par l'article 92 de l'Instruction 66 ;
- ne reconstruire ni ratio, ni seuil, ni obligation depuis une copie tierce ;
- si aucune nouvelle route officielle n'est trouvée, documenter la recherche négative puis passer à l'Instruction n°22/99.

## Invariants

- `historical_rule_reactivation_allowed=false` ;
- `requirement_activation_allowed=false` pour tout candidat non validé ;
- `automatic_rule_reconstruction_allowed=false` pour les textes historiques non matérialisés ;
- aucune règle historique n'est automatiquement migrée vers l'Instruction 66 ;
- revue juridique et conformité humaines obligatoires ;
- `ready_for_submission=false`.
