# Regulatory Continuous Agent Runtime

Status: repository-native runtime installed. Coding is armed only when the OpenAI credential is present.

## What runs 24/7

The GitHub workflow .github/workflows/continuous-agent-runtime.yml runs every 15 minutes and after each of the four validation workflows completes.

The supervisor never keeps a model session alive indefinitely. It reconstructs state from Git, the checkpoint, the task queue, CI and the writer lease. It invokes Codex only when a bounded task is ready.

## Security split

The Codex job receives the OpenAI API key through the official Codex GitHub Action proxy and checks out the repository with persist-credentials=false.

Codex never receives the GitHub write token.

A later apply job, which has no OpenAI key, re-checks main, applies the generated patch, re-runs the policy gate and typecheck, commits, pushes, then explicitly dispatches all four CI gates.

## Required OpenAI credential

Create repository secret OPENAI_API_KEY from a dedicated OpenAI Platform project/key. The key must have the API permissions required for Codex/Responses usage.

Until the secret exists, the runtime remains active in observation/reconciliation mode and will not run a coding model.

## GitHub identity

V1 uses the repository-scoped, short-lived GitHub Actions GITHUB_TOKEN and commits as regulatory-continuous-agent[bot]. This avoids a long-lived PAT.

A dedicated GitHub App can replace the token later without changing the runtime contract. Do not add a personal PAT.

## Continuous loop

plan -> lease -> isolated Codex patch -> gate -> separate apply job -> commit -> explicit CI dispatch -> reconcile checkpoint -> release lease -> next task.

Repeated failures, attempt limits, daily model/commit budgets, changed-file/line budgets and forbidden paths/content stop the loop automatically.

## Safe queue

The queue is explicit at ops/agent-runtime/TASK_QUEUE.json. The runtime does not invent its own roadmap and does not auto-discover new tasks.

Current safe backlog is F4 reconciliation followed by F5 Review Center, F6 Document Studio, F7 Reference Data Explorer and F8 Operations/Security readiness.

## Hard stops

No autonomous runtime may:
- create a branch;
- force push or rewrite history;
- modify the runtime policy or queue;
- modify normative regulatory sources/requirements/registries;
- change RBAC/workflow policies or database migrations;
- enable ready_for_submission;
- grant CLAUSE_ACTIVATE;
- simulate human Legal/Compliance approval;
- activate regulatory rules or sanctions;
- deploy production infrastructure.

When the safe queue is exhausted, the engine becomes IDLE_SAFE_QUEUE_EMPTY rather than inventing more work.
