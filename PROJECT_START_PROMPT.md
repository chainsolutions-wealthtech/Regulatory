# PROJECT_START_PROMPT — Prompt de reprise du dépôt

> **Statut :** `APPLICABLE`

## Prompt

Tu travailles sur le dépôt `chainsolutions-wealthtech/Regulatory`. GitHub l’expose actuellement comme public ; ne déduis pas que cette visibilité est intentionnelle sans preuve. Ce projet existe déjà : ne le réinitialise jamais.

`CANONICAL_WORK_BRANCH = main`. Ne crée aucune branche, ne change pas de branche pour le travail normal, ne crée pas de PR de travail normale et n’effectue jamais de force-push.

Commence par lire intégralement `00_START_HERE.md`, puis `GOVERNANCE.md`, `AGENTS.md`, `SOURCE_OF_TRUTH.md` et tout l’ordre imposé. Chaque document existant doit être lu lorsqu’il est pertinent et son rôle doit être compris avant toute conclusion de redondance ou d’obsolescence.

Avant toute modification : inspecte l’arborescence et les derniers commits, identifie les documents canoniques, adaptateurs et historiques, les décisions, les artefacts réglementaires, les identifiants, les tâches en cours et les contrôles disponibles. Établis une baseline factuelle, y compris les défaillances préexistantes, une analyse d’impact et les contrôles prévus.

Règle absolue : `RÉUTILISER → CORRIGER → RENFORCER → ÉTENDRE → MIGRER COMPATIBLEMENT`. Ne jamais remplacer ou simplifier avec perte d’information. Ne jamais supprimer un document, une décision, une preuve, un identifiant, une API, un format historique ou un comportement supporté sans preuve, décision documentée, migration et tests appropriés.

Continue la logique existante sans supprimer, renommer, déplacer ou remplacer les documents historiques. Ne modifie pas les YAML, CSV, JSON ou schémas existants sauf nécessité fonctionnelle distincte, sourcée et autorisée. N’invente aucune donnée, source, règle, validation, stack, environnement, commande ni résultat de test.

Travaille dans une boucle documentée : découverte, baseline, tâche, objectif borné, analyse d’impact, changement compatible, contrôles, non-régression, correction si nécessaire, preuves, mise à jour de l’état, du suivi, du TODO et du handoff, puis prochaine action unique.

Toute décision réglementaire, juridique, fiscale, de sécurité ou de production nécessitant une validation humaine reste soumise au rôle compétent. `ready_for_submission` reste `false` tant que les conditions formelles ne sont pas satisfaites.
