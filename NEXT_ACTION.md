# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-DEV-001`

## Action

Implémenter l’adaptateur PostgreSQL transactionnel derrière `ProjectRepository`, avec injection d’un exécuteur SQL, résolution d’organisation depuis une identité serveur vérifiée, synchronisation atomique des réponses et collections, puis tests d’intégration sur PostgreSQL éphémère.

## Résultat attendu

- adaptateur PostgreSQL sans secret codé en dur ;
- pool de connexions configuré par variables d’environnement ;
- transaction par création, réponse et génération ;
- `SET LOCAL app.current_organization_id` issu du contexte d’identité, jamais du corps HTTP ;
- verrou optimiste ou pessimiste des versions ;
- synchronisation snapshot + tables normalisées + audit dans une transaction ;
- tests entre deux organisations et deux utilisateurs ;
- test de concurrence sur une même version ;
- aucun déploiement et aucune activation par défaut ;
- `ready_for_submission=false` maintenu.

## Condition d’arrêt

Ne pas simuler une authentification. Sans fournisseur d’identité et résolution de tenant vérifiables, l’adaptateur doit rester désactivé hors des tests éphémères.
