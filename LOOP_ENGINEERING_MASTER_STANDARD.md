# LOOP_ENGINEERING_MASTER_STANDARD — Standard maître adapté à Regulatory

> **Statut :** `APPLICABLE`

## Principe fondamental

Le projet est piloté par des boucles courtes, traçables, réversibles et fondées sur l’état réel du dépôt. Le Loop Engineering ne remplace ni le domaine métier ni les sources réglementaires : il organise la manière de poursuivre le travail sans perte de contexte ni régression.

## Séquence universelle

1. lire `00_START_HERE.md` et les documents canoniques ;
2. vérifier branche, commit et arborescence ;
3. établir l’état initial et les risques ;
4. définir une tâche et une prochaine action bornées ;
5. réaliser un changement atomique ;
6. vérifier le diff, les tests et les preuves ;
7. mettre à jour documentation, état, suivi et handoff ;
8. fermer ou bloquer explicitement la boucle.

## Règles Git spécifiques

La politique actuelle du dépôt est non générique : aucune nouvelle branche, aucun changement de branche, aucun force-push, aucune réécriture, aucune fusion ni aucun déploiement non demandé.

## Règles de vérité

- les textes officiels versionnés sont normatifs ;
- les artefacts machine-readable sont canoniques pour l’application ;
- les conversations ne sont pas la mémoire du projet ;
- les informations inconnues utilisent la mention exacte prévue dans `OPEN_QUESTIONS.md` ;
- les prospectus existants restent des cas de test.

## Non-régression

Préserver documents historiques, décisions, identifiants, colonnes, matrices, sources, preuves et sorties non concernées. Toute évolution structurante exige décision, impact, migration, rollback et contrôles.

## Reprise

Un nouvel agent doit pouvoir reprendre uniquement à partir de Git en suivant `00_START_HERE.md`, sans demander au propriétaire de répéter les informations déjà documentées.
