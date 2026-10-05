# Regulatory Continuous Agent Runtime — V2

Status: **SESSION_DRIVEN_ACTIVE**

## Decision

Product code is written by ChatGPT under the user's existing ChatGPT subscription and persisted through the connected GitHub surface.

No OpenAI API key is required. The workflow does not invoke Codex Action or any paid OpenAI API.

## What remains 24/7

GitHub Actions remains the permanent supervisor. Every 15 minutes and after required CI workflows, it reconstructs:

- canonical main HEAD;
- checkpoint;
- explicit safe task queue;
- runtime state;
- writer lease;
- CI gates;
- repeated failures and stalls.

For a safe code task, the supervisor emits:

`SESSION_REQUIRED`

For a failed active task that can be repaired:

`SESSION_REPAIR_REQUIRED`

It never starts a coding model by itself.

## Coding surface

The coding loop is:

1. ChatGPT session reads repository authorities and live HEAD.
2. ChatGPT reads the current plan, task queue, state and checkpoint.
3. ChatGPT claims GitHub issue #2 as the single writer lease.
4. ChatGPT analyzes and edits through the connected GitHub surface.
5. Before commit, ChatGPT re-checks main against the leased base HEAD.
6. The code commit also records the active task as `AWAITING_CI`.
7. ChatGPT releases the lease with the exact commit head and `PATCH_COMMITTED_AWAITING_CI`.
8. GitHub CI runs independently.
9. If all four required gates pass, GitHub Actions may perform state-only reconciliation.
10. If a gate fails, the supervisor emits `SESSION_REPAIR_REQUIRED`; a later ChatGPT session repairs it.

## No API billing path

The following are disabled by contract:

- `OPENAI_API_KEY` dependency;
- `openai/codex-action`;
- model invocation inside GitHub Actions;
- unattended product-code mutation by GitHub Actions.

This architecture uses the ChatGPT product surface for reasoning/coding and GitHub only for repository state, writes, CI and durable continuity.

## Safe backlog

The queue remains explicit under `ops/agent-runtime/TASK_QUEUE.json`.

Current next code slice: `TASK-F5-REVIEW-CENTER-BASELINE`.

The runtime does not invent a new roadmap when the queue is empty.

## Hard stops

No ChatGPT session or workflow may:

- create a branch;
- force push or rewrite history;
- enable `ready_for_submission`;
- grant `CLAUSE_ACTIVATE`;
- simulate Legal/Compliance approval;
- activate regulatory rules or sanctions;
- modify normative sources without governed review;
- deploy production infrastructure without explicit authorization.

The repository remains the durable memory. A conversation may disappear without losing the checkpoint, queue, lease or CI state.
