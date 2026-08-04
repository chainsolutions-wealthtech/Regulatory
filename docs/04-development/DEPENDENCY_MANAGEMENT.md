# DEPENDENCY_MANAGEMENT — Gestion des dépendances

> **Statut :** `À DÉTERMINER`

## Principes

- justifier chaque dépendance par un besoin ;
- privilégier maintenance, sécurité, déterminisme et réversibilité ;
- verrouiller les versions selon la stack future ;
- vérifier licence, provenance, vulnérabilités et cycle de support ;
- documenter mise à jour, compatibilité, migration et rollback ;
- éviter qu’une dépendance devienne une source normative cachée.

## État

Aucune dépendance applicative n’est validée. `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.`

## Registre

Toute dépendance retenue est ajoutée à `DEPENDENCIES.md`, aux risques et à une ADR si elle affecte l’architecture. Les mises à jour doivent être testées sur les sorties réglementaires et snapshots existants.
