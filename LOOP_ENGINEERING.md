# LOOP_ENGINEERING — Standard de boucle appliqué

> **Statut :** `APPLICABLE`

## Définition

Le Loop Engineering est une méthode de continuité : observer l’état réel, choisir une action bornée, exécuter sans régression, vérifier par des preuves, documenter, transmettre et définir une seule prochaine action.

## Boucle

```text
Contexte vérifié
→ objectif borné
→ analyse d’impact
→ action atomique
→ contrôles
→ preuves
→ documentation
→ handoff
→ prochaine action
```

## Invariants du dépôt

- Git et les artefacts versionnés sont la mémoire canonique ;
- aucune branche n’est créée ou changée ;
- aucune donnée ou règle n’est inventée ;
- les documents historiques et identifiants restent préservés ;
- les artefacts réglementaires non Markdown ne sont pas réécrits pour une réorganisation documentaire ;
- une validation humaine est requise pour les sujets sensibles.

## Documents de boucle

`LOOP_STATE.md`, `CURRENT_ITERATION.md`, `NEXT_ACTION.md`, `WORK_LOG.md`, `HANDOFF.md`, `STATUS.md` et `docs/09-loop/`.

## Checklist

- [ ] état réel vérifié ;
- [ ] objectif unique ;
- [ ] impacts et risques identifiés ;
- [ ] contrôles exécutés ;
- [ ] preuves conservées ;
- [ ] documentation et handoff à jour.
