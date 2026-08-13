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

const legacyCases = [
  {
    questionId: "Q_SHARE_CLASSES_COUNT",
    idKey: "class_id",
    legacyKey: "row_id",
    value: [
      shareClass("CLASS-A", "XOF", "CAPITALIZED", 10_000),
      shareClass("CLASS-B", "XOF", "DISTRIBUTED", 20_000),
    ],
  },
  {
    questionId: "Q_ASSET_EXPOSURE_MATRIX",
    idKey: "range_id",
    legacyKey: "row_id",
    value: [
      assetRange("RANGE-01", "GOVERNMENT_BONDS", 40, 60, 100),
      assetRange("RANGE-02", "CASH", 0, 10, 30),
    ],
  },
  {
    questionId: "Q_TRANSACTION_FEES",
    idKey: "fee_id",
    legacyKey: "row_id",
    value: [
      fee("FEE-SUBSCRIPTION", "SUBSCRIPTION", "Commission de souscription", "HOLDER", 1.5),
      fee("FEE-REDEMPTION", "REDEMPTION", "Commission de rachat", "HOLDER", 0),
    ],
  },
  {
    questionId: "Q_REMUNERATION_DETAILS",
    idKey: "fee_id",
    legacyKey: "row_id",
    value: [
      fee("REMUNERATION-MANAGEMENT", "MANAGEMENT", "Rémunération de gestion", "FUND_ASSETS", 1.2),
      fee("REMUNERATION-DEPOSITARY", "DEPOSITARY", "Rémunération du dépositaire", "FUND_ASSETS", 0.15),
    ],
  },
  {
    questionId: "Q_VALUATION_METHODS",
    idKey: "method_id",
    legacyKey: "row_id",
    value: [
      valuation("VALUATION-01", "GOVERNMENT_BONDS", "Cours ou courbe de taux validée"),
      valuation("VALUATION-02", "CASH", "Valeur nominale augmentée des intérêts courus"),
    ],
  },
  {
    questionId: "Q_CONFIRM_GOVERNANCE_MEMBERS",
    idKey: "party_id",
    legacyKey: "row_id",
    value: [
      governanceMember("GOV-01", "Awa Test", "Présidente du conseil"),
      governanceMember("GOV-02", "Koffi Test", "Directeur général"),
    ],
  },
  {
    questionId: "APP_SERVICE_PROVIDERS",
    idKey: "party_id",
    legacyKey: "row_id",
    value: [
      party("PARTY-DEPOSITARY", "DEPOSITARY", "Banque Dépositaire Test"),
      party("PARTY-AUDITOR", "AUDITOR", "Cabinet Audit Test"),
    ],
  },
  {
    questionId: "APP_RISK_FACTORS",
    idKey: "risk_id",
    legacyKey: "row_id",
    value: [
      risk("RISK-CREDIT", "CREDIT", "Risque de crédit"),
      risk("RISK-LIQUIDITY", "LIQUIDITY", "Risque de liquidité"),
    ],
  },
  {
    questionId: "Q_HOME_STATE_ARRANGEMENTS",
    idKey: "arrangement_id",
    legacyKey: "row_id",
    value: [
      countryArrangement("COUNTRY-CI", "CI", true),
      countryArrangement("COUNTRY-SN", "SN", false),
    ],
  },
  {
    questionId: "APP_EVIDENCE_COLLECTION",
    idKey: "evidence_id",
    legacyKey: "row_id",
    value: [
      evidenceItem("EVIDENCE-APPROVAL", "APPROVAL", "Agrément du fonds", "FCP/TEST/001"),
      evidenceItem("EVIDENCE-REGULATION", "FUND_REGULATION", "Règlement du fonds", "REG/TEST/001"),
    ],
  },
];

for (const legacyCase of legacyCases) {
  const saved = await saveAnswer(projectId, legacyCase.questionId, legacyCase.value);
  assertApiSuccess(saved, 200, `Le payload hérité ${legacyCase.questionId} doit rester accepté`);

  const persistedValue = saved.body.project?.answers?.[legacyCase.questionId]?.value;
  assert(Array.isArray(persistedValue), `${legacyCase.questionId} doit être persisté comme collection structurée.`);
  assert(
    persistedValue.length === legacyCase.value.length,
    `${legacyCase.questionId} doit conserver le nombre de lignes après normalisation.`,
  );
  assert(
    persistedValue.every(
      (entry) => entry && typeof entry === "object" && typeof entry[legacyCase.idKey] === "string",
    ),
    `${legacyCase.questionId} doit exposer l'identifiant canonique ${legacyCase.idKey}.`,
  );
  assert(
    persistedValue.every((entry) => !Object.hasOwn(entry, legacyCase.legacyKey)),
    `${legacyCase.questionId} ne doit pas persister l'alias hérité ${legacyCase.legacyKey}.`,
  );
}

console.log(
  JSON.stringify(
    {
      validationId: "LEGACY_STRUCTURED_ANSWER_API_COMPATIBILITY_V1",
      status: "PASS",
      projectId,
      legacyStructuredQuestionCount: legacyCases.length,
      canonicalPersistenceVerified: true,
      generationInvoked: false,
      caveat:
        "Validation HTTP ciblée de compatibilité descendante et de persistance canonique. Le pipeline de génération documentaire est contrôlé séparément afin qu'une défaillance PDF ne masque pas le contrat d'API.",
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

function assert(condition, message = "Assertion failed") {
  if (!condition) throw new Error(message);
}
