# Governed Import Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote one human-confirmed staged import value into one explicit questionnaire answer with atomic PostgreSQL versioning and immutable provenance.

**Architecture:** Add a narrow promotion command boundary rather than expanding the staging repository into canonical writes. PostgreSQL owns the atomic transaction and audit receipt; runtime/API/UI consume that command and remain unavailable in local-json for sensitive writes.

**Tech Stack:** Next.js App Router, TypeScript, PostgreSQL 17, `pg`, existing OIDC/RBAC/project repository/import staging patterns, GitHub Actions.

## Global Constraints

- Work only on canonical `main`.
- No automatic import promotion.
- Never infer `questionId` from `proposedCanonicalFieldPath`.
- Require verified OIDC identity and `ANSWER_WRITE`.
- Require explicit `expectedVersion` and preserve optimistic concurrency.
- Preserve tenant RLS and immutable provenance.
- Preserve `ready_for_submission=false` everywhere.
- No production credentials or infrastructure fabrication.

---

### Task 1: RED contract for atomic promotion

**Files:**
- Create: `apps/web/src/server/import/postgres-import-promotion-repository.integration.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Consumes: existing PostgreSQL seed/import staging created by import repository integration tests.
- Produces: failing contract for `createPostgresImportPromotionRepository()` and `promoteConfirmedValue()`.

- [ ] **Step 1:** Add integration test importing the not-yet-existing promotion repository and specifying success, stale-version, tenant, review-state, duplicate-promotion and `readyForSubmission=false` assertions.
- [ ] **Step 2:** Wire it after staging tests in `test:postgres-repository`.
- [ ] **Step 3:** Push RED and verify CI fails specifically on the missing promotion module, not an unrelated regression.

### Task 2: PostgreSQL promotion schema and atomic repository

**Files:**
- Create: `database/migrations/0007_import_promotion_audit.sql`
- Create: `apps/web/src/server/import/import-promotion-repository.ts`
- Create: `apps/web/src/server/import/postgres-import-promotion-repository.ts`
- Modify: `apps/web/src/server/import/postgres-import-promotion-repository.integration.ts`

**Interfaces:**
- Produces:
```ts
export type ImportPromotionReceipt = {
  promotionId: string;
  projectId: string;
  projectVersion: number;
  importId: string;
  importValueId: string;
  questionId: string;
  sourceSha256: string;
  reviewedByUserId: string;
  promotedByUserId: string;
  promotedAt: string;
  readyForSubmission: false;
};

export interface ImportPromotionRepository {
  promoteConfirmedValue(input: {
    projectId: string;
    importId: string;
    importValueId: string;
    questionId: string;
    expectedVersion: number;
  }): Promise<ImportPromotionReceipt>;
}
```

- [ ] **Step 1:** Add append-only `import_value_promotions` table with organization/project/version/import/value/question/source SHA/value snapshot/reviewer/promoter/timestamp fields.
- [ ] **Step 2:** Add unique constraint on `import_value_id`, tenant RLS, and update/delete rejection.
- [ ] **Step 3:** Implement transaction: resolve identity, assert `ANSWER_WRITE`, lock/validate project and import value, validate question, create canonical answer/new version using existing project write logic or extracted shared transaction helper, insert promotion receipt, commit.
- [ ] **Step 4:** Ensure every failure rolls back both answer and audit insert.
- [ ] **Step 5:** Run PostgreSQL integration suite to GREEN and materialize `POSTGRESQL_IMPORT_PROMOTION_VALIDATION.json`.

### Task 3: Runtime factory and HTTP gate

**Files:**
- Create: `apps/web/src/server/import/unavailable-import-promotion-repository.ts`
- Modify: `apps/web/src/server/import/index.ts`
- Create: `apps/web/src/app/api/projects/[projectId]/imports/[importId]/promote/route.ts`
- Create/Modify: `scripts/test-web-import-staging-api.mjs`

**Interfaces:**
- Runtime factory returns PostgreSQL implementation only for `REGULATORY_STORAGE_DRIVER=postgresql`; otherwise unavailable adapter throws `IMPORT_PROMOTION_REPOSITORY_UNAVAILABLE`.
- POST body requires `importValueId`, `questionId`, `expectedVersion`.

- [ ] **Step 1:** Add unavailable adapter and runtime factory.
- [ ] **Step 2:** Add POST route with strict payload validation and deterministic error mapping.
- [ ] **Step 3:** Extend HTTP test proving local-json returns 503 and never creates fake identity.
- [ ] **Step 4:** Materialize `WEB_IMPORT_PROMOTION_RUNTIME_GATE_VALIDATION.json` and keep `readyForSubmission=false`.

### Task 4: Human UI for explicit target selection

**Files:**
- Modify: `apps/web/src/components/organisms/ImportReviewWorkspacePanel.tsx` (or current import review panel path resolved from repository)
- Modify supporting API/query code only if required to expose questionnaire target IDs read-only.

**Interfaces:**
- UI receives confirmed staged values and available question IDs/labels.
- UI sends explicit `questionId` + `expectedVersion`; it never derives target from source metadata.

- [ ] **Step 1:** Show promotion controls only for `CONFIRMED_BY_HUMAN` and not-yet-promoted values.
- [ ] **Step 2:** Require explicit select of questionnaire target.
- [ ] **Step 3:** Submit to promotion API and refresh project/import state after success.
- [ ] **Step 4:** Keep local demo informative/read-only when PostgreSQL/OIDC are absent.
- [ ] **Step 5:** Run typecheck/build/HTTP gates.

### Task 5: CI evidence and documentation closure

**Files:**
- Modify: `scripts/update-postgres-repository-docs.mjs`
- Modify: `.github/workflows/ci.yml`
- Generated updates: `STATUS.md`, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `WORK_LOG.md`, `SUIVI.md`, `TODO.md`, `CHANGELOG.md`, `HANDOFF.md`, `docs/ARCHITECTURE.md`, `apps/web/README.md`

**Interfaces:**
- Documentation generator must require PASS for staging, query, runtime/UI and promotion validations before marking those tasks complete.

- [ ] **Step 1:** Require new validation artifacts in documentation generator.
- [ ] **Step 2:** Promote them into `Validate generated invariants`.
- [ ] **Step 3:** Add them to validation artifact bundle and bot commit allowlist.
- [ ] **Step 4:** Update TODO: runtime/query/review complete; explicit promotion complete only after both PostgreSQL and HTTP validation are PASS.
- [ ] **Step 5:** Verify Regulatory CI and Security CI complete successfully on the exact final head.

## Self-review

- Spec coverage: explicit target, RBAC, tenant isolation, concurrency, audit, rollback, duplicate prevention, local gate and submission lock each have an implementation/test task.
- Placeholder scan: no TBD/TODO implementation placeholders.
- Type consistency: command and receipt names are stable across tasks.
- Scope: one subsystem only — promotion of a single confirmed import value; bulk import/extraction infrastructure remains out of scope.
