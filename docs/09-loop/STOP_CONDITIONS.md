# STOP_CONDITIONS — Conditions d’arrêt

> **Statut :** `APPLICABLE`

Arrêter ou bloquer l’action lorsque :

- une source essentielle est absente ou contradictoire ;
- une validation humaine requise manque ;
- la demande implique branche, force-push, réécriture, fusion ou déploiement interdits ;
- un secret ou une donnée sensible est exposé ;
- une action risque de supprimer un historique, un identifiant ou un artefact canonique ;
- les contrôles critiques échouent ;
- le périmètre devient ambigu ou dépasse l’autorité ;
- le rollback n’est pas possible pour une action risquée.

## Comportement

Préserver l’état, documenter faits, risques, question et preuve; mettre à jour `STATUS.md`, `HANDOFF.md`, `OPEN_QUESTIONS.md` et `NEXT_ACTION.md`. Ne jamais contourner silencieusement la condition d’arrêt.
