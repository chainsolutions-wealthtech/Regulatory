# ADR-0008 — Démarrage de la tranche verticale exécutable du Prospectus Composer

- **Date :** 2026-08-05
- **Statut :** `ACCEPTED`
- **Boucle :** `LOOP-DEV-001`

## Contexte

Le dépôt disposait déjà de l’architecture, de la spécification fonctionnelle, de 62 exigences CIRC005 et de quatre matrices reliant exigences, champs, questions, effets, contrôles, preuves et sections. Aucun code applicatif n’exécutait encore cette chaîne.

Le propriétaire a demandé de commencer la construction du moteur afin de pouvoir renseigner des informations et observer immédiatement la génération du prospectus de bout en bout.

## Décision

Une première tranche verticale exécutable est introduite directement sur la branche `main`, sans créer de branche, avec les choix suivants :

- Node.js `22+` ;
- modules ECMAScript ;
- aucune dépendance externe pour cette première tranche ;
- lecture directe des quatre matrices CIRC005 existantes ;
- données d’entrée JSON structurées ;
- règles déterministes ;
- clauses techniques au statut `DRAFT_LEGAL_REVIEW_REQUIRED` ;
- composition d’un modèle documentaire intermédiaire ;
- génération initiale en Markdown et JSON ;
- tests natifs avec `node:test` ;
- cas United Capital Diamond utilisé uniquement comme fixture de test.

Ce choix ne constitue pas une décision définitive sur le framework web, la base PostgreSQL, le moteur DOCX/PDF, le stockage objet ou l’infrastructure de production.

## Raisons

- produire rapidement une preuve exécutable sans casser le corpus existant ;
- réutiliser les identifiants et matrices déjà canoniques ;
- tester la chaîne complète avant de figer une architecture lourde ;
- garantir un démarrage reproductible sans dépendance réseau ;
- détecter les lacunes réelles du modèle par l’exécution ;
- préserver le déterminisme et la traçabilité.

## Garanties

- aucune exigence `CIRC005_*` n’est renommée ;
- aucune matrice existante n’est modifiée ;
- aucune clause n’est déclarée `APPROVED` ou `ACTIVE` ;
- `ready_for_submission` reste toujours `false` ;
- les données manquantes apparaissent dans la concordance ;
- le prospectus produit reste un document de pré-conformité ;
- la fiscalité et les interprétations ouvertes imposent une revue humaine ;
- les prospectus existants restent des cas de test et non des sources normatives.

## Conséquences

### Positives

- le dépôt contient désormais un moteur réellement exécutable ;
- les quatre matrices deviennent un catalogue de questions chargé par le code ;
- les réponses alimentent un snapshot canonique ;
- un projet de prospectus, un rapport de contrôle, une concordance et un manifeste peuvent être générés ;
- des tests de déterminisme et de non-régression existent.

### Limites

- le rendu DOCX/PDF n’est pas encore implémenté ;
- la persistance, l’API et l’interface web ne sont pas encore implémentées ;
- 15 exigences restent non couvertes dans le cas d’exemple initial ;
- l’Instruction n°66 n’est pas encore atomisée ;
- les clauses n’ont pas reçu de validation juridique ou conformité.

## Commandes de contrôle

```bash
npm test
npm run generate:sample
npm run check
```

## Réversibilité

La tranche est isolée dans des fichiers nouveaux et ne modifie pas les artefacts réglementaires existants. Elle peut évoluer par versions successives sans réécrire les identifiants canoniques ni l’historique réglementaire.
