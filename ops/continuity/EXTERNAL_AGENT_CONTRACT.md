# EXTERNAL_AGENT_CONTRACT — worker continu

Ce contrat permet de raccorder un agent hors session ChatGPT sans modifier l'architecture métier.

## Entrée

Le worker reçoit repository, branche main, HEAD réel, autorités, checkpoint, NEXT_ACTION et résultats CI récents.

## Lease

Avant toute écriture, le worker doit obtenir un lease logique unique. Deux workers ne doivent jamais écrire simultanément sur main.

Un lease contient au minimum worker_id, task_id, base_head, acquired_at, expires_at et heartbeat_at.

Un lease expiré peut être repris seulement après vérification du HEAD et des CI.

## Cycle

1. lire ;
2. comparer checkpoint et HEAD ;
3. sélectionner une mini-tâche ;
4. implémenter ;
5. commit atomique ;
6. attendre/observer les gates ;
7. corriger avec une hypothèse différente si nécessaire ;
8. persister état et checkpoint ;
9. relâcher le lease ;
10. prendre la mini-tâche suivante.

## Arrêt obligatoire

Le worker s'arrête sur décision propriétaire, source normative manquante, revue humaine requise, credential manquant, opération irréversible non autorisée, régression non comprise ou absence d'hypothèse nouvelle.

## Fournisseur

Le protocole est indépendant du fournisseur. Un runner GitHub, un service sur VPS ou un orchestrateur externe peut l'implémenter. Les credentials restent hors dépôt.

## Runtime exécutable V1 — 2026-10-05

Le contrat est désormais appliqué par .github/workflows/continuous-agent-runtime.yml et scripts/continuous-agent-runtime.mjs.

Le job modèle est isolé du credential GitHub d'écriture. Il produit uniquement un patch soumis aux guardrails. Un job séparé revalide le HEAD, le diff et le typecheck avant commit.

La queue autonome est explicite sous ops/agent-runtime/TASK_QUEUE.json. Aucun agent n'est autorisé à inventer sa propre prochaine tâche quand cette queue est vide.

Le moteur relance explicitement les quatre gates après chaque commit autonome et ne passe à la tâche suivante qu'après réconciliation PASS.



## Runtime V2 — ChatGPT subscription / GitHub connector — 2026-10-05

ADR-0011 supersedes the V1 model-execution mechanism while preserving the lease, queue, checkpoint, CI and watchdog contract.

Code tasks are no longer executed by Codex/OpenAI API in GitHub Actions.

When the supervisor emits `SESSION_REQUIRED` or `SESSION_REPAIR_REQUIRED`, a ChatGPT subscription session must:
1. re-read the mandatory repository authorities;
2. observe the real current HEAD;
3. claim issue #2 against that HEAD;
4. implement only the queued bounded task through the connected GitHub surface;
5. re-check HEAD before the atomic write;
6. persist `STATE.activeTask.status = AWAITING_CI` with task id, attempt and committed head;
7. release the lease as `PATCH_COMMITTED_AWAITING_CI`.

GitHub Actions remains authorized for observation and state-only reconciliation after CI, but not unattended product-code mutation.

No repository OpenAI API credential is required.
