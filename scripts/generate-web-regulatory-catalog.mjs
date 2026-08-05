import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const matrixFiles = [
  "regulatory/matrices/CIRC005_FCP_MATRIX_01_GENERAL_IDENTITY_TAX.csv",
  "regulatory/matrices/CIRC005_FCP_MATRIX_02_PARTS_OPERATIONS.csv",
  "regulatory/matrices/CIRC005_FCP_MATRIX_03_INVESTMENT_PRICING.csv",
  "regulatory/matrices/CIRC005_FCP_MATRIX_04_ACTORS_COUNTRY_OTHER.csv",
];
const registryFile = "regulatory/requirements/CIRC005_FCP_REQUIREMENTS_V0_1.yaml";
const outputFile = "apps/web/src/generated/regulatory-catalog.json";
const validationFile = "regulatory/validation/CIRC005_WEB_CATALOG_VALIDATION.json";

const GROUP_DEFINITIONS = [
  group("project", 1, "Projet", "Cadre réglementaire, source et périmètre du dossier."),
  group("manager", 2, "Société de gestion", "Identité, gouvernance, capital et autres OPC gérés."),
  group("fund", 3, "Identité du fonds", "Constitution, durée et informations économiques du fonds."),
  group("shares", 4, "Classes de parts", "Nature, représentation, droits et négociation des parts."),
  group("actors", 5, "Intervenants", "Dépositaire, contrôle comptable et conseillers externes."),
  group("objective", 6, "Objectif de gestion", "Objectif financier, horizon et profil d’investisseur."),
  group("portfolio", 7, "Portefeuille", "Style de gestion, expositions, instruments et emprunts."),
  group("risks", 8, "Risques", "Éléments de risque complémentaires en attente du pack Instruction 66."),
  group("nav", 9, "Valeur liquidative", "Calcul des prix, fréquence et publication."),
  group("subscriptions", 10, "Souscriptions et rachats", "Émission, rachat, remboursement et suspension."),
  group("income", 11, "Revenus", "Clôture, détermination et affectation des revenus."),
  group("fees", 12, "Frais", "Commissions, rémunérations et remboursements de frais."),
  group("valuation", 13, "Valorisation", "Méthodes, hiérarchie des prix et exceptions."),
  group("tax", 14, "Fiscalité", "Régime fiscal et retenues à la source sous revue spécialisée."),
  group("distribution", 15, "Commercialisation", "Dispositifs dans l’État d’établissement et les autres États."),
  group("performance", 16, "Performances", "Historique, méthode et source des performances."),
  group("evidence", 17, "Justificatifs", "Disponibilité des documents, rapports et preuves attendues."),
  group("review", 18, "Contrôles et revue", "Décisions humaines et traitement des points en attente."),
];

const DISPLAY_CONDITIONS = {
  Q_ADVISER_IMPORTANT_CLAUSES: {
    questionId: "Q_EXTERNAL_ADVISER_PAID_BY_FUND",
    operator: "EQUALS",
    value: "true",
  },
  Q_ADVISER_OTHER_ACTIVITIES: {
    questionId: "Q_EXTERNAL_ADVISER_PAID_BY_FUND",
    operator: "EQUALS",
    value: "true",
  },
};

const [registryRaw, ...matrixContents] = await Promise.all([
  readFile(path.join(repoRoot, registryFile), "utf8"),
  ...matrixFiles.map((file) => readFile(path.join(repoRoot, file), "utf8")),
]);

const registry = parseRequirementRegistry(registryRaw);
const matrixRows = matrixContents.flatMap((content, index) =>
  parseDelimited(content).map((row) => ({ ...row, source_matrix: matrixFiles[index] })),
);

assertUnique(matrixRows, "requirement_id");
assertUnique(matrixRows, "question_id");
assertEqualSets(
  new Set(matrixRows.map((row) => row.requirement_id)),
  new Set(registry.requirements.keys()),
  "Les exigences des matrices et du registre YAML doivent être identiques.",
);
if (matrixRows.length !== 62) {
  throw new Error(`Le catalogue CIRC005 doit contenir 62 exigences, reçu: ${matrixRows.length}`);
}

const requirements = matrixRows
  .map((row) => buildRequirement(row, registry.requirements.get(row.requirement_id)))
  .toSorted((left, right) => left.registrySequence - right.registrySequence);

