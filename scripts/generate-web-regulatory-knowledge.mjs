import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sourceFiles = {
  instructions: "regulatory/registries/AMF_UMOA_INSTRUCTION_API_CATALOG_V0_1.json",
  circulars: "regulatory/registries/AMF_UMOA_CIRCULAR_API_CATALOG_V0_1.json",
  decisions: "regulatory/registries/AMF_UMOA_DECISION_API_CATALOG_V0_1.json",
  dependencies: "regulatory/registries/INST066_CURRENT_EXTERNAL_DEPENDENCY_STATE_V0_1.json",
  candidates: "regulatory/requirements/INST066_PROSPECTUS_REQUIREMENT_CANDIDATES_V0_1.json",
};
const materializedDirectory = "regulatory/materialized";
const outputFile = "apps/web/src/generated/regulatory-knowledge.json";
const validationFile = "regulatory/validation/REGULATORY_KNOWLEDGE_WEB_CATALOG_VALIDATION.json";

const raw = Object.fromEntries(
  await Promise.all(
    Object.entries(sourceFiles).map(async ([key, file]) => [
      key,
      await readFile(path.join(repoRoot, file), "utf8"),
    ]),
  ),
);
const parsed = Object.fromEntries(
  Object.entries(raw).map(([key, content]) => [key, JSON.parse(content)]),
);

assertCatalogCount(parsed.instructions, "instructionCount", 65, "INSTRUCTION");
assertCatalogCount(parsed.circulars, "circularCount", 39, "CIRCULAR");
assertCatalogCount(parsed.decisions, "decisionCount", 10, "DECISION");

if (parsed.candidates.requirementCandidateCount !== 111 || parsed.candidates.requirements.length !== 111) {
  throw new Error("REGULATORY_KNOWLEDGE_INST066_CANDIDATE_COUNT_MISMATCH");
}
if (parsed.candidates.requirements.some((item) => item.activation !== "FORBIDDEN")) {
  throw new Error("REGULATORY_KNOWLEDGE_INST066_CANDIDATE_ACTIVATION_NOT_FORBIDDEN");
}

const dependencySummary = parsed.dependencies.summary;
if (
  dependencySummary.dependencyOccurrenceCount !== 49 ||
  dependencySummary.resolvedDocumentaryCount !== 33 ||
  dependencySummary.unresolvedDocumentaryCount !== 16 ||
  parsed.dependencies.resolvedDependencies.length !== 33 ||
  parsed.dependencies.unresolvedDependencies.length !== 16
) {
  throw new Error("REGULATORY_KNOWLEDGE_DEPENDENCY_COUNTS_MISMATCH");
}
const allDependencies = [
  ...parsed.dependencies.unresolvedDependencies,
  ...parsed.dependencies.resolvedDependencies,
];
if (allDependencies.some((item) => item.activation !== "FORBIDDEN")) {
  throw new Error("REGULATORY_KNOWLEDGE_DEPENDENCY_ACTIVATION_NOT_FORBIDDEN");
}
for (const flag of [
  "rawInventoryMutated",
  "documentaryResolutionIsRequirementActivation",
  "automaticDependencyResolutionAllowed",
  "automaticRequirementActivationAllowed",
]) {
  if (parsed.dependencies.boundary[flag] !== false) {
    throw new Error(`REGULATORY_KNOWLEDGE_BOUNDARY_EXPECTED_FALSE:${flag}`);
  }
}
for (const flag of [
  "humanLegalReviewRequired",
  "humanComplianceReviewRequired",
  "readyForSubmissionMustRemainFalse",
]) {
  if (parsed.dependencies.boundary[flag] !== true) {
    throw new Error(`REGULATORY_KNOWLEDGE_BOUNDARY_EXPECTED_TRUE:${flag}`);
  }
}

const sourceCatalogs = [
  ...parsed.instructions.entries.map((item) => normalizeSource(item, "INSTRUCTION")),
  ...parsed.circulars.entries.map((item) => normalizeSource(item, "CIRCULAR")),
  ...parsed.decisions.entries.map((item) => normalizeSource(item, "DECISION")),
].toSorted((left, right) =>
  left.type.localeCompare(right.type) ||
  String(right.year ?? "").localeCompare(String(left.year ?? "")) ||
  left.reference.localeCompare(right.reference),
);

