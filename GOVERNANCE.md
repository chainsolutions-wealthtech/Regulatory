# GOVERNANCE — Contrat supérieur du dépôt Regulatory

> **Statut :** `APPLICABLE`  
> **Nature :** adaptateur de gouvernance transversal ; il consolide et relie les règles existantes sans les remplacer.  
> **Dépôt :** `chainsolutions-wealthtech/Regulatory`  
> **Branche canonique :** `main`

## 1. Contrat machine-readable

```text
REPOSITORY = chainsolutions-wealthtech/Regulatory
CANONICAL_WORK_BRANCH = main
ONE_PROJECT_ONE_CANONICAL_WORK_BRANCH = TRUE
ACTIVE_WORK_BRANCH_TARGET_COUNT = 1
NEW_BRANCH_CREATION = FORBIDDEN
BRANCH_SWITCH = OWNER_EXPLICIT_ONLY
NORMAL_WORK_PR = NOT_REQUIRED
FORCE_PUSH = FORBIDDEN
HISTORY_REWRITE = FORBIDDEN
IMPROVEMENT_ONLY = REQUIRED
ZERO_REGRESSION = REQUIRED
PERSISTENT_MEMORY = REQUIRED
LOOP_ENGINEERING = REQUIRED
READ_EXISTING_BEFORE_CREATE = REQUIRED
DOCUMENT_ROLE_ANALYSIS = REQUIRED
DELETE_WITHOUT_PROOF = FORBIDDEN
SIMPLIFY_WITH_INFORMATION_LOSS = FORBIDDEN
VERIFY_BEFORE_WRITE = REQUIRED
VERIFY_AFTER_WRITE = REQUIRED
READY_FOR_SUBMISSION_DEFAULT = FALSE
```

## 2. Autorité et coexistence documentaire

Ce fichier ne crée pas une politique concurrente. Il fournit un point d'entrée stable vers les règles déjà présentes :

- entrée obligatoire : `00_START_HERE.md` ;
- règles universelles des agents : `AGENTS.md` ;
- hiérarchie des sources de vérité : `SOURCE_OF_TRUTH.md` ;
- règles détaillées du projet : `docs/01-governance/PROJECT_RULES.md` ;
- politique documentaire : `docs/01-governance/DOCUMENTATION_POLICY.md` ;
- méthode de boucle : `LOOP_ENGINEERING.md` et `LOOP_CONTRACT.md` ;
- état courant : `STATUS.md` ;
- historique : `SUIVI.md` ;
- travail restant : `TODO.md` ;
- prochaine action : `NEXT_ACTION.md` ;
- décisions : `docs/DECISIONS.md` et `docs/adr/`.

En cas de contradiction, appliquer `SOURCE_OF_TRUTH.md`, la décision durable la plus récente et la règle la plus restrictive ; ne jamais trancher silencieusement une contradiction structurante.

## 3. Branche canonique unique

Pour ce dépôt, l'état Git vérifié au 2026-08-13 montre une seule branche de travail : `main`. Elle est donc la `CANONICAL_WORK_BRANCH`.

Tout agent, assistant, automatisation ou outil doit :

1. rester sur `main` pour le travail normal ;
2. ne créer aucune branche temporaire, cachée, `feature/*`, `fix/*`, `hotfix/*`, `claude/*`, `codex/*`, `chatgpt/*`, `agent/*` ou équivalente ;
3. ne pas créer de Pull Request pour le travail normal ;
4. ne jamais forcer un push ni réécrire l'historique ;
5. vérifier le HEAD avant et après toute écriture.

Une instruction explicite ultérieure du propriétaire peut désigner une autre branche existante dans un autre projet, mais cette règle ne doit jamais être interprétée comme une autorisation de créer une nouvelle branche dans `Regulatory`.

## 4. Principe absolu : amélioration sans régression

Une modification valide doit améliorer, corriger, renforcer, compléter, sécuriser, documenter ou rendre plus vérifiable l'existant.

Il est interdit de :

- recommencer le projet selon une nouvelle préférence d'architecture ;
- remplacer un composant fonctionnel sans analyse d'impact et migration ;
- casser une API, un identifiant, un schéma, un artefact, un format historique ou un document généré déjà supporté ;
- supprimer une règle, une preuve, une décision ou un document parce qu'il paraît redondant ;
- simplifier au prix de la traçabilité ;
- supprimer un test pour faire passer une modification ;
- déclarer une validation qui n'a pas été exécutée.

