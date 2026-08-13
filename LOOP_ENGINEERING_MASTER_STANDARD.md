# LOOP_ENGINEERING_MASTER_STANDARD — Standard maître adapté à Regulatory

> **Statut :** `APPLICABLE`

## Principe fondamental

Le projet est piloté par des boucles courtes, traçables, réversibles et fondées sur l’état réel du dépôt. Le Loop Engineering ne remplace ni le domaine métier ni les sources réglementaires : il organise la manière de poursuivre le travail sans perte de contexte ni régression.

Le standard de ce dépôt est `IMPROVEMENT_ONLY` : utiliser et consolider l’existant avant toute création concurrente.

## Contrat Git

```text
CANONICAL_WORK_BRANCH = main
NEW_BRANCH_CREATION = FORBIDDEN
NORMAL_WORK_PR = NOT_REQUIRED
FORCE_PUSH = FORBIDDEN
HISTORY_REWRITE = FORBIDDEN
```

## Séquence universelle

1. lire `00_START_HERE.md`, `GOVERNANCE.md` et les documents canoniques ;
2. vérifier branche, commit et arborescence ;
3. lire les documents directement concernés et rechercher l’existant ;
4. établir la baseline, y compris les défaillances préexistantes ;
5. définir une tâche et une prochaine action bornées ;
6. analyser les impacts et la compatibilité ;
7. réaliser un changement atomique en réutilisant/corrigeant/renforçant l’existant ;
8. vérifier le diff, les tests, la non-régression et les preuves ;
9. corriger et revérifier si nécessaire ;
10. mettre à jour documentation, état, suivi et handoff sans réécrire l’histoire ;
11. vérifier l’état distant ;
12. fermer, continuer ou bloquer explicitement la boucle.

## Règles de vérité

- les textes officiels versionnés sont normatifs ;
- les artefacts machine-readable sont canoniques pour l’application selon leur rôle ;
- les conversations ne sont pas la mémoire du projet ;
- les informations inconnues utilisent la mention exacte prévue dans `OPEN_QUESTIONS.md` ;
- les prospectus existants restent des cas de test ;
- une implémentation n’est pas automatiquement une activation, un déploiement ou une validation de conformité.

## Documentation

Chaque document existant peut porter un rôle distinct. Aucun fichier n’est supprimé ou simplifié sur la seule base d’un recouvrement thématique. Lire, classifier, relier et préserver les informations uniques avant toute action documentaire.

## Non-régression

Préserver documents historiques, décisions, identifiants, colonnes, matrices, sources, preuves, API, formats historiques et sorties non concernées. Toute évolution structurante exige décision, impact, migration, rollback ou compatibilité, et contrôles adaptés.

## Reprise

Un nouvel agent doit pouvoir reprendre uniquement à partir de Git en suivant `00_START_HERE.md`, sans demander au propriétaire de répéter les informations déjà documentées.
