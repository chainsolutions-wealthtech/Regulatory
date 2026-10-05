# ADR-0010 — Continuous coding runtime, lease and stall detection

Status: ACCEPTED
Date: 2026-10-05

## Decision

Regulatory uses a repository-native continuous coding runtime driven by GitHub Actions. It executes outside ChatGPT sessions and reconstructs state from versioned repository memory.

The runtime is event-driven and scheduled. It launches an ephemeral Codex worker only for an explicitly queued safe task.

## Separation of authority

The model job has an OpenAI credential but no GitHub write credential.

The apply job has a GitHub write credential but no OpenAI credential.

The model therefore cannot directly push, alter issues, change repository settings or rewrite history.

## Writer lease

GitHub issue #2 is the single logical writer lease. Every autonomous write must claim it against the exact current HEAD. A stale patch is rejected if main changes before application.

## State machine

WAIT -> CLAIM -> CODE or REPAIR -> GATE -> APPLY -> AWAITING_CI -> RECONCILE -> RELEASE -> NEXT.

A STATE_ONLY task can perform RECONCILE without invoking a model.

## Loop detection

The runtime stops when:
- the same task reaches the maximum attempt count;
- consecutive runtime failures cross the configured threshold;
- the writer lease cannot be safely reclaimed;
- CI failures belong to a baseline not owned by an active task;
- daily model or commit budgets are exhausted;
- a diff escapes the allowed task paths;
- a forbidden regulatory/security mutation is detected;
- the explicit safe queue is empty.

## CI contract

Every autonomous code commit explicitly dispatches Regulatory CI, Runtime Quality CI, Security and Review Policy CI and Browser and Accessibility CI. The next task cannot begin until all four gates are PASS.

## Regulatory boundaries

The autonomous runtime is not authorized to make normative decisions, activate regulatory requirements, grant legal/compliance approvals, enable submission, alter sanctions, or assert production readiness.

ready_for_submission remains false.

## Consequence

Loss of a ChatGPT session, model context, runner or individual Codex execution no longer loses project continuity. The next runtime cycle recovers from Git, checkpoint, CI, state and lease.
