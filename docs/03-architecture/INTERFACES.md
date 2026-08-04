# INTERFACES — Interfaces entre composants

> **Statut :** `APPLICABLE`

Les interfaces logiques relient questionnaire, modèle canonique, connaissance juridique, règles, preuves, workflow et génération. Elles doivent échanger des objets versionnés, identifiants stables, résultats de validation et provenance.

## Exigences

- contrats explicites et versionnés ;
- erreurs et statuts définis ;
- idempotence lorsque nécessaire ;
- aucune duplication de source de vérité ;
- contrôle d’accès et journalisation ;
- compatibilité et migration ;
- tests de contrat et non-régression.

## État technique

Protocoles, API, messages et formats d’exécution sont `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.` Les exemples futurs doivent rester non exécutables tant que la stack n’est pas validée.

## Modèle

Producteur, consommateur, contrat, version, données, erreurs, sécurité, audit, SLA éventuel et tests.
