# BUG_POLICY — Politique de gestion des anomalies

> **Statut :** `APPLICABLE`

## Qualification

Une anomalie doit contenir état initial, version, comportement observé, attendu sourcé, reproduction, impact, sévérité, preuves et périmètre de régression.

## Priorité

Prioriser les défauts pouvant altérer une source, un identifiant, une règle, une clause, une donnée canonique, un document réglementaire, une preuve, la sécurité ou la reproductibilité.

## Correction

Rechercher la cause racine, ajouter un test de non-régression, vérifier les sorties non concernées, documenter le diff et mettre à jour suivi et changelog.

## Interdictions

Ne pas supprimer un test, masquer un échec, inventer une validation ou exposer des données sensibles. Une IA peut proposer une analyse mais les décisions réglementaires et de production restent humaines.
