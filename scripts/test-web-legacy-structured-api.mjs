const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";

await waitForServer();

const create = await request("/api/projects", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "Legacy Structured API Compatibility Fund",
    category: "BOND",
    countryCode: "CI",
    operation: "CREATE",
    managementCompanyName: "Compatibility Test Management Company",
  }),
});
assertApiSuccess(create, 201, "La création du projet de compatibilité doit réussir");
const projectId = create.body.project.id;

const legacyAnswers = new Map([
  [
    "Q_SHARE_CLASSES_COUNT",
    [
      shareClass("CLASS-A", "XOF", "CAPITALIZED", 10_000),
      shareClass("CLASS-B", "XOF", "DISTRIBUTED", 20_000),
    ],
  ],
  [
    "Q_ASSET_EXPOSURE_MATRIX",
    [
      assetRange("RANGE-01", "GOVERNMENT_BONDS", 40, 60, 100),
      assetRange("RANGE-02", "CASH", 0, 10, 30),
    ],
  ],
  [
    "Q_TRANSACTION_FEES",
    [
      fee("FEE-SUBSCRIPTION", "SUBSCRIPTION", "Commission de souscription", "HOLDER", 1.5),
      fee("FEE-REDEMPTION", "REDEMPTION", "Commission de rachat", "HOLDER", 0),
    ],
  ],
  [
    "Q_REMUNERATION_DETAILS",
    [
      fee("REMUNERATION-MANAGEMENT", "MANAGEMENT", "Rémunération de gestion", "FUND_ASSETS", 1.2),
      fee("REMUNERATION-DEPOSITARY", "DEPOSITARY", "Rémunération du dépositaire", "FUND_ASSETS", 0.15),
    ],
  ],
  [
    "Q_VALUATION_METHODS",
    [
      valuation("VALUATION-01", "GOVERNMENT_BONDS", "Cours ou courbe de taux validée"),
      valuation("VALUATION-02", "CASH", "Valeur nominale augmentée des intérêts courus"),
    ],
  ],
  [
    "Q_CONFIRM_GOVERNANCE_MEMBERS",
    [
      governanceMember("GOV-01", "Awa Test", "Présidente du conseil"),
      governanceMember("GOV-02", "Koffi Test", "Directeur général"),
    ],
  ],
  [
    "APP_SERVICE_PROVIDERS",
    [
      party("PARTY-DEPOSITARY", "DEPOSITARY", "Banque Dépositaire Test"),
      party("PARTY-AUDITOR", "AUDITOR", "Cabinet Audit Test"),
    ],
  ],
  [
    "APP_RISK_FACTORS",
    [
      risk("RISK-CREDIT", "CREDIT", "Risque de crédit"),
      risk("RISK-LIQUIDITY", "LIQUIDITY", "Risque de liquidité"),
    ],
  ],
  [
    "Q_HOME_STATE_ARRANGEMENTS",
    [
      countryArrangement("COUNTRY-CI", "CI", true),
      countryArrangement("COUNTRY-SN", "SN", false),
    ],
  ],
  [
    "APP_EVIDENCE_COLLECTION",
    [
      evidenceItem("EVIDENCE-APPROVAL", "APPROVAL", "Agrément du fonds", "FCP/TEST/001"),
      evidenceItem("EVIDENCE-REGULATION", "FUND_REGULATION", "Règlement du fonds", "REG/TEST/001"),
    ],
  ],
]);

for (const [questionId, value] of legacyAnswers) {
  const saved = await saveAnswer(projectId, questionId, value);
  assertApiSuccess(saved, 200, `Le payload hérité ${questionId} doit rester accepté`);
}

const generated = await request(`/api/projects/${projectId}/generate`, { method: "POST" });
assertApiSuccess(generated, 200, "La génération après payloads hérités doit réussir");
assert(
  generated.body.generation.readyForSubmission === false,
  "La compatibilité descendante ne doit jamais lever le verrou de soumission.",
);