const materializedMetadataFiles = (await readdir(path.join(repoRoot, materializedDirectory)))
  .filter((name) => name.endsWith(".metadata.json"))
  .toSorted();

const materializedSources = [];
const materializedSourceFileEvidence = [];
for (const fileName of materializedMetadataFiles) {
  const relative = `${materializedDirectory}/${fileName}`;
  const content = await readFile(path.join(repoRoot, relative), "utf8");
  const item = JSON.parse(content);
  materializedSourceFileEvidence.push({ path: relative, sha256: sha256(content) });
  materializedSources.push({
    sourceId: String(item.sourceId ?? fileName.replace(/\.metadata\.json$/, "")),
    title: String(item.title ?? item.sourceId ?? fileName),
    sourceUrl: item.sourceUrl ?? null,
    retrievedAt: item.retrievedAt ?? null,
    repositoryCopy: item.repositoryCopy ?? null,
    extractedText: item.extractedText ?? null,
    sha256: item.sha256 ?? null,
    byteSize: item.byteSize ?? null,
    pageCount: item.pageCount ?? null,
    extractionStatus: item.extraction?.status ?? null,
    legalReviewStatus: item.legalMetadata?.reviewStatus ?? null,
  });
}
materializedSources.sort((a, b) => a.sourceId.localeCompare(b.sourceId));

const inst066Requirements = parsed.candidates.requirements.map((item) => ({
  id: item.id,
  sourceId: item.sourceId,
  articleNumber: item.articleNumber,
  sourcePages: item.sourcePages,
  normalizedRequirementCandidate: item.normalizedRequirementCandidate,
  applicabilityCandidate: item.applicabilityCandidate,
  products: item.products,
  documentTypes: item.documentTypes,
  canonicalFields: item.canonicalFields,
  questionIds: item.questionIds,
  clauseGroupIds: item.clauseGroupIds,
  controlIds: item.controlIds,
  evidenceTypes: item.evidenceTypes,
  outputSectionIds: item.outputSectionIds,
  reviewRoles: item.reviewRoles,
  circ005RequirementLinks: item.circ005RequirementLinks,
  status: item.status,
  activation: item.activation,
  legalReviewStatus: item.legalReviewStatus,
  complianceReviewStatus: item.complianceReviewStatus,
  sourceTextExcerpt: excerpt(item.sourceTextCandidate, 700),
  provenance: item.provenance,
})).toSorted((a, b) => a.articleNumber - b.articleNumber || a.id.localeCompare(b.id));

const dependencies = allDependencies.map((item) => ({
  dependencyId: item.dependencyId,
  articleNumber: item.articleNumber,
  articleTitle: item.articleTitle,
  dependencyKind: item.dependencyKind,
  sourceWording: item.sourceWording,
  sourceContextExcerpt: excerpt(item.sourceContext, 700),
  rawReferenceStatus: item.rawReferenceStatus,
  effectiveReferenceStatus: item.effectiveReferenceStatus,
  resolvedSourceId: item.resolvedSourceId,
  officialReference: item.officialReference,
  resolutionOrigin: item.resolutionOrigin,
  resolutionOverlayRegistry: item.resolutionOverlayRegistry,
  activation: item.activation,
  legalReviewStatus: item.legalReviewStatus,
  complianceReviewStatus: item.complianceReviewStatus,
})).toSorted((left, right) =>
  (left.effectiveReferenceStatus === "UNRESOLVED" ? 0 : 1) -
    (right.effectiveReferenceStatus === "UNRESOLVED" ? 0 : 1) ||
  left.articleNumber - right.articleNumber ||
  left.dependencyId.localeCompare(right.dependencyId),
);

const evidenceFiles = [
  ...Object.entries(sourceFiles).map(([kind, file]) => ({
    kind,
    path: file,
    sha256: sha256(raw[kind]),
  })),
  ...materializedSourceFileEvidence,
].toSorted((a, b) => a.path.localeCompare(b.path));

const catalogDigest = sha256(JSON.stringify({
  evidenceFiles,
  sourceCatalogs,
  materializedSources,
  inst066Requirements,
  dependencySummary,
  dependencies,
}));

