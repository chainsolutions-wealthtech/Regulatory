# QUALITY_GATES — Portes de qualité

> **Statut :** `APPLICABLE`

## Portes minimales

1. contexte, source et version vérifiés ;
2. diff relu et périmètre respecté ;
3. identifiants et artefacts non concernés inchangés ;
4. contrôles de structure, liens et non-régression exécutés ;
5. aucune information inventée ni aucun secret ;
6. documentation, suivi, état et handoff cohérents ;
7. validations humaines requises enregistrées ou statut laissé en attente ;
8. rollback défini.

Les commandes automatisées de build, test, lint et scan restent `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.` Elles ne doivent pas être simulées.

## Résultat

Une porte peut être `PASS`, `FAIL`, `BLOCKED` ou `NOT_APPLICABLE`, avec preuve. Aucun échec n’est masqué pour clôturer une tâche.
