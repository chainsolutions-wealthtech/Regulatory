# LOOP_ENGINEERING — Standard de boucle appliqué

> **Statut :** `APPLICABLE`

## Définition

Le Loop Engineering est une méthode de continuité : observer l’état réel, établir une baseline, choisir une action bornée, améliorer sans régression, vérifier par des preuves, documenter, transmettre et définir une seule prochaine action.

Il ne signifie jamais recommencer, réécrire arbitrairement ou répéter aveuglément une tentative ayant échoué.

## Boucle canonique

```text
DISCOVER
→ BASELINE
→ SELECT
→ IMPACT_ANALYSIS
→ IMPLEMENT_COMPATIBLY
→ VERIFY
→ REGRESSION_CHECK
→ CORRECT_IF_REQUIRED
→ VERIFY_AGAIN
→ PERSIST_STATE
→ COMMIT
→ VERIFY_REMOTE_STATE
→ SELECT_NEXT
```

### DISCOVER

Lire `00_START_HERE.md`, `GOVERNANCE.md`, les documents canoniques et tout document pertinent au périmètre. Rechercher l’existant avant de créer.

### BASELINE

Relever branche, HEAD, état fonctionnel, tests, CI, données et artefacts concernés. Toute défaillance déjà présente est enregistrée comme préexistante.

### SELECT

Choisir l’action à partir de `NEXT_ACTION.md`, de la boucle active et des dépendances réelles. Une action déjà terminée ne doit pas être recommencée parce qu’un ancien TODO la présente encore comme ouverte.

### IMPACT_ANALYSIS

Identifier les données, schémas, API, règles, clauses, documents, sorties, tests, versions historiques et utilisateurs potentiellement affectés.

### IMPLEMENT_COMPATIBLY

Toujours préférer :

`RÉUTILISER → CORRIGER → RENFORCER → ÉTENDRE → MIGRER COMPATIBLEMENT`.

Aucune branche nouvelle. Aucun raccourci détruisant la compatibilité ou la traçabilité.

### VERIFY / REGRESSION_CHECK

Exécuter les contrôles disponibles, comparer à la baseline et prouver que les comportements valides non concernés restent préservés. Une CI existante en échec ne peut pas être déclarée `PASS`.

### CORRECT_IF_REQUIRED

Lorsqu’un contrôle échoue, analyser la cause et apporter une hypothèse ou correction matériellement différente. Ne pas supprimer ou affaiblir le contrôle pour faire passer l’itération.

### PERSIST_STATE

Synchroniser les documents appropriés sans réécrire l’historique : état courant, suivi, TODO, boucle, preuves, handoff, changelog et prochaine action.

### SELECT_NEXT

Continuer automatiquement les actions sûres, déterminées, réversibles et vérifiables du même objectif. S’arrêter sur une vraie décision humaine, une opération irréversible non autorisée, une source normative manquante ou l’absence de nouvelle hypothèse vérifiable.

## Invariants du dépôt

- `CANONICAL_WORK_BRANCH = main` ;
- Git et les artefacts versionnés sont la mémoire canonique ;
- aucune branche n’est créée ou changée pour le travail normal ;
- aucune donnée ou règle n’est inventée ;
- les documents historiques, décisions et identifiants restent préservés ;
- chaque document pertinent est lu et exploité selon son rôle ;
- les artefacts réglementaires non Markdown ne sont pas réécrits pour une réorganisation documentaire ;
- compatibilité descendante et non-régression sont obligatoires ;
- une validation humaine est requise pour les sujets sensibles ;
- `ready_for_submission` reste `false` sans validation formelle.

## Documents de boucle

`LOOP_STATE.md`, `CURRENT_ITERATION.md`, `NEXT_ACTION.md`, `WORK_LOG.md`, `HANDOFF.md`, `STATUS.md`, `SUIVI.md`, `TODO.md`, `CHANGELOG.md` et `docs/09-loop/`.

## Checklist

- [ ] état réel et HEAD vérifiés ;
- [ ] documents pertinents lus ;
- [ ] baseline et défaillances préexistantes enregistrées ;
- [ ] objectif unique ;
- [ ] impacts et risques identifiés ;
- [ ] changement compatible avec l’existant ;
- [ ] contrôles exécutés ;
- [ ] non-régression comparée à la baseline ;
- [ ] preuves conservées ;
- [ ] documentation, handoff et prochaine action à jour.
