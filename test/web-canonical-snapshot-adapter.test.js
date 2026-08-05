import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCirc005Matrix } from "../src/adapters/circ005-matrix-loader.js";
import { generateFromWebCanonicalSnapshot } from "../src/adapters/web-canonical-snapshot-adapter.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fixture() {
  const canonicalData = JSON.parse(
    await readFile(
      path.join(repoRoot, "examples", "united-capital-diamond", "preloaded-data.json"),
      "utf8",
    ),
  );
  return {
    matrixRows: await loadCirc005Matrix(repoRoot),
    snapshot: {
      schemaVersion: "WEB_CANONICAL_SNAPSHOT_V1",
      snapshotCreatedAt: "2026-08-05T08:00:00.000Z",
      projectId: "generic-web-fund",
      projectVersion: 7,
      projectUpdatedAt: "2026-08-05T08:00:00.000Z",
      catalogDigest: "catalog-test-digest",
      rulePack: "UMOA_FCP_CIRC005",
      requirementCount: 62,
      readyForSubmission: false,
      canonicalData,
      structuredAnswers: {},
      answerRecords: [
        {
          questionId: "Q_FUND_LEGAL_NAME",
          requirementIds: ["CIRC005_1_1_FCP_IDENTITY"],
          canonicalFieldPaths: ["fund.legal_name"],
          value: "Generic Web Fund",
          source: "USER",
          reviewStatus: "UNREVIEWED",
          sourceKind: "REGULATORY_MATRIX",
          sourceReference: "Circulaire 005, point 1.1",
        },
        {
          questionId: "APP_FUND_CATEGORY",
          requirementIds: [],
          canonicalFieldPaths: ["fund.category"],
          value: "BOND",
          source: "USER",
          reviewStatus: "UNREVIEWED",
          sourceKind: "APPLICATION",
        },
      ],
      legacyUnmappedAnswers: ["LEGACY_UNKNOWN_QUESTION"],
      coverage: {
        IN_PROSPECTUS: 0,
        IN_ATTACHED_REGULATION: 0,
        IN_ATTACHED_CONSTITUTIVE_DOCUMENT: 0,
        NOT_APPLICABLE: 0,
        PENDING_REVIEW: 61,
        MISSING: 0,
        SYSTEM_METADATA: 1,
      },
      findings: [],
    },
  };
}

test("le snapshot web alimente le compositeur sans dépendre du cas d'exemple", async () => {
  const input = await fixture();
  const generation = generateFromWebCanonicalSnapshot(input);
  assert.equal(generation.concordance.length, 62);
  assert.equal(generation.manifest.web_project_id, "generic-web-fund");
  assert.equal(generation.manifest.web_project_version, 7);
  assert.equal(generation.manifest.answer_count, 1);
  assert.deepEqual(generation.manifest.legacy_unmapped_answer_question_ids, [
    "APP_FUND_CATEGORY",
    "LEGACY_UNKNOWN_QUESTION",
  ]);
  assert.equal(generation.manifest.ready_for_submission, false);
  assert.equal(generation.answerLog[0].question_id, "Q_FUND_LEGAL_NAME");
  assert.deepEqual(generation.answerLog[0].field_paths, ["fund.legal_name"]);
});

test("le même snapshot web produit le même document et le même identifiant", async () => {
  const input = await fixture();
  const first = generateFromWebCanonicalSnapshot(input);
  const second = generateFromWebCanonicalSnapshot(input);
  assert.equal(first.manifest.generation_id, second.manifest.generation_id);
  assert.equal(first.prospectusMarkdown, second.prospectusMarkdown);
  assert.equal(first.manifest.web_snapshot_sha256, second.manifest.web_snapshot_sha256);
});

test("un snapshot prétendument prêt pour soumission est rejeté", async () => {
  const input = await fixture();
  input.snapshot.readyForSubmission = true;
  assert.throws(
    () => generateFromWebCanonicalSnapshot(input),
    /WEB_SNAPSHOT_SUBMISSION_FLAG_MUST_BE_FALSE/,
  );
});