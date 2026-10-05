# ADR-0011 — ChatGPT subscription session-driven coding

Status: ACCEPTED
Date: 2026-10-05
Supersedes: ADR-0010 only for the code-execution/model-invocation mechanism.

## Context

The owner prioritizes use of the existing ChatGPT subscription and the connected GitHub surface instead of separately billed OpenAI API model calls.

The repository already has durable continuity primitives: explicit task queue, state, checkpoint, writer lease, watchdog and four CI gates.

## Decision

GitHub Actions remains the 24/7 supervisor but does not execute a coding model and does not mutate product code.

All product-code reasoning and edits are performed inside a ChatGPT session using the connected GitHub surface.

No `OPENAI_API_KEY` is required by the runtime. `openai/codex-action` is not used.

## State machine

For code work:

`IDLE -> DISCOVER -> SESSION_REQUIRED -> CHATGPT_CLAIM_LEASE -> CHATGPT_IMPLEMENT -> CHATGPT_COMMIT_AWAITING_CI -> RELEASE -> CI -> RECONCILE`

For repair:

`AWAITING_CI -> SESSION_REPAIR_REQUIRED -> CHATGPT_CLAIM_LEASE -> CHATGPT_REPAIR -> COMMIT_AWAITING_CI -> RELEASE -> CI`

For successful CI, GitHub Actions may perform only state/checkpoint reconciliation.

## Authority separation

ChatGPT:
- reasoning;
- repository analysis;
- bounded code changes;
- GitHub writes through the connected surface;
- repair hypotheses.

GitHub Actions:
- scheduled/event observation;
- CI;
- state-only reconciliation;
- watchdog/stall detection;
- durable artifacts.

GitHub issue #2:
- single logical writer lease.

## Cost boundary

The repository runtime itself performs no paid OpenAI API model invocation.

Usage occurs on the ChatGPT product surface under the user's ChatGPT subscription/usage limits, not through the repository's OpenAI API billing path.

## Continuity

A ChatGPT session may terminate at any time. The next session reconstructs exact state from main, checkpoint, queue, runtime state, CI and the writer lease.

This preserves continuity without maintaining a long-running model session.

## Safety

All prior regulatory and repository invariants remain unchanged, including:
- main only;
- no new branch;
- no force push/history rewrite;
- no autonomous legal/compliance approval;
- no autonomous regulatory activation;
- no submission enablement;
- `ready_for_submission=false`.
