import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) => JSON.parse(await readFile(path.join(repoRoot, file), "utf8"));
const readText = async (file) => readFile(path.join(repoRoot, file), "utf8");

const validations = {
  api: await readJson("regulatory/validation/CIRC005_WEB_API_INTEGRATION_VALIDATION.json"),
  postgres: await readJson("regulatory/validation/POSTGRESQL_CORE_VALIDATION.json"),
  repository: await readJson("regulatory/validation/POSTGRESQL_REPOSITORY_VALIDATION.json"),
  importStaging: await readJson("regulatory/validation/POSTGRESQL_IMPORT_STAGING_VALIDATION.json"),
  importQuery: await readJson("regulatory/validation/POSTGRESQL_IMPORT_STAGING_QUERY_VALIDATION.json"),
  importPromotion: await readJson("regulatory/validation/POSTGRESQL_IMPORT_PROMOTION_VALIDATION.json"),
  evidence: await readJson("regulatory/validation/POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION.json"),
  backup: await readJson("regulatory/validation/POSTGRESQL_BACKUP_RESTORE_VALIDATION.json"),
  engine: await readJson("regulatory/validation/ENGINE_BRANCH_COVERAGE_VALIDATION.json"),
  multiProfile: await readJson("regulatory/validation/MULTI_PROFILE_REGRESSION_CORPUS_VALIDATION.json"),
};
const manifest = await readJson("examples/generated/united-capital-diamond/generation-manifest.json");
const docx = await readJson("examples/generated/united-capital-diamond/docx-manifest.json");
const schema = await readJson("schemas/canonical/PROSPECTUS_CANONICAL_MODEL_V1.schema.json");
const staticRegistry = await readJson("regulatory/registries/UMOA_STATIC_REFERENCE_V1.json");
const nextAction = await readText("NEXT_ACTION.md");
const dataDictionary = await readText("docs/03-data/CANONICAL_DATA_DICTIONARY_V1.md");
const clauseCatalog = await readText("src/catalog/clause-catalog.js");

const expected = {
  api: "CIRC005_WEB_API_INTEGRATION_VALIDATION_V4",
  postgres: "POSTGRESQL_REGULATORY_CORE_VALIDATION_V1",
  repository: "POSTGRESQL_PROJECT_REPOSITORY_VALIDATION_V1",
  importStaging: "POSTGRESQL_IMPORT_STAGING_VALIDATION_V1",
  importQuery: "POSTGRESQL_IMPORT_STAGING_QUERY_VALIDATION_V1",
  importPromotion: "POSTGRESQL_IMPORT_PROMOTION_VALIDATION_V1",
  evidence: "POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION_V1",
  backup: "POSTGRESQL_BACKUP_RESTORE_VALIDATION_V1",
  engine: "ENGINE_BRANCH_COVERAGE_VALIDATION_V1",
  multiProfile: "MULTI_PROFILE_REGRESSION_CORPUS_VALIDATION_V1",
};
for (const [key, id] of Object.entries(expected)) {
  const value = validations[key];
  if (value.status !== "PASS" || value.validationId !== id) {
    throw new Error("CURRENT_STATE_VALIDATION_FAILED:" + id);
  }
}
if (manifest.requirement_count !== 62 || manifest.coverage_counts?.MISSING !== 0) {
  throw new Error("CURRENT_STATE_CIRC005_COVERAGE_NOT_PROVEN");
}
if (manifest.ready_for_submission !== false || docx.ready_for_submission !== false) {
  throw new Error("CURRENT_STATE_SUBMISSION_INVARIANT_FAILED");
}
if (schema.$defs?.regulatoryContext?.properties?.ready_for_submission?.const !== false) {
  throw new Error("CURRENT_STATE_SCHEMA_SUBMISSION_LOCK_MISSING");
}
if (
  staticRegistry.status !== "SOURCE_VERIFIED_BASELINE" ||
  staticRegistry.member_states?.length !== 8 ||
  staticRegistry.common_currency?.canonical_code !== "XOF"
) {
  throw new Error("CURRENT_STATE_STATIC_REGISTRY_INVALID");
}
if (staticRegistry.calendars?.status !== "NOT_MATERIALIZED") {
  throw new Error("CURRENT_STATE_DYNAMIC_CALENDAR_MUST_REMAIN_UNMATERIALIZED");
}
if (
  staticRegistry.governance?.automatic_regulatory_activation !== false ||
  staticRegistry.governance?.ready_for_submission !== false
) {
  throw new Error("CURRENT_STATE_STATIC_REGISTRY_GOVERNANCE_INVALID");
}
if (!nextAction.includes("CM/10/06/2022")) {
  throw new Error("CURRENT_STATE_NEXT_REGULATORY_ACTION_NOT_PRESERVED");
}
if (!dataDictionary.includes("PROSPECTUS_CANONICAL_MODEL_V1.schema.json")) {
  throw new Error("CURRENT_STATE_DATA_DICTIONARY_NOT_BOUND_TO_SCHEMA");
}
if (
  !clauseCatalog.includes('CLAUSE_CATALOG_VERSION = "0.1.0"') ||
  !clauseCatalog.includes("DRAFT_LEGAL_REVIEW_REQUIRED")
) {
  throw new Error("CURRENT_STATE_CLAUSE_BASELINE_UNEXPECTED");
}

