# DATA_DICTIONARY — Dictionnaire de données

> **Statut :** `À DÉTERMINER`

Le modèle canonique V0.1 décrit 30 objets mais le dictionnaire champ par champ reste à produire.

## Attributs obligatoires

Identifiant, objet, définition, type, cardinalité, enum, unité, applicabilité, source, validations, sensibilité, temporalité, provenance, consommateurs, correspondances et politique de migration.

## Règles

- identifiants existants préservés ;
- aucune définition réglementaire sans source ;
- aucun champ dupliqué pour un document particulier ;
- historique des changements ;
- revue métier, conformité et technique ;
- synchronisation future avec JSON Schema et schéma SQL.

Le dictionnaire ne doit pas diverger de `schemas/UMOA_FCP_CANONICAL_MODEL_V0_1.yaml` et des matrices existantes.
