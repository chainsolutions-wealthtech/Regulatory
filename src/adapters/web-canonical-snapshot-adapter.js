import { generateProspectusDraft } from "../core/generation-service.js";
import { hashObject } from "../core/hash.js";

const SNAPSHOT_SCHEMA = "WEB_CANONICAL_SNAPSHOT_V1";
const FALLBACK_GENERATED_AT = "2000-01-01T00:00:00.000Z";

/**
 * Adapte un snapshot canonique produit par l'application Next.js vers le
 * compositeur documentaire historique, sans dupliquer les règles CIRC005.
 *
 * @param {{snapshot: Record<string, any>, matrixRows: Array<Record<string, any>>, generatedAt?: string}} input
 */
export function generateFromWebCanonicalSnapshot({ snapshot, matrixRows, generatedAt }) {
  validateSnapshot(snapshot, matrixRows);

  const rowsByQuestionId = new Map(
    matrixRows
      .filter((row) => row.question_id)
      .map((row) => [row.question_id, row]),
  );
  const mappedRecords = [];
  const unmappedQuestionIds = new Set(snapshot.legacyUnmappedAnswers ?? []);

  for (const record of snapshot.answerRecords) {
    const matrixRow = rowsByQuestionId.get(record.questionId);
    if (!matrixRow) {
      unmappedQuestionIds.add(record.questionId);
      continue;
    }
    mappedRecords.push({ record, matrixRow });
  }

  const seedData = structuredClone(snapshot.canonicalData);
  seedData.regulatory_context = isPlainObject(seedData.regulatory_context)
    ? seedData.regulatory_context
    : {};
  seedData.regulatory_context.rule_pack ??= snapshot.rulePack;
  seedData.regulatory_context.rule_pack_version ??= snapshot.catalogDigest;
  seedData.regulatory_context.web_catalog_digest = snapshot.catalogDigest;
  seedData.regulatory_context.web_snapshot_schema_version = snapshot.schemaVersion;
  seedData.regulatory_context.web_project_id = snapshot.projectId;
  seedData.regulatory_context.web_project_version = snapshot.projectVersion;

  // Les valeurs sont déjà matérialisées dans canonicalData. Les réponses vides
  // servent uniquement à conserver le lien question → exigence dans le moteur.
  const answers = mappedRecords.map(({ record }) => ({
    question_id: record.questionId,
    field_values: {},
    source: {
      kind: "WEB_CANONICAL_SNAPSHOT",
      source_kind: record.sourceKind,
      source_reference: record.sourceReference ?? null,
    },
    review_status: record.reviewStatus,
  }));

  const resolvedGeneratedAt =
    generatedAt ?? snapshot.snapshotCreatedAt ?? snapshot.projectUpdatedAt ?? FALLBACK_GENERATED_AT;
  const generation = generateProspectusDraft({
    seedData,
    answers,
    matrixRows,
    generatedAt: resolvedGeneratedAt,
  });

  const answerLog = mappedRecords.map(({ record, matrixRow }) => ({
    question_id: record.questionId,
    requirement_id: matrixRow.requirement_id,
    requirement_ids: [...new Set(record.requirementIds ?? [matrixRow.requirement_id])],
    field_paths: [...new Set(record.canonicalFieldPaths ?? [])],
    source: {
      kind: "WEB_CANONICAL_SNAPSHOT",
      answer_source: record.source,
      source_kind: record.sourceKind,
      source_reference: record.sourceReference ?? null,
    },
    review_status: record.reviewStatus,
  }));
  const pendingReviewQuestionIds = snapshot.answerRecords
    .filter((record) => record.reviewStatus !== "CONFIRMED")
    .map((record) => record.questionId)
    .toSorted();

  return {
    ...generation,
    canonicalSnapshot: snapshot,
    answerLog,
    manifest: {
      ...generation.manifest,
      generated_at: resolvedGeneratedAt,
      answer_count: answerLog.length,
      web_snapshot_schema_version: snapshot.schemaVersion,
      web_snapshot_sha256: hashObject(snapshot),
      web_project_id: snapshot.projectId,
      web_project_version: snapshot.projectVersion,
      web_catalog_digest: snapshot.catalogDigest,
      web_requirement_count: snapshot.requirementCount,
      web_coverage_counts: structuredClone(snapshot.coverage),
      web_pending_review_question_ids: pendingReviewQuestionIds,
      legacy_unmapped_answer_question_ids: [...unmappedQuestionIds].toSorted(),
      ready_for_submission: false,
      adapter_caveat:
        "Adaptation technique déterministe du snapshot web. Elle ne constitue ni une validation juridique, ni une approbation réglementaire.",
    },
  };
}

function validateSnapshot(snapshot, matrixRows) {
  if (!isPlainObject(snapshot)) throw new Error("WEB_SNAPSHOT_INVALID_OBJECT");
  if (snapshot.schemaVersion !== SNAPSHOT_SCHEMA) {
    throw new Error(`WEB_SNAPSHOT_SCHEMA_UNSUPPORTED:${String(snapshot.schemaVersion)}`);
  }
  if (!snapshot.projectId || !Number.isInteger(snapshot.projectVersion)) {
    throw new Error("WEB_SNAPSHOT_PROJECT_IDENTITY_INVALID");
  }
  if (!isPlainObject(snapshot.canonicalData)) {
    throw new Error("WEB_SNAPSHOT_CANONICAL_DATA_INVALID");
  }
  if (!Array.isArray(snapshot.answerRecords) || !Array.isArray(snapshot.legacyUnmappedAnswers)) {
    throw new Error("WEB_SNAPSHOT_ANSWER_RECORDS_INVALID");
  }
  if (snapshot.readyForSubmission !== false) {
    throw new Error("WEB_SNAPSHOT_SUBMISSION_FLAG_MUST_BE_FALSE");
  }
  if (matrixRows.length !== 62 || snapshot.requirementCount !== 62) {
    throw new Error("WEB_SNAPSHOT_REQUIREMENT_COUNT_MISMATCH");
  }
  const requirementIds = new Set(matrixRows.map((row) => row.requirement_id));
  if (requirementIds.size !== 62) {
    throw new Error("WEB_SNAPSHOT_MATRIX_REQUIREMENTS_NOT_UNIQUE");
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
