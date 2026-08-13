# PROJECT_RULES — Règles maîtresses du projet

> **Statut :** `APPLICABLE`

## Contrat du projet

```text
CANONICAL_WORK_BRANCH = main
NEW_BRANCH_CREATION = FORBIDDEN
NORMAL_WORK_PR = NOT_REQUIRED
FORCE_PUSH = FORBIDDEN
IMPROVEMENT_ONLY = REQUIRED
ZERO_REGRESSION = REQUIRED
READ_EXISTING_BEFORE_CREATE = REQUIRED
PRESERVE_INFORMATION = REQUIRED
```

1. Lire `00_START_HERE.md`, `GOVERNANCE.md` et `AGENTS.md` avant toute action.
2. Travailler sur `main`; ne créer ni changer de branche pour le travail normal.
3. Préserver documents historiques, décisions, identifiants, contrats d’API, formats historiques et artefacts réglementaires.
4. Lire et classifier tout document pertinent avant création, fusion, déplacement, dépréciation ou suppression ; un recouvrement de sujet n’est pas une preuve de redondance.
5. Toujours préférer `réutiliser → corriger → renforcer → étendre → migrer compatiblement` à une réécriture.
6. Ne rien inventer : utiliser la mention officielle d’information non définie et ouvrir une question.
7. Une règle réglementaire exige une source officielle versionnée.
8. Une modification significative exige baseline, impact, contrôles, preuves, test de non-régression, documentation et rollback ou stratégie de compatibilité lorsque nécessaire.
9. Une défaillance préexistante doit être identifiée avant modification et ne doit jamais être reclassée silencieusement comme succès.
10. Les conversations ne sont pas la mémoire canonique.
11. Les validations juridiques, conformité, fiscales, sécurité et production restent humaines lorsqu’elles sont requises.
12. Aucun secret, déploiement, fusion ou modification de production dans une mission documentaire.
13. Une boucle se termine par un état explicite, un handoff et une prochaine action unique lorsque le chantier continue.
14. Le code et la documentation doivent représenter le même état courant ; l’historique, lui, est conservé au lieu d’être réécrit.
15. `ready_for_submission` reste `false` sauf transition formellement autorisée et vérifiée.

Toute exception est enregistrée dans `EXCEPTION_REGISTER.md` et approuvée par un rôle autorisé à définir.
