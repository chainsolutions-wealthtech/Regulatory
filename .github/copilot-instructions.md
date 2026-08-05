# GitHub Copilot / agent instructions

> **Statut :** `APPLICABLE`  
> **Nature :** adaptateur vers les règles canoniques, enrichi sans supprimer les instructions historiques.  
> **Autorité :** `00_START_HERE.md`, puis `AGENTS.md` et `SOURCE_OF_TRUTH.md`.

GitHub Copilot doit commencer par `00_START_HERE.md`. En cas de divergence entre ce fichier et les documents canoniques, appliquer la règle la plus restrictive, interrompre l’action irréversible et documenter la contradiction. Ce fichier ne doit pas devenir un corpus de règles parallèle.

These instructions apply to every automated assistant working in this repository.

## Mandatory startup

Before editing:

1. read `00_START_HERE.md` and follow its complete reading order;
2. stay on the existing designated branch;
3. do not create a branch;
4. read `README.md`;
5. read `AGENTS.md`;
6. read `SOURCE_OF_TRUTH.md`;
7. read `STATUS.md`, `SUIVI.md`, `TODO.md`, `NEXT_ACTION.md`, `LOOP_STATE.md` and `CURRENT_ITERATION.md`;
8. read `docs/DECISIONS.md`;
9. read `docs/ARCHITECTURE.md`;
10. read the relevant specification and mapping;
11. inspect existing code, tests, structured artifacts and recent commits.

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
- Distinguish canonical documents from adapters using `SOURCE_OF_TRUTH.md`.
- Do not use a conversation as the canonical memory of the project.

## Regulatory integrity

- Regulatory rules require an identified source, version, citation, jurisdiction, applicability and effective period.
- Existing prospectuses are examples and test cases, not normative sources.
- Do not invent thresholds, tax rates, legal obligations or approvals.
- Do not present generated documents as approved, authorized or visaed without formal regulator evidence.
- Specific or atypical wording must be flagged `LEGAL_REVIEW_REQUIRED`.

## Documentation is part of the change

Update as applicable in the same change:

- `README.md` ;
- `SUIVI.md` ;
- `TODO.md` ;
- `CHANGELOG.md` ;
- `STATUS.md` ;
- `WORK_LOG.md` ;
- `LOOP_STATE.md` ;
- `NEXT_ACTION.md` ;
- `HANDOFF.md` ;
- `docs/DECISIONS.md` ;
- `docs/ARCHITECTURE.md` ;
- `docs/PROSPECTUS_ENGINE_SPEC.md` ;
- `docs/REGULATORY_MAPPING.md` ;
- tests and examples.

## Security

- Never commit secrets, credentials, tokens or private keys.
- Preserve evidence provenance and auditability.
- Apply least privilege and avoid destructive operations.

## End-of-intervention checklist

- [ ] canonical reading order completed ;
- [ ] current loop and one next action identified ;
- [ ] branch unchanged and no branch created ;
- [ ] diff and non-regression impacts reviewed ;
- [ ] tests or justified non-applicability recorded ;
- [ ] state, history, TODO, work log and handoff updated ;
- [ ] no legal, regulatory or production validation invented.
