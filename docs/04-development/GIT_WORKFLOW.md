# GIT_WORKFLOW — Flux Git du dépôt Regulatory

> **Statut :** `APPLICABLE`

## Séquence

1. lire les documents obligatoires ;
2. identifier `main` et le commit courant ;
3. auditer l’existant ;
4. préparer un changement atomique et non destructif ;
5. vérifier le diff ;
6. exécuter les contrôles disponibles ;
7. committer sur la branche actuelle avec message explicite ;
8. mettre à jour le suivi et les preuves.

## Interdictions

Aucune création ou modification de branche, aucune fusion, aucun force-push, aucune suppression ou réécriture. Une PR n’est utilisable que si elle ne nécessite aucune nouvelle branche et si le propriétaire l’autorise explicitement.

## Checklist

- [ ] documents lus ;
- [ ] état initial enregistré ;
- [ ] diff relu ;
- [ ] non-régression vérifiée ;
- [ ] documentation mise à jour ;
- [ ] commit et preuve enregistrés.
