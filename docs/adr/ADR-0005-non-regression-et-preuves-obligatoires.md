# ADR-0005 — Non-régression et preuves obligatoires

- **Date :** 2026-08-05
- **Statut :** ACCEPTED
- **Tâche :** `TASK-GOV-001`
- **Décisions historiques liées :** `DEC-009`, `DEC-012`, `DEC-013`

## Contexte

Le dépôt contient déjà des décisions, 62 exigences, quatre matrices, 30 objets canoniques et des identifiants stables. Une réorganisation documentaire ne doit altérer aucun de ces actifs.

## Décision

Toute modification doit être précédée d’une analyse d’impact et suivie de contrôles et preuves proportionnés. Les documents historiques, identifiants, colonnes, sources, matrices, versions et sorties non concernées doivent rester stables.

## Conséquences et risques

Le changement est plus lent mais vérifiable. Le principal risque est de confondre validation structurelle et validation juridique; les statuts doivent rester distincts.

## Migration

Les nouveaux documents référencent les artefacts existants sans les réécrire. Les empreintes et comparaisons de tree servent de preuves.

## Rollback

Revenir par un commit correctif ou un revert non destructif autorisé, documenter la cause et relancer tous les contrôles. Ne jamais réécrire l’historique.
