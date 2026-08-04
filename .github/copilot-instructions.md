# GitHub Copilot / agent instructions

These instructions apply to every automated assistant working in this repository.

## Mandatory startup

Before editing:

1. stay on the existing designated branch;
2. do not create a branch;
3. read `README.md`;
4. read `AGENTS.md`;
5. read `SUIVI.md`;
6. read `TODO.md`;
7. read `docs/DECISIONS.md`;
8. read `docs/ARCHITECTURE.md`;
9. read the relevant specification and mapping;
10. inspect existing code, tests and recent commits.

## Branch policy

- Never create a new branch automatically.
- Do not switch branches without an explicit instruction.
- Use the existing designated branch; use `main` when no other existing branch is explicitly designated.
- Never force-push or rewrite history.

## Continuity and non-regression

- Reuse existing objects, identifiers, rules and clauses.
- Do not create parallel competing models.
- Do not silently replace prior decisions.
- Do not rename or remove canonical identifiers without migration, impact analysis and tests.
- Do not modify an active legal clause retroactively; create a new version.
- Add or update non-regression tests for every meaningful change.

## Regulatory integrity

- Regulatory rules require an identified source, version, citation, jurisdiction, applicability and effective period.
- Existing prospectuses are examples and test cases, not normative sources.
- Do not invent thresholds, tax rates, legal obligations or approvals.
- Do not present generated documents as approved, authorized or visaed without formal regulator evidence.
- Specific or atypical wording must be flagged `LEGAL_REVIEW_REQUIRED`.

## Documentation is part of the change

Update as applicable in the same change:

- `README.md`;
- `SUIVI.md`;
- `TODO.md`;
- `CHANGELOG.md`;
- `docs/DECISIONS.md`;
- `docs/ARCHITECTURE.md`;
- `docs/PROSPECTUS_ENGINE_SPEC.md`;
- `docs/REGULATORY_MAPPING.md`;
- tests and examples.

## Security

- Never commit secrets, credentials, tokens or private keys.
- Preserve evidence provenance and auditability.
- Apply least privilege and avoid destructive operations.