const validation = {
  validationId: "CURRENT_STATE_RECONCILIATION_V1",
  status: "PASS",
  projectState: "FUNCTIONAL_PRE_COMPLIANCE_PLATFORM_EXTERNAL_AND_HUMAN_BLOCKERS_REMAIN",
  implementedAndTested: [
    "CIRC005_62_REQUIREMENTS_MISSING_ZERO",
    "CANONICAL_SCHEMA_AND_DATA_DICTIONARY",
    "QUESTIONNAIRE_AND_ENGINE_BRANCH_COVERAGE",
    "DETERMINISTIC_DOCUMENT_PIPELINE",
    "NEXTJS_ATOMIC_DESIGN_AND_HTTP_API",
    "POSTGRESQL_RLS_VERSIONING_AUDIT_AND_BACKUP_RESTORE",
    "EVIDENCE_QUARANTINE_SCAN_QUEUE_RETRY_AND_RELEASE_SEPARATION",
    "IMPORT_STAGING_HUMAN_REVIEW_AND_EXPLICIT_PROMOTION",
    "MULTI_PROFILE_GOLDEN_MASTERS",
    "UMOA_STATIC_MEMBER_STATE_AND_XOF_BASELINE"
  ],
  partialOrReviewRequired: [
    {
      item: "CLAUSE_LIBRARY",
      state: "VERSIONED_EXECUTABLE_DRAFTS_AND_GOVERNED_PROPOSAL_LIFECYCLE; SOURCE_CATALOG_STILL_CODE; LEGAL_REVIEW_REQUIRED"
    },
    {
      item: "UMOA_REFERENCE_DATA",
      state: "STATIC_MEMBER_STATE_AND_CURRENCY_BASELINE_ONLY; DYNAMIC_ACTORS_AND_CALENDARS_NOT_MATERIALIZED"
    },
    {
      item: "INSTRUCTION_66",
      state: "MATERIALIZED_AND_ATOMIZED; HUMAN_LEGAL_AND_COMPLIANCE_REVIEW_PENDING"
    }
  ],
  externalBlockers: [
    "RECOVER_OFFICIAL_OR_INSTITUTIONAL_BINARY_CM_10_06_2022",
    "PROVISION_AND_ATTEST_TARGET_INFRASTRUCTURE_AND_IDENTITY",
    "RUN_TARGET_BACKUP_RESTORE_AND_PRODUCTION_ACCEPTANCE",
    "COMPLETE_LEGAL_COMPLIANCE_TAX_RISK_PRODUCT_REVIEWS",
    "COMPLETE_MANUAL_ACCESSIBILITY_REVIEW",
    "OWNER_DECISION_ON_GITHUB_PUBLIC_VISIBILITY"
  ],
  checks: {
    circ005RequirementCount62: true,
    circ005MissingZero: true,
    canonicalSchemaBoundToDictionary: true,
    apiIntegrationPass: true,
    postgresCorePass: true,
    postgresRepositoryPass: true,
    importStagingAndPromotionPass: true,
    evidenceLifecyclePass: true,
    backupRestoreHarnessPass: true,
    engineBranchCoveragePass: true,
    multiProfileGoldenValidationPass: true,
    staticUmoaBaselinePresent: true,
    dynamicCalendarsNotFabricated: true,
    clauseCatalogRemainsDraftReviewRequired: true,
    nextRegulatoryActionPreserved: true,
    readyForSubmissionRemainsFalse: true
  },
  caveat:
    "Cette réconciliation décrit uniquement l’état technique prouvé du dépôt. Les éléments PARTIAL et EXTERNAL_BLOCKER ne sont ni simulés ni promus automatiquement en terminé."
};

await writeFile(
  path.join(repoRoot, "regulatory", "validation", "CURRENT_STATE_RECONCILIATION.json"),
  JSON.stringify(validation, null, 2) + "\n",
  "utf8"
);

const implemented = validation.implementedAndTested
  .map((item) => "- `IMPLEMENTED_AND_TESTED` — " + item)
  .join("\n");
