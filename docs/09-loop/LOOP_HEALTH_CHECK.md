# LOOP_HEALTH_CHECK — Santé de la boucle

> **Statut :** `APPLICABLE`

## Contrôles

- [ ] ordre de lecture respecté ;
- [ ] branche et commit enregistrés ;
- [ ] objectif borné et prochaine action unique ;
- [ ] documents canoniques identifiés ;
- [ ] aucun doublon ou conflit silencieux ;
- [ ] contrôles et preuves disponibles ;
- [ ] échecs, risques et questions ouverts visibles ;
- [ ] état, suivi, TODO, journal et handoff cohérents ;
- [ ] aucune branche créée ou changée ;
- [ ] aucun force-push, fusion ou déploiement ;
- [ ] aucune donnée, règle ou validation inventée ;
- [ ] artefacts non Markdown préservés.

## Résultat

`HEALTHY`, `DEGRADED`, `BLOCKED` ou `CLOSED`. Le statut doit être accompagné de preuves et de la date. Une boucle dégradée ne doit pas être déclarée saine pour accélérer sa clôture.
