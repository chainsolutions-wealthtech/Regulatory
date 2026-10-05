# EXTERNAL_AGENT_CONTRACT — worker continu

Ce contrat permet de raccorder un agent hors session ChatGPT sans modifier l'architecture métier.

## Entrée

Le worker reçoit repository, branche main, HEAD réel, autorités, checkpoint, NEXT_ACTION et résultats CI récents.

## Lease

Avant toute écriture, le worker doit obtenir un lease logique unique. Deux workers ne doivent jamais écrire simultanément sur main.

Un lease contient au minimum worker_id, task_id, base_head, acquired_at, expires_at et heartbeat_at.

Un lease expiré peut être repris seulement après vérification du HEAD et des CI.

## Cycle

1. lire ;
2. comparer checkpoint et HEAD ;
3. sélectionner une mini-tâche ;
4. implémenter ;
5. commit atomique ;
6. attendre/observer les gates ;
7. corriger avec une hypothèse différente si nécessaire ;
8. persister état et checkpoint ;
9. relâcher le lease ;
10. prendre la mini-tâche suivante.

## Arrêt obligatoire

Le worker s'arrête sur décision propriétaire, source normative manquante, revue humaine requise, credential manquant, opération irréversible non autorisée, régression non comprise ou absence d'hypothèse nouvelle.

## Fournisseur

Le protocole est indépendant du fournisseur. Un runner GitHub, un service sur VPS ou un orchestrateur externe peut l'implémenter. Les credentials restent hors dépôt.
