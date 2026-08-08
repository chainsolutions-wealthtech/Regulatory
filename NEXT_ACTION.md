# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-REG-001`

## Action

Poursuivre le **cross-check historique de l'article 92 de l'Instruction n°66/CREPMF/2021**, en recherchant maintenant en priorité une source officielle propre ou une seconde corroboration officielle pour l'**Instruction n°22/99**, relative à l'agrément des Organismes de Placement Collectif en Valeurs Mobilières et à l'information du public.

L'état de référence est enregistré dans :

- `regulatory/registries/INST066_ABROGATED_TEXTS_INVENTORY_V0_1.yaml` ;
- `regulatory/review-evidence/INST066_HISTORICAL_CROSSCHECK/OFFICIAL_SOURCE_SEARCH_2026-08-08.yaml` ;
- `regulatory/sources/INSTRUCTION_22_CREPMF_1999.yaml`.

Le référentiel historique de l'article 92 couvre `7/7` sources distinctes :

- `1/7` possède son propre binaire officiel matérialisé : Instruction n°46/2011 révisée ;
- `2/7` — Instructions n°45/2011 et n°24/99 — sont corroborées par plusieurs actes officiels distincts, sans binaire propre ;
- `4/7` restent au niveau de preuve de l'article 92 officiel : Décision n°2012-119 et Instructions n°23/99, n°22/99 et n°21/99.

L'Instruction n°23/99 a atteint sa condition d'arrêt pour le périmètre public contrôlé le 2026-08-08 :

- aucune route institutionnelle vers son propre binaire n'a été identifiée ;
- les décisions CREPMF/BRVM `PCR/DA/2018/165` et `PCR/DA/2017/121` ont toutes deux été matérialisées et analysées ;
- aucune de ces deux décisions ne cite l'Instruction n°23/99 ;
- cette absence ne vaut pas preuve d'inexistence ou d'inapplicabilité historique ; elle ferme seulement ces deux pistes de corroboration.

L'Instruction n°23/99 devra être reprise immédiatement si une archive institutionnelle, un binaire propre ou un nouvel acte officiel pertinent devient disponible.

## R1 sanctions — blocage conservé

Le régime de sanctions 2016 ↔ 2022 reste prioritaire juridiquement mais bloqué par l'absence des binaires officiels nécessaires. La preuve de recherche est conservée dans :

`regulatory/review-evidence/SANCTIONS_2016_2022/OFFICIAL_BINARY_SEARCH_2026-08-08.yaml`

R1 doit être repris immédiatement si un binaire officiel 2016 ou 2022 devient disponible. Aucune copie tierce ne peut être utilisée comme substitut normatif.

## Résultat attendu de l'action courante

Pour l'Instruction n°22/99 :

- rechercher les routes institutionnelles AMF-UMOA, ancien CREPMF, BRVM et archives officielles disponibles ;
- rechercher aussi des actes administratifs officiels qui la citent explicitement dans leurs visas ;
- exploiter les décisions officielles 2017 et 2018 déjà matérialisées comme preuves négatives de périmètre : elles ne citent pas 22/99 ;
- distinguer strictement une preuve corroborante de l'acte normatif propre ;
- si un binaire officiel propre est identifié : vérifier `%PDF`, calculer SHA-256 et taille, confirmer la pagination, extraire le texte avec OCR uniquement si nécessaire et matérialiser la source ;
- si un nouvel acte officiel de corroboration est trouvé : l'archiver séparément et ne promouvoir que les éléments réellement observés ;
- conserver le statut historique abrogé par l'article 92 de l'Instruction 66 ;
- ne reconstruire ni règle, ni condition d'agrément, ni obligation d'information depuis une copie tierce ;
- si aucune nouvelle route officielle n'est trouvée, documenter la recherche négative puis passer à l'Instruction n°21/99.

## Invariants

- `historical_rule_reactivation_allowed=false` ;
- `requirement_activation_allowed=false` pour tout candidat non validé ;
- `automatic_rule_reconstruction_allowed=false` pour les textes historiques non matérialisés ;
- aucune règle historique n'est automatiquement migrée vers l'Instruction 66 ;
- revue juridique et conformité humaines obligatoires ;
- `ready_for_submission=false`.
