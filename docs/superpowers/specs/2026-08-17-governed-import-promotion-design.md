# Governed Import Promotion — Design

## Status

Approved by continuation instruction on 2026-08-17. This design extends the already validated import staging/review flow without weakening any existing gate.

## Goal

Allow a human to promote one already `CONFIRMED_BY_HUMAN` staged import value into one explicit project questionnaire answer, while preserving RBAC, optimistic concurrency, project versioning, audit provenance, tenant isolation, and `ready_for_submission=false`.

## Non-goals

- No automatic promotion after extraction or review.
- No inference from `proposedCanonicalFieldPath` to a questionnaire `questionId`.
- No bulk promotion in V1.
- No promotion in `local-json` runtime.
- No bypass of the existing `ANSWER_WRITE` authorization path.
- No submission activation.

## Architecture

A dedicated command service owns promotion. It consumes three existing ports instead of merging them:

1. `ImportStagingRepository` reads the staged batch/value and proves that the source value is human-confirmed.
2. `ProjectRepository` performs the canonical `saveAnswer` write using an explicit `questionId` and caller-supplied `expectedVersion`.
3. A promotion audit repository records immutable provenance linking the resulting project version to `importId`, `importValueId`, source evidence SHA-256, selected `questionId`, reviewer identity, promoter identity, and timestamps.

The command requires PostgreSQL + verified OIDC identity. Local JSON returns an explicit unavailable error rather than creating a fake actor.

## Command contract

Input:

```ts
{
  projectId: string;
  importId: string;
  importValueId: string;
  questionId: string;
  expectedVersion: number;
}
```

Server-side preconditions:

- current verified identity belongs to the project tenant;
- actor is authorized for `ANSWER_WRITE`;
- staged batch belongs to the same project and tenant;
- staged value exists and is exactly `CONFIRMED_BY_HUMAN`;
- staged value has never been promoted before;
- `questionId` exists in the project questionnaire/catalog;
- `expectedVersion` equals the current project version;
- source evidence SHA remains the same as the staged batch source digest;
- `canonical_write_allowed` and import-level `ready_for_submission` remain false; promotion is a separate command, not a mutation of those flags.

## Transaction and failure semantics

The PostgreSQL implementation must be atomic: answer write/version creation and promotion audit record either both commit or both roll back. A stale `expectedVersion`, wrong tenant, missing value, non-confirmed value, duplicate promotion, or missing authorization must leave project answers and promotion audit unchanged.

The command is idempotent only by rejection: replaying the same `importValueId` after a successful promotion returns a deterministic duplicate-promotion error and must not create another project version.

## Audit record

A new append-only table stores:

- organization/project IDs;
- resulting project version ID/number;
- import batch/value IDs;
- selected `question_id`;
- source evidence object ID and SHA-256;
- promoted JSON value snapshot;
- human reviewer user ID from staging;
- promoter user ID;
- promoted timestamp.

RLS is tenant-scoped. Updates/deletes are forbidden by trigger/policy.

## API

`POST /api/projects/:projectId/imports/:importId/promote`

Body:

```json
{
  "importValueId": "...",
  "questionId": "Q_...",
  "expectedVersion": 12
}
```

Response returns the updated project/version plus a promotion receipt. It always states `readyForSubmission: false`.

## UI

The existing import review detail page may show a "Promouvoir vers une réponse" action only for a human-confirmed value. The user must explicitly choose a questionnaire target; the UI never guesses from `proposedCanonicalFieldPath`. The server remains authoritative for every precondition.

## Tests

TDD gates must prove:

- RED before command/repository exist;
- successful promotion creates exactly one new project version;
- audit provenance points to the exact source value/SHA and resulting version;
- `ANSWER_WRITE` authorization is required;
- tenant isolation holds;
- stale version is rejected without mutation;
- unreviewed/rejected value is rejected;
- duplicate promotion is rejected;
- explicit `questionId` is mandatory and validated;
- local-json route is unavailable instead of simulating identity;
- `ready_for_submission` remains false.

## Documentation invariant

CI-generated project state must not mark promotion complete unless PostgreSQL and HTTP validation artifacts are `PASS` and all safety checks above are true.