const groupIds = new Set(requirements.map((requirement) => requirement.groupId));
const groups = GROUP_DEFINITIONS.filter((definition) => groupIds.has(definition.id)).map((definition) => ({
  ...definition,
  regulatoryRequirementCount: requirements.filter((requirement) => requirement.groupId === definition.id).length,
  interactiveQuestionCount: requirements.filter(
    (requirement) => requirement.groupId === definition.id && requirement.interactive,
  ).length,
}));

const sourceFiles = [
  {
    path: registryFile,
    sha256: sha256(registryRaw),
    requirementCount: registry.requirements.size,
  },
  ...matrixContents.map((content, index) => ({
    path: matrixFiles[index],
    sha256: sha256(content),
    rowCount: parseDelimited(content).length,
  })),
];

const digestInput = JSON.stringify({
  registryVersion: registry.metadata.registry_version,
  sourceFiles,
  requirements,
});
const catalogDigest = sha256(digestInput);
const systemMetadataRequirementCount = requirements.filter(
  (requirement) => requirement.defaultCoverageStatus === "SYSTEM_METADATA",
).length;

const catalog = {
  schemaVersion: "1.0.0",
  generatedBy: "scripts/generate-web-regulatory-catalog.mjs",
  doNotEdit: true,
  rulePack: "UMOA_FCP_CIRC005",
  sourceId: registry.metadata.source_id,
  registryVersion: registry.metadata.registry_version,
  registryStatus: registry.metadata.status,
  scope: registry.metadata.scope,
  catalogDigest,
  requirementCount: requirements.length,
  interactiveQuestionCount: requirements.filter((requirement) => requirement.interactive).length,
  systemQuestionCount: requirements.filter((requirement) => !requirement.interactive).length,
  systemMetadataRequirementCount,
  sourceFiles,
  groups,
  requirements,
};

const validation = {
  validationId: "CIRC005_WEB_CATALOG_VALIDATION_V1",
  status: "PASS",
  catalogDigest,
  requirementCount: catalog.requirementCount,
  uniqueRequirementIdCount: new Set(requirements.map((item) => item.requirementId)).size,
  uniqueQuestionIdCount: new Set(requirements.map((item) => item.questionId)).size,
  interactiveQuestionCount: catalog.interactiveQuestionCount,
  systemQuestionCount: catalog.systemQuestionCount,
  groupCount: groups.length,
  matrixFiles: sourceFiles.filter((item) => item.path.endsWith(".csv")),
  registryFile: sourceFiles.find((item) => item.path.endsWith(".yaml")),
  invariants: {
    matrixAndRegistrySetsEqual: true,
    requirementCountIs62: true,
    noDuplicateRequirementIds: true,
    noDuplicateQuestionIds: true,
    everyRequirementHasCanonicalFields: requirements.every((item) => item.canonicalFieldPaths.length > 0),
    everyRequirementHasReviewRoles: requirements.every((item) => item.reviewRoles.length > 0),
    everyRequirementHasSourceReference: requirements.every((item) => Boolean(item.sourceReference)),
  },
  caveat:
    "La transformation est structurelle et déterministe. Elle ne constitue ni une validation juridique, ni une approbation réglementaire.",
};

await Promise.all([
  writeJson(path.join(repoRoot, outputFile), catalog),
  writeJson(path.join(repoRoot, validationFile), validation),
]);

console.log(
  JSON.stringify(
    {
      output: outputFile,
      validation: validationFile,
      catalogDigest,
      requirementCount: catalog.requirementCount,
      interactiveQuestionCount: catalog.interactiveQuestionCount,
      systemQuestionCount: catalog.systemQuestionCount,
      groupCount: groups.length,
    },
    null,
    2,
  ),
);

