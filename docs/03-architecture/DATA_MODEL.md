# DATA_MODEL — Cadre du modèle de données

> **Statut :** `À DÉTERMINER`

Le modèle canonique architectural V0.1 existe dans `schemas/UMOA_FCP_CANONICAL_MODEL_V0_1.yaml` avec 30 objets. Ce document ne le remplace pas et ne modifie aucun identifiant.

## Travail restant

Pour chaque champ : identifiant stable, définition, type, cardinalité, enum, unité, applicabilité, validations, sensibilité, temporalité, provenance, consommateurs, migration et correspondances Openfunds éventuelles.

## Principes

- une donnée, une source principale, plusieurs vues ;
- organisation commune pour les acteurs avec rôles spécialisés ;
- historique `valid_from`, `valid_to`, `recorded_at`, `verified_at` ;
- versionnement, compatibilité et audit ;
- aucun schéma SQL ou choix de base inventé.

## Validation

Toute évolution exige impact sur exigences, matrices, questions, clauses, règles, documents, imports et exports, plus tests de migration et non-régression.
