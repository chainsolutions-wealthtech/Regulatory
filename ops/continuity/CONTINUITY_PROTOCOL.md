# CONTINUITY_PROTOCOL — Regulatory

> Statut : APPLICABLE
> Objectif : rendre la reprise indépendante de la durée d'une session ou du fournisseur d'agent.

## Principe

Le dépôt reste la mémoire canonique. Une session, un agent ou un modèle peut disparaître sans perdre la continuité si le prochain intervenant peut reconstruire l'état depuis Git, les preuves et le checkpoint.

Éléments :
- ops/continuity/CHECKPOINT.json : point de reprise machine-readable ;
- ops/continuity/POLICY.json : seuils et invariants ;
- scripts/continuity-watchdog.mjs : détection de stall/boucle/divergence ;
- .github/workflows/continuity-watchdog.yml : exécution périodique indépendante d'une session.

## Détection de blocage

Le watchdog signale :
- workflow queued ou in_progress au-delà du budget ;
- répétition de deux échecs ou plus sur le même workflow ;
- absence de progression matérielle pendant le budget configuré ;
- checkpoint en retard sur main au-delà de la grâce autorisée ;
- divergence branche/checkpoint.

Il distingue les commits automatiques de rafraîchissement de preuves des commits matériels.

## Détection de boucle

Un agent est à risque de boucle lorsque :
- le même workflow échoue plusieurs fois sans changement matériel ;
- la même prochaine action persiste malgré plusieurs commits matériels ;
- une CI est relancée sans hypothèse ou correction différente ;
- le HEAD évolue uniquement par preuves alors qu'une action sûre reste ouverte.

## Règle de reprise

Tout agent entrant suit : DISCOVER -> HEAD réel -> CHECKPOINT -> docs canoniques -> CI -> delta depuis checkpoint -> action autorisée.

Si CHECKPOINT.sourceHead diffère de main, inspecter le delta. Les seuls commits automatiques de preuve peuvent être absorbés sans requalification fonctionnelle.

## Agent externe continu

Un worker externe peut être raccordé plus tard mais doit respecter :
- identité dédiée à droits minimaux ;
- aucune branche nouvelle ;
- un seul lease d'écriture sur main ;
- lecture obligatoire des autorités ;
- tâche bornée issue de NEXT_ACTION/checkpoint ;
- commit atomique ;
- attente des CI ;
- correction matériellement différente en cas d'échec ;
- mise à jour du checkpoint/handoff ;
- arrêt sur décision humaine ou source normative manquante.

Aucun secret fournisseur ne doit être commité.

## Ce que le watchdog ne fait jamais

- écrire du code ;
- activer clause/exigence/sanction ;
- simuler une revue humaine ;
- contourner une CI ;
- modifier ready_for_submission ;
- créer une branche ;
- force-push.