function buildRequirement(row, registryEntry) {
  if (!registryEntry) throw new Error(`Exigence absente du registre: ${row.requirement_id}`);
  const options = parseOptions(row.options);
  const ui = mapQuestionType(row.question_type, options);
  const effects = splitPipe(row.effects);
  const controls = splitPipe(row.controls);
  const evidenceTypes = splitPipe(row.evidence_types);
  const canonicalFieldPaths = splitPipe(row.canonical_fields);
  const groupId = deriveGroupId(row.requirement_id);
  const sourceReference = registryEntry.ref ?? "Référence réglementaire à confirmer";
  const helpParts = [
    `Source: ${sourceReference}.`,
    evidenceTypes.length > 0 ? `Preuves attendues: ${evidenceTypes.join(", ")}.` : null,
    controls.length > 0 ? `Contrôles: ${controls.join(", ")}.` : null,
    ui.uiFallback
      ? `Composant spécialisé non encore disponible: saisie structurée provisoire pour ${row.question_type}.`
      : null,
  ].filter(Boolean);

  return {
    requirementId: row.requirement_id,
    questionId: row.question_id,
    groupId,
    registrySequence: registryEntry.seq ?? 999999,
    label: row.question_label,
    helpText: helpParts.join(" "),
    originalQuestionType: row.question_type,
    uiType: ui.uiType,
    uiFallback: ui.uiFallback,
    interactive: ui.interactive,
    required: ui.interactive,
    canonicalFieldPaths,
    options,
    effects,
    conditionHints: effects.filter((effect) => /^(IF_|ASK_|REQUIRE_)/.test(effect)),
    displayCondition: DISPLAY_CONDITIONS[row.question_id] ?? null,
    clauseGroupId: row.clause_group_id || null,
    controls,
    evidenceTypes,
    outputSectionId: row.output_section_id || null,
    reviewRoles: splitPipe(row.review_roles),
    implementationStatus: row.status,
    sourceMatrix: row.source_matrix,
    sourceReference,
    applicability: registryEntry.applicability ?? null,
    registryReviewStatus: registryEntry.review_status ?? registry.metadata.default_review_status ?? "PENDING",
    defaultCoverageStatus:
      Array.isArray(registryEntry.coverage) && registryEntry.coverage.length === 1
        ? registryEntry.coverage[0]
        : "PENDING_REVIEW",
  };
}

function deriveGroupId(requirementId) {
  if (requirementId.startsWith("CIRC005_GENERAL_")) return "project";
  if (requirementId.includes("_SGO_")) return "manager";
  if (requirementId.includes("TAX") || requirementId.includes("WITHHOLDING")) return "tax";
  if (
    requirementId.includes("DEPOSITARY") ||
    requirementId.includes("ADVISER") ||
    requirementId.includes("ACCOUNTING_CONTROL")
  ) {
    return "actors";
  }
  if (
    requirementId.includes("REGULATION_AVAILABILITY") ||
    requirementId.includes("PERIODIC_REPORTS_AVAILABILITY")
  ) {
    return "evidence";
  }
  if (
    requirementId.includes("PARTS_") ||
    requirementId.includes("PART_") ||
    requirementId.includes("LISTING_TRADING")
  ) {
    return "shares";
  }
  if (
    requirementId.includes("ISSUE_SALE") ||
    requirementId.includes("REDEMPTION") ||
    requirementId.includes("SUSPENSION")
  ) {
    return "subscriptions";
  }
  if (
    requirementId.includes("INCOME") ||
    requirementId.includes("ACCOUNT_CLOSING") ||
    requirementId.includes("DISTRIBUTION_DATES")
  ) {
    return "income";
  }
  if (
    requirementId.includes("INVESTMENT_OBJECTIVES_POLICY") ||
    requirementId.includes("FINANCIAL_OBJECTIVES") ||
    requirementId.includes("TARGET_INVESTOR")
  ) {
    return "objective";
  }
  if (
    requirementId.includes("PLACEMENT_POLICY") ||
    requirementId.includes("GEOGRAPHIC_SECTOR") ||
    requirementId.includes("POLICY_LIMITS") ||
    requirementId.includes("TECHNIQUES_INSTRUMENTS") ||
    requirementId.includes("BORROWING_CAPACITY")
  ) {
    return "portfolio";
  }
  if (requirementId.includes("VALUATION")) return "valuation";
  if (
    requirementId.includes("PRICE_DETERMINATION") ||
    requirementId.includes("PRICE_METHOD_FREQUENCY") ||
    requirementId.includes("PRICE_PUBLICATION")
  ) {
    return "nav";
  }
  if (
    requirementId.includes("TRANSACTION_FEES") ||
    requirementId.includes("REMUNERATION") ||
    requirementId.includes("EXPENSE")
  ) {
    return "fees";
  }
  if (
    requirementId.includes("HOME_STATE") ||
    requirementId.includes("MARKETING_STATE") ||
    requirementId.includes("CROSS_BORDER")
  ) {
    return "distribution";
  }
  if (requirementId.includes("PERFORMANCE")) return "performance";
  return "fund";
}