Lorsqu'un format ou composant doit évoluer, utiliser une migration compatible, un adaptateur ou une nouvelle version et tester la compatibilité descendante.

## 5. Tous les documents existants doivent être exploités

Le nombre de fichiers Markdown n'est jamais un motif de suppression ou de réduction.

Avant de créer, modifier, fusionner, déplacer, déprécier ou proposer la suppression d'un document, l'agent doit :

1. le lire ;
2. identifier son rôle ;
3. identifier son autorité ;
4. identifier les informations uniques qu'il porte ;
5. identifier ses consommateurs ou références ;
6. vérifier son historique Git ;
7. comparer son contenu aux documents proches ;
8. préserver toutes les informations utiles.

Les rôles admis incluent notamment : `CANONICAL`, `ADAPTER`, `OPERATIONAL`, `HISTORICAL`, `DECISION`, `EVIDENCE`, `ITERATION_STATE`, `HANDOFF`, `REFERENCE`, `MACHINE_GENERATED` et `SUPERSEDED_WITH_TRACEABILITY`.

Un recouvrement de sujet n'est pas une preuve de duplication. `SUIVI.md`, `STATUS.md`, `WORK_LOG.md`, `HANDOFF.md`, `CURRENT_ITERATION.md` et `NEXT_ACTION.md` ont par exemple des fonctions distinctes et complémentaires.

## 6. Loop Engineering obligatoire

Toute intervention suit au minimum :

```text
DISCOVER
→ BASELINE
→ SELECT
→ IMPACT_ANALYSIS
→ IMPLEMENT_COMPATIBLY
→ VERIFY
→ REGRESSION_CHECK
→ CORRECT_IF_REQUIRED
→ VERIFY_AGAIN
→ PERSIST_STATE
→ COMMIT
→ VERIFY_REMOTE_STATE
→ SELECT_NEXT
```

La boucle continue automatiquement pour les actions sûres, déterminées, réversibles et vérifiables. Elle s'arrête sur une vraie décision humaine, une opération irréversible non autorisée, une source normative manquante, un blocage externe ou l'absence de nouvelle hypothèse vérifiable.

## 7. Intégrité réglementaire

- une IA n'est jamais une source normative ;
- les textes réglementaires officiels, versionnés et vérifiables restent la source normative ;
- un prospectus existant est un cas d'étude/test, pas une norme ;
- une correspondance candidate n'est pas une résolution juridique ;
- une matérialisation binaire n'est pas une activation ;
- aucune exigence, clause, sanction, seuil ou interprétation n'est activée automatiquement sans les validations prévues ;
- les revues juridique, conformité et fiscale humaines restent obligatoires lorsqu'elles sont requises ;
- `ready_for_submission` reste `false` tant que les conditions formelles ne sont pas satisfaites.

## 8. Mémoire persistante et vérité de l'état

Le dépôt et ses artefacts versionnés sont la mémoire du projet. Une conversation ne remplace jamais cette mémoire.

Après tout changement significatif, mettre à jour les documents appropriés dans le même chantier. Ne jamais laisser volontairement le code et l'état documentaire diverger.

Les états techniques doivent distinguer au minimum lorsque pertinent :

`SPECIFIED` → `IMPLEMENTED` → `TESTED` → `CONFIGURED` → `ACTIVATED` → `DEPLOYED` → `PRODUCTION_VERIFIED`.

Aucune étape ultérieure ne doit être déduite d'une étape antérieure sans preuve.

## 9. Definition of Done minimale

Une itération n'est terminée que si :

- le HEAD et la branche ont été vérifiés ;
- l'existant pertinent a été lu et réutilisé ;
- l'impact et les risques de régression ont été analysés ;
- les contrôles disponibles ont été exécutés ;
- toute régression introduite a été corrigée ;
- les régressions préexistantes sont explicitement distinguées ;
- les preuves et limitations sont enregistrées ;
- la mémoire persistante est synchronisée ;
- une prochaine action unique est définie lorsque le chantier continue ;
- aucune information, source, validation ou succès n'a été inventé.

## 10. Historique d'adoption

Cette consolidation est décidée le 2026-08-13 et détaillée dans `docs/adr/ADR-0009-canonical-work-branch-and-improvement-only-governance.md`. Elle enrichit sans annuler les décisions et règles précédentes, notamment le Loop Engineering, la non-régression et la coexistence documentaire.
