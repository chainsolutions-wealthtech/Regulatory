# TOOL_POLICY — Politique d’utilisation des outils

> **Statut :** `APPLICABLE`

## Principes

Utiliser l’outil le moins privilégié permettant l’action. Lire avant d’écrire. Vérifier les paramètres, la cible, le diff et les effets. Conserver les preuves et traiter les erreurs explicitement.

## Interdictions

- aucune branche créée ou changée ;
- aucun force-push, réécriture, fusion ou déploiement non demandé ;
- aucun secret dans les arguments ou sorties ;
- aucune action destructive ou intrusive sans autorisation ;
- aucun outil web utilisé à la place d’une source privée connectée lorsqu’elle est requise ;
- aucune extraction considérée comme vérifiée sans contrôle.

## Actions sensibles

Écriture Git, données, sécurité, production, communications et approbations exigent périmètre clair, rollback et validation proportionnée. Les appels et résultats significatifs sont consignés dans `WORK_LOG.md` ou l’audit.
