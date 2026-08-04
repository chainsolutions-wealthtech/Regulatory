# DATA_FLOW — Flux de données

> **Statut :** `À DÉTERMINER`

## Flux logique cible

Sources réglementaires et référentiels → données canoniques → questionnaire et réponses → contrôles et couverture → clauses et composants → revue → snapshot → documents et audit.

## Données à tracer

Valeur, source, version, date d’effet, statut de vérification, auteur, preuve, consommateur et historique. Les données sensibles doivent être minimisées et protégées.

## État technique

Bases, files de messages, protocoles, hébergement et frontières réseau : `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.`

## Règles

- aucune duplication indépendante entre documents ;
- aucune transformation réglementaire non traçable ;
- contrôle d’accès et audit ;
- traitement des erreurs et reprise ;
- schémas et migrations versionnés.

Un diagramme futur doit correspondre à `docs/ARCHITECTURE.md` et au modèle canonique.
