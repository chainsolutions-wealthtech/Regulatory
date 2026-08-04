# DRIFT_DETECTION — Détection de dérive

> **Statut :** `APPLICABLE`

## Dérives surveillées

- document adaptateur devenu concurrent du canonique ;
- manifeste ou catalogue différent de l’arborescence ;
- mapping Markdown différent des YAML/CSV/JSON ;
- identifiant renommé ou dupliqué ;
- clause ou source modifiée sans nouvelle version ;
- statut en décalage avec l’état réel ;
- module conditionnel utilisé comme procédure active ;
- branche ou historique non conforme aux règles.

## Contrôles

Inventaire de fichiers, empreintes, liens, nombres d’exigences, tests de résolution, comparaison des versions et revue des documents d’état.

## Traitement

Enregistrer la dérive, évaluer l’impact, arrêter les actions risquées, corriger par changement additif, relancer les contrôles et documenter la cause. Aucune divergence ne doit être normalisée silencieusement.
