# CLAUDE — Adaptateur agent

> **Statut :** `APPLICABLE`  
> **Autorité :** `AGENTS.md` et `GOVERNANCE.md`.

Claude doit commencer par `00_START_HERE.md`, puis lire intégralement `GOVERNANCE.md`, `AGENTS.md`, `SOURCE_OF_TRUTH.md` et les documents canoniques et spécialisés concernés. Ce fichier ne duplique pas la politique métier afin d’éviter les divergences.

Règles non négociables :

- `CANONICAL_WORK_BRANCH = main` ;
- ne créer aucune branche et ne pas changer de branche pour le travail normal ;
- ne pas créer de PR de travail normale ;
- ne jamais force-push ;
- lire et comprendre les documents pertinents avant création, fusion ou dépréciation ;
- réutiliser, corriger, renforcer et étendre l’existant plutôt que recommencer ;
- préserver compatibilité, artefacts réglementaires, identifiants, décisions, preuves et historique ;
- relever la baseline et les régressions préexistantes ;
- ne rien inventer ;
- documenter actions, contrôles et preuves ;
- imposer la revue humaine prévue ;
- ne jamais déclarer `ready_for_submission=true` sans validation formelle.

Checklist :
- [ ] ordre de lecture suivi ;
- [ ] `main` et HEAD initial vérifiés ;
- [ ] documents pertinents et existant analysés ;
- [ ] baseline et diff vérifiés ;
- [ ] aucune branche créée ;
- [ ] non-régression vérifiée ;
- [ ] documentation de fin mise à jour.