const catalog = {
  schemaVersion: "REGULATORY_KNOWLEDGE_WEB_CATALOG_V1",
  generatedBy: "scripts/generate-web-regulatory-knowledge.mjs",
  doNotEdit: true,
  catalogDigest,
  sourceCounts: {
    instructions: parsed.instructions.instructionCount,
    circulars: parsed.circulars.circularCount,
    decisions: parsed.decisions.decisionCount,
    total: sourceCatalogs.length,
    materialized: materializedSources.length,
  },
  sourceCatalogs,
  materializedSources,
  inst066: {
    sourceId: parsed.candidates.sourceId,
    sourceSha256: parsed.candidates.sourceSha256,
    status: parsed.candidates.status,
    activation: parsed.candidates.activation,
    requirementCandidateCount: parsed.candidates.requirementCandidateCount,
    caveat: parsed.candidates.caveat,
    requirements: inst066Requirements,
  },
  dependencies: {
    status: parsed.dependencies.status,
    sourceInstructionSha256: parsed.dependencies.sourceInstructionSha256,
    summary: dependencySummary,
    boundary: parsed.dependencies.boundary,
    items: dependencies,
  },
  evidenceFiles,
};

const validation = {
  validationId: "REGULATORY_KNOWLEDGE_WEB_CATALOG_VALIDATION_V1",
  status: "PASS",
  catalogDigest,
  counts: {
    instructions: 65,
    circulars: 39,
    decisions: 10,
    registrySources: 114,
    materializedSources: materializedSources.length,
    inst066Candidates: 111,
    dependencyOccurrences: 49,
    dependencyResolvedDocumentary: 33,
    dependencyUnresolvedDocumentary: 16,
  },
  checks: {
    sourceCatalogDeclaredCountsMatchEntries: true,
    inst066CandidateCount111: true,
    inst066CandidatesActivationForbidden: true,
    dependencyCounts49_33_16: true,
    dependencyActivationForbidden: true,
    documentaryResolutionIsNotActivation: true,
    automaticDependencyResolutionForbidden: true,
    automaticRequirementActivationForbidden: true,
    humanLegalReviewRequired: true,
    humanComplianceReviewRequired: true,
    readyForSubmissionRemainsFalse: true,
    generatedProjectionReadOnly: true,
  },
  caveat:
    "Projection déterministe des artefacts versionnés du dépôt. Un élément de registre, une matérialisation ou une résolution documentaire ne constitue pas à lui seul une validation juridique, une activation réglementaire ou une autorisation de soumission.",
};

await Promise.all([
  writeJson(path.join(repoRoot, outputFile), catalog),
  writeJson(path.join(repoRoot, validationFile), validation),
]);

console.log(JSON.stringify({
  output: outputFile,
  validation: validationFile,
  catalogDigest,
  sourceCounts: catalog.sourceCounts,
  inst066Candidates: 111,
  dependencySummary,
}, null, 2));

function normalizeSource(item, type) {
  return {
    sourceKey: `${type}:${item.actualiteId}`,
    type,
    actualiteId: item.actualiteId,
    number: item.number ?? null,
    year: item.year ?? null,
    reference: String(item.reference ?? item.titre ?? `${type} ${item.actualiteId}`),
    title: String(item.titre ?? item.reference ?? `${type} ${item.actualiteId}`),
    summary: String(item.resume ?? item.texte ?? ""),
    category: item.categorie ?? null,
    portalDate: item.portalDate ?? null,
    portalValid: item.portalValide ?? null,
    portalAbrogated: item.portalAbroge ?? null,
    documentUrl: item.documentUrl ?? null,
    documentPresent: Boolean(item.docPresent),
    documentBase64Sha256: item.docBase64Sha256 ?? null,
    apiUrl: item.apiUrl ?? null,
    rawSha256: item.rawSha256 ?? null,
    sanctions2022ReferenceMatch: Boolean(item.sanctions2022ReferenceMatch),
    sanctionsSubjectMatch: Boolean(item.sanctionsSubjectMatch),
  };
}

function assertCatalogCount(catalog, countField, expected, label) {
  if (catalog[countField] !== expected || !Array.isArray(catalog.entries) || catalog.entries.length !== expected) {
    throw new Error(`REGULATORY_KNOWLEDGE_${label}_COUNT_MISMATCH`);
  }
}

function excerpt(value, maxLength) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
