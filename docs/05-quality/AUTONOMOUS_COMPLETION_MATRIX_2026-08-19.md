# Matrice de clôture autonome — 2026-08-19

Cette matrice distingue strictement ce que le dépôt peut terminer de façon autonome de ce qui exige une source officielle, une infrastructure cible ou une décision humaine. Elle ne remplace ni `SOURCE_OF_TRUTH.md`, ni `NEXT_ACTION.md`, ni les validations formelles.

## 1. Capacités logicielles construites

| Domaine | État | Preuve principale | Limite maintenue |
| --- | --- | --- | --- |
| Modèle canonique V1 | Implémenté | JSON Schema + PostgreSQL + dictionnaire | `ready_for_submission=false` |
| Repository projet PostgreSQL | Implémenté/testé | `POSTGRESQL_REPOSITORY_VALIDATION.json` | RLS + concurrence optimiste |
| RBAC / séparation des tâches | Implémenté/testé | tests authorization workflow | aucune élévation implicite |
| Historique / diff projet | Implémenté/testé | API + workspace versions | lecture seule de l’historique |
| Bibliothèque réglementaire globale | Implémentée | catalogue généré | catalogue global non activable par tenant |
| Propositions de clauses tenant | Implémentées/testées | PostgreSQL + API + workspace | APPROVED n’implique jamais ACTIVE |
| Upload documentaire | Implémenté | API evidence | entrée `QUARANTINED/PENDING` uniquement |
| Scan documentaire | Contrat serveur implémenté | trusted scanner service | aucun verdict navigateur accepté |
| Libération documentaire | Implémentée/testée | `EVIDENCE_VERIFY` + recovery | CLEAN scan requis, retry idempotent |
| Store evidence PostgreSQL tracked | Implémenté/testé | `POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION.json` | filesystem autorisé seulement hors production |
| Extraction PDF/DOCX | Implémentée/testée | binary extractor + provenance | propositions `EXTRACTED_UNVERIFIED` uniquement |
| Staging import | Implémenté/testé | `POSTGRESQL_IMPORT_STAGING_VALIDATION.json` | aucune écriture canonique automatique |
| Revue humaine import | Implémentée/testée | staging review | décision humaine obligatoire |
| Promotion explicite | Implémentée/testée | `POSTGRESQL_IMPORT_PROMOTION_VALIDATION.json` | `ANSWER_WRITE` + `expectedVersion` + cible explicite |
| UI preuves | Implémentée | workspace projet | aucun bouton « marquer CLEAN » |
| Health/readiness | Implémenté/testé | `WEB_RUNTIME_HEALTH_API_VALIDATION.json` | readiness fail-closed |
| Headers sécurité web | Implémentés/testés | `WEB_SECURITY_HEADERS_VALIDATION.json` | CSP nonce/SRI reste un durcissement production |
| Smoke performance | Implémenté | `WEB_PERFORMANCE_SMOKE_VALIDATION.json` | ne constitue pas un test de charge |
| Browser E2E/accessibilité | Workflow ajouté | Browser Accessibility CI | revue WCAG manuelle reste requise |
| Restore PostgreSQL CI | Drill ajouté | `POSTGRESQL_RESTORE_DRILL_VALIDATION.json` | ne remplace pas un restore sur infra cible |

## 2. Invariants non négociables encore actifs

- `main` reste la branche canonique de travail.
- aucun force-push n’est requis ni autorisé par cette progression ;
- GitHub reste la source de vérité ;
- `ready_for_submission` reste verrouillé à `false` ;
- aucune extraction ne devient canonique automatiquement ;
- aucune proposition de clause tenant ne devient une clause globale ACTIVE ;
- aucun verdict antivirus fourni par le navigateur n’est accepté ;
- aucun filesystem de développement n’est considéré production-ready ;
- aucune absence de source réglementaire n’est comblée par invention ou réactivation historique.

## 3. Bloqueurs infrastructure — non clôturables par le code seul

Les éléments suivants exigent un environnement cible réel et ne doivent jamais être marqués `PASS` sur la seule base de la CI :

1. PostgreSQL de production et paramètres HA/backup/rétention réels ;
2. fournisseur OIDC réel, issuer/audience/JWKS et rôles réels ;
3. object storage privé de production ;
4. KMS / secrets / rotation de clés ;
5. antivirus ou service de scanning réellement provisionné ;
6. monitoring, alerting et journalisation centralisée de production ;
7. test restore réel avec RTO/RPO approuvés ;
8. déploiement cible et acceptation d’exploitation.

## 4. Bloqueurs réglementaires / humains — non automatisables

- binaire officiel/institutionnel de la Décision `CM/10/06/2022` encore requis ;
- binaire/route officielle de `DECISION_CREPMF_2012_119` encore requis ;
- atomisation/revue des exigences Instruction 66 encore soumise aux sources et validations ;
- revues Legal / Compliance / Tax / Risk / Product à enregistrer selon les règles du projet ;
- revue manuelle d’accessibilité et tests utilisateurs inclusifs ;
- validation formelle avant tout usage production ou soumission.

## 5. Critère de « totalement fini »

Le dépôt ne doit être déclaré totalement fini que lorsque **les quatre conditions** suivantes sont simultanément vraies :

1. toutes les capacités logicielles autonomes nécessaires sont implémentées et leurs CI sont vertes ;
2. toutes les sources officielles bloquantes ont été obtenues, vérifiées et reliées aux exigences ;
3. toutes les validations humaines obligatoires sont effectivement enregistrées ;
4. l’infrastructure cible a été provisionnée, testée et acceptée, notamment sécurité, backup/restore, observabilité et identité.

Jusqu’à cette convergence, la position sûre demeure : **application fonctionnellement avancée, soumission désactivée, production non attestée**.