const canonical = generated.body.canonicalSnapshot?.canonicalData;
assertArray(canonical?.share_classes, 2, "share_classes");
assertArray(canonical?.investment_policy?.asset_class_ranges, 2, "investment_policy.asset_class_ranges");
assertArray(canonical?.fees?.transaction, 2, "fees.transaction");
assertArray(canonical?.remunerations, 2, "remunerations");
assertArray(canonical?.valuation?.methods, 2, "valuation.methods");
assertArray(canonical?.manager?.governance_members, 2, "manager.governance_members");
assertArray(canonical?.service_providers, 2, "service_providers");
assertArray(canonical?.risks, 2, "risks");
assertArray(canonical?.distribution_countries, 2, "distribution_countries");
assertArray(canonical?.evidence, 2, "evidence");

assert(
  canonical.share_classes.every((item) => typeof item.class_id === "string" && !Object.hasOwn(item, "row_id")),
  "Les payloads hérités doivent être migrés vers les identifiants canoniques avant persistance.",
);
assert(
  canonical.investment_policy.asset_class_ranges.every(
    (item) => typeof item.range_id === "string" && !Object.hasOwn(item, "row_id"),
  ),
  "Les fourchettes héritées doivent être normalisées vers le contrat canonique.",
);

console.log(
  JSON.stringify(
    {
      validationId: "LEGACY_STRUCTURED_ANSWER_API_COMPATIBILITY_V1",
      status: "PASS",
      projectId,
      legacyStructuredQuestionCount: legacyAnswers.size,
      canonicalCollectionsVerified: 10,
      readyForSubmission: generated.body.generation.readyForSubmission,
      caveat:
        "Test de compatibilité descendante HTTP. Il ne constitue ni une validation juridique, ni une validation réglementaire, ni une validation de production.",
    },
    null,
    2,
  ),
);

async function saveAnswer(projectId, questionId, value) {
  return request(`/api/projects/${projectId}/answers`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionId, value }),
  });
}

function shareClass(rowId, currency, distributionPolicy, minimumSubscription) {
  return {
    row_id: rowId,
    label: `Classe ${rowId}`,
    currency,
    distribution_policy: distributionPolicy,
    target_investor: "Investisseurs professionnels",
    minimum_subscription: minimumSubscription,
  };
}

function assetRange(rowId, assetClass, minPct, targetPct, maxPct) {
  return { row_id: rowId, asset_class: assetClass, min_pct: minPct, target_pct: targetPct, max_pct: maxPct };
}

function fee(rowId, feeType, label, chargedTo, ratePct) {
  return {
    row_id: rowId,
    fee_type: feeType,
    label,
    charged_to: chargedTo,
    calculation_basis: "Actif net",
    rate_pct: ratePct,
  };
}

function valuation(rowId, assetClass, method) {
  return {
    row_id: rowId,
    asset_class: assetClass,
    method,
    source_reference: "Source de test",
    fallback_method: "Expertise indépendante",
  };
}

function governanceMember(rowId, name, role) {
  return { row_id: rowId, party_type: "GOVERNANCE_MEMBER", name, role, country_code: "CI" };
}

function party(rowId, partyType, name) {
  return { row_id: rowId, party_type: partyType, name, country_code: "CI" };
}

function risk(rowId, riskType, label) {
  return {
    row_id: rowId,
    risk_type: riskType,
    label,
    description: `${label} — description structurée de test`,
    severity: "MEDIUM",
  };
}

function countryArrangement(rowId, countryCode, isHomeState) {
  return {
    row_id: rowId,
    country_code: countryCode,
    is_home_state: isHomeState,
    passport_status: isHomeState ? "HOME" : "NOTIFIED",
    notes: "Dispositif de test",
  };
}

function evidenceItem(rowId, evidenceType, title, reference) {
  return {
    row_id: rowId,
    evidence_type: evidenceType,
    title,
    reference,
    status: "AVAILABLE",
    source_date: "2026-08-05",
  };
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/regulatory/catalog`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Le serveur Next.js ne répond pas: ${String(lastError ?? "timeout")}`);
}

function assertApiSuccess(result, expectedStatus, message) {
  assert(
    result.response.status === expectedStatus,
    `${message}: HTTP ${result.response.status} — ${String(result.body?.error ?? JSON.stringify(result.body))}`,
  );
}

function assertArray(value, expectedLength, label) {
  assert(Array.isArray(value), `${label} doit être un tableau canonique.`);
  assert(value.length === expectedLength, `${label} doit contenir ${expectedLength} lignes.`);
}

function assert(condition, message = "Assertion failed") {
  if (!condition) throw new Error(message);
}