function mapQuestionType(originalType, options) {
  if (originalType === "SYSTEM" || originalType === "WIZARD_GROUP") {
    return { uiType: "TEXT", interactive: false, uiFallback: false };
  }
  if (originalType === "DATE" || originalType === "DATE_CONFIRMATION") {
    return { uiType: "DATE", interactive: true, uiFallback: originalType !== "DATE" };
  }
  if (originalType === "MONEY_CONFIRMATION") {
    return { uiType: "AMOUNT", interactive: true, uiFallback: true };
  }
  if (originalType === "SINGLE_CHOICE") {
    const booleanValues = new Set(options.map((option) => option.value));
    if (booleanValues.size === 2 && booleanValues.has("true") && booleanValues.has("false")) {
      return { uiType: "BOOLEAN", interactive: true, uiFallback: false };
    }
    return { uiType: options.length > 0 ? "SELECT" : "TEXT", interactive: true, uiFallback: false };
  }
  if (["MULTI_CHOICE", "COUNTRY_MULTI_SELECT"].includes(originalType)) {
    return {
      uiType: options.length > 0 ? "MULTISELECT" : "TEXTAREA",
      interactive: true,
      uiFallback: options.length === 0,
    };
  }
  if (originalType === "TEXT") return { uiType: "TEXT", interactive: true, uiFallback: false };
  if (originalType === "MONTH_DAY") return { uiType: "TEXT", interactive: true, uiFallback: true };
  if (originalType.includes("REFERENCE") && options.length > 0) {
    return { uiType: "SELECT", interactive: true, uiFallback: true };
  }
  if (originalType.includes("MULTI") && options.length > 0) {
    return { uiType: "MULTISELECT", interactive: true, uiFallback: true };
  }
  return { uiType: "TEXTAREA", interactive: true, uiFallback: true };
}

function parseRequirementRegistry(raw) {
  const metadata = {};
  const requirements = new Map();
  let current = null;
  let inRequirements = false;

  for (const rawLine of raw.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (line === "requirements:") {
      inRequirements = true;
      continue;
    }
    if (!inRequirements) {
      const match = line.match(/^([a-z_]+):\s*(.+)$/i);
      if (match) metadata[match[1]] = parseScalar(match[2]);
      if (line.trim() === "review_status: PENDING") metadata.default_review_status = "PENDING";
      continue;
    }
    const idMatch = line.match(/^- id:\s*(.+)$/);
    if (idMatch) {
      current = { id: idMatch[1].trim() };
      requirements.set(current.id, current);
      continue;
    }
    if (!current) continue;
    const property = line.match(/^\s{2}(seq|ref|applicability|review_status|coverage):\s*(.+)$/);
    if (property) current[property[1]] = parseScalar(property[2]);
  }

  return { metadata, requirements };
}

function parseDelimited(raw) {
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const headers = parseDelimitedLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const values = parseDelimitedLine(line);
    if (values.length !== headers.length) {
      throw new Error(`CSV invalide à la ligne ${index + 2}: ${values.length}/${headers.length} colonnes.`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
}

function parseDelimitedLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ";" && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

function parseOptions(raw) {
  return splitPipe(raw).map((item) => {
    const separator = item.indexOf("::");
    return separator === -1
      ? { value: item, label: item }
      : { value: item.slice(0, separator), label: item.slice(separator + 2) };
  });
}

function splitPipe(value) {
  if (!value) return [];
  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseScalar(value) {
  const trimmed = String(value).trim();
  if (/^\[.*\]$/.test(trimmed)) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function assertUnique(rows, property) {
  const seen = new Set();
  const duplicates = new Set();
  for (const row of rows) {
    const value = row[property];
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  if (duplicates.size > 0) {
    throw new Error(`Doublons ${property}: ${[...duplicates].join(", ")}`);
  }
}

function assertEqualSets(left, right, message) {
  const missingLeft = [...right].filter((value) => !left.has(value));
  const missingRight = [...left].filter((value) => !right.has(value));
  if (missingLeft.length > 0 || missingRight.length > 0) {
    throw new Error(`${message} Registre seulement: ${missingLeft.join(", ")}; matrices seulement: ${missingRight.join(", ")}`);
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function group(id, sequence, title, description) {
  return { id, sequence, title, description, sourceKind: "REGULATORY_MATRIX" };
}
