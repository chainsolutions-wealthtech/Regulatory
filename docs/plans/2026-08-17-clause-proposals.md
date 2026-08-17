# Tenant-scoped clause proposals — design and implementation plan

Date: 2026-08-17  
Repository: `chainsolutions-wealthtech/Regulatory`  
Canonical branch: `main`

## Problem

The generated clause catalog is global and read-only. The existing RBAC policy gives `CLAUSE_DRAFT` and `CLAUSE_APPROVE` to organization-scoped LEGAL identities, while `CLAUSE_ACTIVATE` has no grant. Writing organization-scoped identities directly into the global `clauses` / `clause_versions` catalog would create an unsafe cross-tenant authority boundary.

## Decision

Add a tenant-scoped **clause proposal** workflow. A proposal is an organization-owned candidate change linked to a generated catalog clause. It never mutates or activates the global clause catalog.

Supported human-only lifecycle:

1. `DRAFT` — created by a LEGAL actor with `CLAUSE_DRAFT`;
2. `DRAFT_LEGAL_REVIEW_REQUIRED` — explicitly submitted by a LEGAL actor;
3. `APPROVED` — explicitly approved by a different authorized LEGAL actor.

`ACTIVE` is deliberately not part of the proposal persistence surface. No endpoint or repository method may activate a proposal. `CLAUSE_ACTIVATE` remains ungranted and the generated catalog remains unchanged.

## Security and governance invariants

- PostgreSQL RLS on every proposal table;
- verified identity and active organization membership required;
- `CLAUSE_READ` for reads;
- `CLAUSE_DRAFT` for creation and review request;
- `CLAUSE_APPROVE` for approval;
- author cannot approve their own proposal;
- wording is immutable within a proposal version;
- a new wording requires a new version rather than mutation of an approved version;
- status transitions are human-only and reuse `clause-lifecycle.ts`;
- `ready_for_submission=false` is database-constrained;
- global generated clause catalog remains read-only;
- no automatic legal, regulatory, or submission effect.

## Data model

### `regulatory.clause_proposals`

Tenant-scoped root:
- id
- organization_id
- source_clause_id
- created_by
- created_at
- updated_at

### `regulatory.clause_proposal_versions`

Versioned candidate wording:
- id
- organization_id
- proposal_id
- version_number
- wording
- status (`DRAFT`, `DRAFT_LEGAL_REVIEW_REQUIRED`, `APPROVED`)
- created_by / created_at
- review_requested_by / review_requested_at
- approved_by / approved_at
- ready_for_submission constrained to false

The source wording and source catalog digest are recorded for provenance.

## Repository contract

`ClauseProposalRepository`:
- `list()`
- `get(proposalId)`
- `create({ sourceClauseId, wording })`
- `requestLegalReview({ proposalId, expectedVersion })`
- `approve({ proposalId, expectedVersion })`

No activation method exists.

## API

- `GET /api/regulatory/clause-proposals`
- `POST /api/regulatory/clause-proposals`
- `GET /api/regulatory/clause-proposals/:proposalId`
- `POST /api/regulatory/clause-proposals/:proposalId/transitions`
  - `REQUEST_LEGAL_REVIEW`
  - `APPROVE`

Local-json must expose the feature as unavailable rather than invent an identity.

## UI

A dedicated administration surface will show:
- source clause and immutable catalog wording;
- proposed wording;
- current proposal status/version;
- author/reviewer/approver provenance;
- only the transition actions actually available;
- permanent warning that approval does not activate the global clause and does not enable submission.

## TDD sequence

1. RED PostgreSQL repository integration test.
2. Migration + repository GREEN.
3. Runtime factory and HTTP API with local-json gate.
4. HTTP integration assertions.
5. UI surface.
6. Security + Regulatory CI full green.
7. Closure evidence and documentation reconciliation.

## Completion boundary

This feature is complete when proposal creation, review request, independent approval, tenant isolation, version concurrency and immutable provenance are verified in PostgreSQL and exposed through the governed API/UI. Global clause activation remains intentionally out of scope and forbidden until a separate human governance decision changes the RBAC policy.