const partial = validation.partialOrReviewRequired
  .map((item) => "- `PARTIAL/REVIEW_REQUIRED` — " + item.item + " : " + item.state)
  .join("\n");
const external = validation.externalBlockers
  .map((item) => "- `EXTERNAL_BLOCKER` — " + item)
  .join("\n");
const stateBlock = [
  "## Réconciliation actuelle du projet — preuve machine",
  "",
  "Validation : `CURRENT_STATE_RECONCILIATION_V1 = PASS`.",
  "",
  "### Implémenté et testé",
  "",
  implemented,
  "",
  "### Partiel / revue obligatoire",
  "",
  partial,
  "",
  "### Bloqueurs externes ou humains",
  "",
  external,
  "",
  "`ready_for_submission=false` reste un invariant de schéma, runtime et génération. Les anciennes checklists restent des traces historiques ; ce bloc porte l’état courant attesté."
].join("\n");

for (const file of ["STATUS.md", "SUIVI.md", "CURRENT_ITERATION.md", "HANDOFF.md"]) {
  await upsert(file, stateBlock);
}
await upsert("TODO.md", [
  "## Réconciliation actuelle — ne pas confondre avec les checklists historiques",
  "",
  "### `IMPLEMENTED_AND_TESTED`",
  "",
  "- [x] 62 exigences CIRC005 conservées et `MISSING=0` sur le cas standard.",
  "- [x] JSON Schema canonique V1 et dictionnaire de données liés.",
  "- [x] Questionnaire exécutable, visibilité conditionnelle et couverture machine des branches.",
  "- [x] Génération déterministe Markdown/DOCX et pipeline PDF normalisé contrôlé.",
  "- [x] Application Next.js / Atomic Design et API HTTP.",
  "- [x] PostgreSQL 17, RLS tenant, versions, audit, concurrence et drill backup/restore CI.",
  "- [x] Preuves : quarantaine, scan serveur, queue/lease/retry, séparation scan/release.",
  "- [x] Import : extraction non vérifiée, staging, revue humaine et promotion canonique explicite.",
  "- [x] Golden masters multi-profils issus d’une CI attestée.",
  "- [x] Référentiel statique UMOA : 8 États + XOF/BCEAO, sans calendrier inventé.",
  "",
  "### `PARTIAL/REVIEW_REQUIRED`",
  "",
  "- [~] Clauses : catalogue exécutable versionné + cycle de propositions gouverné, mais source catalogue encore en code et clauses toujours `DRAFT_LEGAL_REVIEW_REQUIRED`.",
  "- [~] Référentiels : socle États/devise seulement ; acteurs agréés et calendriers dynamiques restent à sourcer/versionner.",
  "- [~] Instruction 66 : matérialisée et atomisée, mais revues juridique/conformité encore requises.",
  "",
  "### `EXTERNAL_BLOCKER`",
  "",
  "- [ ] Obtenir le binaire officiel/institutionnel `CM/10/06/2022` puis comparer 2016 ↔ 2022.",
  "- [ ] Provisionner et attester l’infrastructure et l’identité de production.",
  "- [ ] Exécuter backup/restore et acceptation sur la cible réelle.",
  "- [ ] Terminer les validations humaines Legal/Compliance/Tax/Risk/Product.",
  "- [ ] Effectuer la revue manuelle d’accessibilité complémentaire aux tests automatisés.",
  "- [ ] Confirmer avec le propriétaire si la visibilité GitHub `public` est intentionnelle.",
  "",
  "Les anciennes cases non cochées plus bas sont conservées comme historique ; elles ne doivent plus être utilisées seules pour déduire l’état courant."
].join("\n"));

console.log(JSON.stringify({
  validationId: validation.validationId,
  status: validation.status,
  implementedAndTested: validation.implementedAndTested.length,
  partialOrReviewRequired: validation.partialOrReviewRequired.length,
  externalBlockers: validation.externalBlockers.length,
  readyForSubmission: false
}, null, 2));

async function upsert(relativePath, markdown) {
  const id = "CURRENT-STATE-RECONCILIATION-V1";
  const filePath = path.join(repoRoot, relativePath);
  const start = "<!-- AUTO:" + id + ":START -->";
  const end = "<!-- AUTO:" + id + ":END -->";
  const block = start + "\n" + markdown.trim() + "\n" + end;
  let current = await readFile(filePath, "utf8");
  const startIndex = current.indexOf(start);
  const endIndex = current.indexOf(end);
  if (startIndex >= 0 && endIndex >= startIndex) {
    current = current.slice(0, startIndex) + block + current.slice(endIndex + end.length);
  } else {
    current = current.trimEnd() + "\n\n" + block + "\n";
  }
  await writeFile(filePath, current, "utf8");
}
