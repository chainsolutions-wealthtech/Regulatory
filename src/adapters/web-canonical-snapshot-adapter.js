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
  normalizeCanonicalCollectionsForHistoricalComposer(seedData);
  seedData.regulatory_context = isPlainObject(seedData.regulatory_context)
    ? seedData.regulatory_context
    : {};
  seedData.regulatory_context.rule_pack ??= snapshot.rulePack;
  seedData.regulatory_context.rule_pack_version ??= snapshot.catalogDigest;
  seedData.regulatory_context.web_catalog_digest = snapshot.catalogDigest;
  seedData.regulatory_context.web_snapshot_schema_version = snapshot.schemaVersion;
  seedData.regulatory_context.web_project_id = snapshot.projectId;
  seedData.regulatory_context.web_project_version = snapshot.projectVersion;
  seedData.regulatory_context.canonical_collection_adapter_version = "1.0.0";

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
      canonical_collection_adapter_version: "1.0.0",
      adapter_caveat:
        "Adaptation technique déterministe du snapshot web. Elle ne constitue ni une validation juridique, ni une approbation réglementaire.",
    },
  };
}

function normalizeCanonicalCollectionsForHistoricalComposer(seedData) {
  const ranges = seedData.investment_policy?.asset_class_ranges;
  if (Array.isArray(ranges)) {
    seedData.investment = isPlainObject(seedData.investment) ? seedData.investment : {};
    seedData.investment.asset_ranges = ranges.map((range) => ({
      range_id: range.range_id,
      asset_class: range.asset_class,
      minimum_percent: Number(range.minimum_percent),
      target_percent: Number(range.target_percent),
      maximum_percent: Number(range.maximum_percent),
      review_status: range.review_status ?? "UNREVIEWED",
      provenance: "WEB_CANONICAL_COLLECTION",
    }));
  }

  const transactionFees = Array.isArray(seedData.fees?.transaction)
    ? seedData.fees.transaction
    : Array.isArray(seedData.fees)
      ? seedData.fees
      : [];
  const remunerations = Array.isArray(seedData.remunerations) ? seedData.remunerations : [];
  if (transactionFees.length > 0 || remunerations.length > 0) {
    seedData.fees = [...transactionFees, ...remunerations].map((fee) => ({
      ...fee,
      provenance: fee.provenance ?? "WEB_CANONICAL_COLLECTION",
    }));
  }

  const providers = Array.isArray(seedData.service_providers) ? seedData.service_providers : [];
  const firstByRole = (role) => providers.find((provider) => provider.role === role);
  const depositary = firstByRole("DEPOSITARY");
  if (depositary && !isPlainObject(seedData.depositary)) {
    seedData.depositary = partyToOrganization(depositary);
  }
  const auditor = firstByRole("AUDITOR");
  if (auditor) seedData.auditor = partyToOrganization(auditor);
  const adviser = firstByRole("EXTERNAL_ADVISER");
  if (adviser && !isPlainObject(seedData.external_adviser)) {
    seedData.external_adviser = {
      enabled: true,
      organization_id: adviser.party_id,
      legal_name: adviser.legal_name,
      person_name: adviser.person_name ?? null,
      verification_status: adviser.verification_status,
    };
  }
  const accountingControllers = providers.filter((provider) => provider.role === "ACCOUNTING_CONTROL");
  if (accountingControllers.length > 0) {
    seedData.accounting_control = isPlainObject(seedData.accounting_control)
      ? seedData.accounting_control
      : {};
    seedData.accounting_control.responsible_persons = accountingControllers;
  }
  seedData.distributors = providers.filter((provider) => provider.role === "DISTRIBUTOR");
  seedData.paying_agents = providers.filter((provider) => provider.role === "PAYING_AGENT");

  if (Array.isArray(seedData.manager?.governance_members)) {
    const members = seedData.manager.governance_members;
    seedData.manager.governance_summary = members
      .map((member) => `${member.person_name ?? member.legal_name ?? "Membre à confirmer"} — ${member.function_title ?? "fonction à confirmer"}`)
      .join(" ; ");
  }

  if (Array.isArray(seedData.distribution_countries)) {
    seedData.distribution = isPlainObject(seedData.distribution) ? seedData.distribution : {};
    seedData.distribution.countries = seedData.distribution_countries;
  }

  if (Array.isArray(seedData.evidence)) {
    seedData.documents = isPlainObject(seedData.documents) ? seedData.documents : {};
    seedData.documents.evidence_register = seedData.evidence;
  }
}

function partyToOrganization(party) {
  return {
    organization_id: party.party_id,
    legal_name: party.legal_name,
    legal_form: party.legal_form ?? null,
    approval: party.approval_number ? { number: party.approval_number } : undefined,
    registered_office: party.registered_office ?? null,
    main_activity: party.main_activity ?? null,
    profile_status: party.verification_status ?? "USER_PROVIDED_PENDING_REVIEW",
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
