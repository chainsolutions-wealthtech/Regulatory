# PROJECT_INVARIANTS — Invariants du projet

> **Statut :** `APPLICABLE`

Les invariants suivants ne peuvent être modifiés sans décision structurante et analyse d’impact :

- périmètre V1 UMOA/FCP ;
- textes officiels versionnés comme source normative ;
- modèle canonique comme source primaire des données ;
- prospectus existants limités aux cas d’étude et de test ;
- exigences, champs, questions, clauses, règles et preuves reliés par identifiants stables ;
- génération déterministe et traçabilité des composants ;
- validation humaine obligatoire ;
- aucune donnée ou règle inventée ;
- documents historiques et artefacts réglementaires préservés ;
- aucune création ou modification de branche ;
- documentation intégrée au changement.

## Contrôle

Chaque boucle vérifie explicitement les invariants affectés. Une contradiction bloque l’action et ouvre une question ou une ADR.
