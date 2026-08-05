import type {
  AssetClassRangeInput,
  CountryArrangementInput,
  EvidenceInput,
  FeeInput,
  PartyInput,
  RiskFactorInput,
  ShareClassInput,
  StructuredCollectionQuestionType,
  StructuredCollectionValue,
  ValuationMethodInput,
} from "@/domain/types";

export const SHARE_CLASS_QUESTION_ID = "Q_SHARE_CLASSES_COUNT";
export const ASSET_RANGE_QUESTION_ID = "Q_ASSET_EXPOSURE_MATRIX";
export const TRANSACTION_FEE_QUESTION_ID = "Q_TRANSACTION_FEES";
export const REMUNERATION_QUESTION_ID = "Q_REMUNERATION_DETAILS";
export const VALUATION_METHOD_QUESTION_ID = "Q_VALUATION_METHODS";
export const GOVERNANCE_PARTY_QUESTION_ID = "Q_CONFIRM_GOVERNANCE_MEMBERS";
export const SERVICE_PROVIDER_QUESTION_ID = "APP_SERVICE_PROVIDERS";
export const RISK_FACTOR_QUESTION_ID = "APP_RISK_FACTORS";
export const COUNTRY_ARRANGEMENT_QUESTION_ID = "Q_HOME_STATE_ARRANGEMENTS";
export const EVIDENCE_COLLECTION_QUESTION_ID = "APP_EVIDENCE_COLLECTION";

const MAX_ROWS = 50;
const MAX_SHARE_CLASSES = 20;

export type StructuredAnswerContext = {
  currency?: string;
  countryCode?: string;
};

export const STRUCTURED_QUESTION_TYPES: Record<string, StructuredCollectionQuestionType> = {
  [SHARE_CLASS_QUESTION_ID]: "SHARE_CLASS_COLLECTION",
  [ASSET_RANGE_QUESTION_ID]: "ASSET_RANGE_COLLECTION",
  [TRANSACTION_FEE_QUESTION_ID]: "FEE_COLLECTION",
  [REMUNERATION_QUESTION_ID]: "FEE_COLLECTION",
  [VALUATION_METHOD_QUESTION_ID]: "VALUATION_METHOD_COLLECTION",
  [GOVERNANCE_PARTY_QUESTION_ID]: "PARTY_COLLECTION",
  [SERVICE_PROVIDER_QUESTION_ID]: "PARTY_COLLECTION",
  [RISK_FACTOR_QUESTION_ID]: "RISK_COLLECTION",
  [COUNTRY_ARRANGEMENT_QUESTION_ID]: "COUNTRY_ARRANGEMENT_COLLECTION",
  [EVIDENCE_COLLECTION_QUESTION_ID]: "EVIDENCE_COLLECTION",
};

export function normalizeQuestionValueForPersistence(
  questionId: string,
  value: unknown,
  context: StructuredAnswerContext | string = {},
): unknown {
  const normalized = normalizeStructuredQuestionValue(questionId, value, context);
  validateStructuredQuestionValue(questionId, normalized);
  return normalized;
}

export function normalizeQuestionValueForSnapshot(
  questionId: string,
  value: unknown,
  context: StructuredAnswerContext | string = {},
): unknown {
  return normalizeStructuredQuestionValue(questionId, value, context);
}

export function normalizeStructuredQuestionValue(
  questionId: string,
  value: unknown,
  context: StructuredAnswerContext | string = {},
): unknown {
  const resolved = resolveContext(context);
  if (questionId === SHARE_CLASS_QUESTION_ID) return normalizeShareClasses(value, resolved.currency);
  if (questionId === ASSET_RANGE_QUESTION_ID) return normalizeAssetClassRanges(value);
  if ([TRANSACTION_FEE_QUESTION_ID, REMUNERATION_QUESTION_ID].includes(questionId)) {
    return normalizeFees(value, resolved.currency, questionId === REMUNERATION_QUESTION_ID);
  }
  if (questionId === VALUATION_METHOD_QUESTION_ID) return normalizeValuationMethods(value);
  if ([GOVERNANCE_PARTY_QUESTION_ID, SERVICE_PROVIDER_QUESTION_ID].includes(questionId)) {
    return normalizeParties(value, questionId === GOVERNANCE_PARTY_QUESTION_ID);
  }
  if (questionId === RISK_FACTOR_QUESTION_ID) return normalizeRiskFactors(value);
  if (questionId === COUNTRY_ARRANGEMENT_QUESTION_ID) {
    return normalizeCountryArrangements(value, resolved.countryCode);
  }
  if (questionId === EVIDENCE_COLLECTION_QUESTION_ID) return normalizeEvidence(value);
  return value;
}

export function validateStructuredQuestionValue(questionId: string, value: unknown): void {
  if (questionId === SHARE_CLASS_QUESTION_ID) return validateShareClasses(value as ShareClassInput[]);
  if (questionId === ASSET_RANGE_QUESTION_ID) {
    return validateAssetClassRanges(value as AssetClassRangeInput[]);
  }
  if ([TRANSACTION_FEE_QUESTION_ID, REMUNERATION_QUESTION_ID].includes(questionId)) {
    return validateFees(value as FeeInput[]);
  }
  if (questionId === VALUATION_METHOD_QUESTION_ID) {
    return validateValuationMethods(value as ValuationMethodInput[]);
  }
  if ([GOVERNANCE_PARTY_QUESTION_ID, SERVICE_PROVIDER_QUESTION_ID].includes(questionId)) {
    return validateParties(value as PartyInput[]);
  }
  if (questionId === RISK_FACTOR_QUESTION_ID) return validateRiskFactors(value as RiskFactorInput[]);
  if (questionId === COUNTRY_ARRANGEMENT_QUESTION_ID) {
    return validateCountryArrangements(value as CountryArrangementInput[]);
  }
  if (questionId === EVIDENCE_COLLECTION_QUESTION_ID) return validateEvidence(value as EvidenceInput[]);
}

export function applyStructuredAnswerToCanonicalData(
  questionId: string,
  canonicalData: Record<string, unknown>,
  value: unknown,
): boolean {
  const mappings: Record<string, string> = {
    [SHARE_CLASS_QUESTION_ID]: "share_classes",
    [ASSET_RANGE_QUESTION_ID]: "investment_policy.asset_class_ranges",
    [TRANSACTION_FEE_QUESTION_ID]: "fees.transaction",
    [REMUNERATION_QUESTION_ID]: "remunerations",
    [VALUATION_METHOD_QUESTION_ID]: "valuation.methods",
    [GOVERNANCE_PARTY_QUESTION_ID]: "manager.governance_members",
    [SERVICE_PROVIDER_QUESTION_ID]: "service_providers",
    [RISK_FACTOR_QUESTION_ID]: "risks",
    [COUNTRY_ARRANGEMENT_QUESTION_ID]: "distribution_countries",
    [EVIDENCE_COLLECTION_QUESTION_ID]: "evidence",
  };
  const path = mappings[questionId];
  if (!path) return false;
  setPath(canonicalData, path, value);
  return true;
}

export function createDefaultStructuredRow(
  type: StructuredCollectionQuestionType,
  index: number,
  context: StructuredAnswerContext = {},
): StructuredCollectionValue[number] {
  if (type === "SHARE_CLASS_COLLECTION") {
    return createDefaultShareClass(index, context.currency);
  }
  if (type === "ASSET_RANGE_COLLECTION") return createDefaultAssetClassRange(index);
  if (type === "FEE_COLLECTION") return createDefaultFee(index, context.currency);
  if (type === "VALUATION_METHOD_COLLECTION") return createDefaultValuationMethod(index);
  if (type === "PARTY_COLLECTION") return createDefaultParty(index);
  if (type === "RISK_COLLECTION") return createDefaultRiskFactor(index);
  if (type === "COUNTRY_ARRANGEMENT_COLLECTION") {
    return createDefaultCountryArrangement(index, context.countryCode);
  }
  return createDefaultEvidence(index);
}

export function normalizeShareClasses(
  value: unknown,
  defaultCurrency = "XOF",
): ShareClassInput[] {
  const parsed = parseCollection(value);
  if (parsed) return parsed.map((item, index) => normalizeShareClass(item, index, defaultCurrency));
  const legacyMultiple = value === true || value === "true";
  const count = legacyMultiple ? 2 : 1;
  return Array.from({ length: count }, (_, index) => createDefaultShareClass(index, defaultCurrency));
}

export function createDefaultShareClass(index: number, defaultCurrency = "XOF"): ShareClassInput {
  return {
    class_id: stableId("CLASS", index),
    currency: normalizeCurrency(defaultCurrency),
    income_policy: "CAPITALIZED",
    initial_nav: 10_000,
    initial_subscription_minimum: { display: "À confirmer" },
    decimalization: { display: "Parts entières" },
  };
}

export function validateShareClasses(value: ShareClassInput[]): void {
  validateRowCount(value, "classe de parts", MAX_SHARE_CLASSES);
  const identifiers = new Set<string>();
  for (const [index, item] of value.entries()) {
    const position = index + 1;
    validateIdentifier(item.class_id, `Classe ${position}`, identifiers);
    if (!/^[A-Z]{3}$/.test(item.currency)) {
      throw new Error(`Classe ${position} : la devise doit être un code ISO à trois lettres.`);
    }
    if (!new Set(["CAPITALIZED", "DISTRIBUTED"]).has(item.income_policy)) {
      throw new Error(`Classe ${position} : la politique de revenus est invalide.`);
    }
    validatePositive(item.initial_nav, `Classe ${position} : la valeur liquidative d’origine`);
    requiredText(item.initial_subscription_minimum.display, `Classe ${position} : le minimum de souscription`);
    requiredText(item.decimalization.display, `Classe ${position} : la règle de décimalisation`);
  }
}

export function normalizeAssetClassRanges(value: unknown): AssetClassRangeInput[] {
  const parsed = parseCollection(value);
  if (!parsed) return [createDefaultAssetClassRange(0)];
  return parsed.map((item, index) => {
    const record = asRecord(item);
    return {
      range_id: normalizeIdentifier(record.range_id, "RANGE", index),
      asset_class: String(record.asset_class ?? "DEBT_AND_MONEY_MARKET").trim().toUpperCase(),
      minimum_percent: finiteNumber(record.minimum_percent, 0),
      target_percent: finiteNumber(record.target_percent, 50),
      maximum_percent: finiteNumber(record.maximum_percent, 100),
      review_status: normalizeReviewStatus(record.review_status),
    };
  });
}

export function createDefaultAssetClassRange(index: number): AssetClassRangeInput {
  return {
    range_id: stableId("RANGE", index),
    asset_class: index === 0 ? "DEBT_AND_MONEY_MARKET" : "OTHER",
    minimum_percent: 0,
    target_percent: 50,
    maximum_percent: 100,
    review_status: "UNREVIEWED",
  };
}

export function validateAssetClassRanges(value: AssetClassRangeInput[]): void {
  validateRowCount(value, "fourchette d’allocation");
  const identifiers = new Set<string>();
  const assetClasses = new Set<string>();
  let minimumTotal = 0;
  for (const [index, item] of value.entries()) {
    const label = `Fourchette ${index + 1}`;
    validateIdentifier(item.range_id, label, identifiers);
    requiredText(item.asset_class, `${label} : la classe d’actifs`);
    if (assetClasses.has(item.asset_class)) {
      throw new Error(`${label} : la classe d’actifs ${item.asset_class} est déjà utilisée.`);
    }
    assetClasses.add(item.asset_class);
    validatePercentage(item.minimum_percent, `${label} : le minimum`);
    validatePercentage(item.target_percent, `${label} : la cible`);
    validatePercentage(item.maximum_percent, `${label} : le maximum`);
    if (!(item.minimum_percent <= item.target_percent && item.target_percent <= item.maximum_percent)) {
      throw new Error(`${label} : respecter minimum ≤ cible ≤ maximum.`);
    }
    minimumTotal += item.minimum_percent;
  }
  if (minimumTotal > 100) {
    throw new Error(`La somme des minima (${minimumTotal} %) ne peut pas dépasser 100 %.`);
  }
}

export function normalizeFees(
  value: unknown,
  defaultCurrency = "XOF",
  remuneration = false,
): FeeInput[] {
  const parsed = parseCollection(value);
  if (!parsed) return [createDefaultFee(0, defaultCurrency, remuneration)];
  return parsed.map((item, index) => {
    const record = asRecord(item);
    const rateType = normalizeFeeRateType(record.rate_type);
    return {
      fee_id: normalizeIdentifier(record.fee_id, remuneration ? "REMUNERATION" : "FEE", index),
      fee_type: normalizeFeeType(record.fee_type, remuneration),
      label: String(record.label ?? (remuneration ? "Rémunération" : "Frais")).trim(),
      payer_type: record.payer_type === "HOLDER" ? "HOLDER" : "FUND_ASSETS",
      beneficiary: String(record.beneficiary ?? "À confirmer").trim(),
      basis: String(record.basis ?? "À confirmer").trim(),
      rate_type: rateType,
      rate_percent: optionalFiniteNumber(record.rate_percent),
      rate_per_mille: optionalFiniteNumber(record.rate_per_mille),
      amount: optionalFiniteNumber(record.amount),
      currency: normalizeCurrency(String(record.currency ?? defaultCurrency)),
      frequency: String(record.frequency ?? "À confirmer").trim(),
      cap: optionalText(record.cap),
      tax_display: optionalText(record.tax_display),
      review_status: normalizeReviewStatus(record.review_status),
    };
  });
}

export function createDefaultFee(index: number, defaultCurrency = "XOF", remuneration = false): FeeInput {
  return {
    fee_id: stableId(remuneration ? "REMUNERATION" : "FEE", index),
    fee_type: remuneration ? "MANAGEMENT" : "SUBSCRIPTION",
    label: remuneration ? "Rémunération de gestion" : "Commission de souscription",
    payer_type: remuneration ? "FUND_ASSETS" : "HOLDER",
    beneficiary: "À confirmer",
    basis: "Actif net ou montant de l’opération — à confirmer",
    rate_type: "PERCENTAGE",
    rate_percent: 0,
    currency: normalizeCurrency(defaultCurrency),
    frequency: "À confirmer",
    review_status: "UNREVIEWED",
  };
}

export function validateFees(value: FeeInput[]): void {
  validateRowCount(value, "frais ou rémunération");
  const identifiers = new Set<string>();
  for (const [index, item] of value.entries()) {
    const label = `Ligne de frais ${index + 1}`;
    validateIdentifier(item.fee_id, label, identifiers);
    requiredText(item.label, `${label} : le libellé`);
    requiredText(item.beneficiary, `${label} : le bénéficiaire`);
    requiredText(item.basis, `${label} : l’assiette`);
    requiredText(item.frequency, `${label} : la périodicité`);
    if (item.rate_type === "PERCENTAGE") {
      validatePercentage(item.rate_percent, `${label} : le taux`);
    } else if (item.rate_type === "PER_MILLE") {
      const rate = item.rate_per_mille;
      if (rate === undefined || !Number.isFinite(rate) || rate < 0 || rate > 1000) {
        throw new Error(`${label} : le taux pour mille doit être compris entre 0 et 1 000.`);
      }
    } else if (item.rate_type === "FIXED") {
      validatePositive(item.amount, `${label} : le montant fixe`);
      if (!item.currency || !/^[A-Z]{3}$/.test(item.currency)) {
        throw new Error(`${label} : une devise ISO est obligatoire pour un montant fixe.`);
      }
    }
  }
}

export function normalizeValuationMethods(value: unknown): ValuationMethodInput[] {
  const parsed = parseCollection(value);
  if (!parsed) return [createDefaultValuationMethod(0)];
  return parsed.map((item, index) => {
    const record = asRecord(item);
    return {
      method_id: normalizeIdentifier(record.method_id, "VALUATION", index),
      asset_class: String(record.asset_class ?? "DEBT_AND_MONEY_MARKET").trim().toUpperCase(),
      primary_method: String(record.primary_method ?? "À confirmer").trim(),
      price_source: String(record.price_source ?? "À confirmer").trim(),
      fallback_method: String(record.fallback_method ?? "À confirmer").trim(),
      frequency: String(record.frequency ?? "À confirmer").trim(),
      exception_process: String(record.exception_process ?? "Escalade au comité de valorisation").trim(),
      review_status: normalizeReviewStatus(record.review_status),
    };
  });
}

export function createDefaultValuationMethod(index: number): ValuationMethodInput {
  return {
    method_id: stableId("VALUATION", index),
    asset_class: "DEBT_AND_MONEY_MARKET",
    primary_method: "Cours de marché ou valorisation selon la politique approuvée — à confirmer",
    price_source: "Source indépendante à confirmer",
    fallback_method: "Méthode alternative documentée à confirmer",
    frequency: "À chaque calcul de VL",
    exception_process: "Escalade au comité de valorisation et traçabilité de la décision",
    review_status: "UNREVIEWED",
  };
}

export function validateValuationMethods(value: ValuationMethodInput[]): void {
  validateRowCount(value, "méthode de valorisation");
  const identifiers = new Set<string>();
  const assetClasses = new Set<string>();
  for (const [index, item] of value.entries()) {
    const label = `Méthode ${index + 1}`;
    validateIdentifier(item.method_id, label, identifiers);
    requiredText(item.asset_class, `${label} : la classe d’actifs`);
    if (assetClasses.has(item.asset_class)) {
      throw new Error(`${label} : une seule méthode principale doit être déclarée par classe d’actifs.`);
    }
    assetClasses.add(item.asset_class);
    requiredText(item.primary_method, `${label} : la méthode principale`);
    requiredText(item.price_source, `${label} : la source de prix`);
    requiredText(item.fallback_method, `${label} : la méthode de secours`);
    requiredText(item.frequency, `${label} : la fréquence`);
    requiredText(item.exception_process, `${label} : le processus d’exception`);
  }
}

export function normalizeParties(value: unknown, governanceOnly = false): PartyInput[] {
  const parsed = parseCollection(value);
  if (!parsed) return [createDefaultParty(0, governanceOnly ? "GOVERNANCE_MEMBER" : "DEPOSITARY")];
  return parsed.map((item, index) => {
    const record = asRecord(item);
    return {
      party_id: normalizeIdentifier(record.party_id, governanceOnly ? "GOV" : "PARTY", index),
      role: governanceOnly ? "GOVERNANCE_MEMBER" : normalizePartyRole(record.role),
      legal_name: String(record.legal_name ?? "").trim(),
      person_name: optionalText(record.person_name),
      legal_form: optionalText(record.legal_form),
      approval_number: optionalText(record.approval_number),
      registered_office: optionalText(record.registered_office),
      main_activity: optionalText(record.main_activity),
      function_title: optionalText(record.function_title),
      significant_external_activities: optionalText(record.significant_external_activities),
      conflicts: optionalText(record.conflicts),
      verification_status: normalizeVerificationStatus(record.verification_status),
    };
  });
}

export function createDefaultParty(
  index: number,
  role: PartyInput["role"] = "DEPOSITARY",
): PartyInput {
  return {
    party_id: stableId(role === "GOVERNANCE_MEMBER" ? "GOV" : "PARTY", index),
    role,
    legal_name: "",
    person_name: role === "GOVERNANCE_MEMBER" ? "À confirmer" : undefined,
    function_title: role === "GOVERNANCE_MEMBER" ? "À confirmer" : undefined,
    verification_status: "USER_PROVIDED_PENDING_REVIEW",
  };
}

export function validateParties(value: PartyInput[]): void {
  validateRowCount(value, "intervenant");
  const identifiers = new Set<string>();
  for (const [index, item] of value.entries()) {
    const label = `Intervenant ${index + 1}`;
    validateIdentifier(item.party_id, label, identifiers);
    if (item.role === "GOVERNANCE_MEMBER") {
      requiredText(item.person_name, `${label} : le nom de la personne`);
      requiredText(item.function_title, `${label} : la fonction`);
    } else {
      requiredText(item.legal_name, `${label} : la dénomination`);
    }
  }
}

export function normalizeRiskFactors(value: unknown): RiskFactorInput[] {
  const parsed = parseCollection(value);
  if (!parsed) return [createDefaultRiskFactor(0)];
  return parsed.map((item, index) => {
    const record = asRecord(item);
    return {
      risk_id: normalizeIdentifier(record.risk_id, "RISK", index),
      category: normalizeRiskCategory(record.category),
      label: String(record.label ?? "Risque à confirmer").trim(),
      description: String(record.description ?? "Description à confirmer").trim(),
      source: record.source === "DERIVED" || record.source === "REGULATORY_REFERENCE" ? record.source : "USER",
      review_status: normalizeReviewStatus(record.review_status),
    };
  });
}

export function createDefaultRiskFactor(index: number): RiskFactorInput {
  return {
    risk_id: stableId("RISK", index),
    category: "OTHER",
    label: "Risque spécifique à confirmer",
    description: "Décrire le mécanisme, les causes et les effets possibles pour le porteur.",
    source: "USER",
    review_status: "UNREVIEWED",
  };
}

export function validateRiskFactors(value: RiskFactorInput[]): void {
  validateRowCount(value, "facteur de risque");
  const identifiers = new Set<string>();
  for (const [index, item] of value.entries()) {
    const label = `Risque ${index + 1}`;
    validateIdentifier(item.risk_id, label, identifiers);
    requiredText(item.label, `${label} : le libellé`);
    requiredText(item.description, `${label} : la description`);
  }
}

export function normalizeCountryArrangements(
  value: unknown,
  defaultCountryCode = "CI",
): CountryArrangementInput[] {
  const parsed = parseCollection(value);
  if (!parsed) return [createDefaultCountryArrangement(0, defaultCountryCode)];
  return parsed.map((item, index) => {
    const record = asRecord(item);
    return {
      arrangement_id: normalizeIdentifier(record.arrangement_id, "COUNTRY", index),
      country_code: normalizeCountryCode(String(record.country_code ?? defaultCountryCode)),
      is_home_state: Boolean(record.is_home_state ?? index === 0),
      marketing_authorization_reference: String(record.marketing_authorization_reference ?? "À confirmer").trim(),
      paying_agents: String(record.paying_agents ?? "À confirmer").trim(),
      redemption_locations: String(record.redemption_locations ?? "À confirmer").trim(),
      information_locations: String(record.information_locations ?? "À confirmer").trim(),
      review_status: normalizeReviewStatus(record.review_status),
    };
  });
}

export function createDefaultCountryArrangement(
  index: number,
  defaultCountryCode = "CI",
): CountryArrangementInput {
  return {
    arrangement_id: stableId("COUNTRY", index),
    country_code: normalizeCountryCode(defaultCountryCode),
    is_home_state: index === 0,
    marketing_authorization_reference: "À confirmer",
    paying_agents: "À confirmer",
    redemption_locations: "À confirmer",
    information_locations: "À confirmer",
    review_status: "UNREVIEWED",
  };
}

export function validateCountryArrangements(value: CountryArrangementInput[]): void {
  validateRowCount(value, "dispositif pays");
  const identifiers = new Set<string>();
  const countries = new Set<string>();
  let homeStateCount = 0;
  for (const [index, item] of value.entries()) {
    const label = `Pays ${index + 1}`;
    validateIdentifier(item.arrangement_id, label, identifiers);
    if (!/^[A-Z]{2}$/.test(item.country_code)) {
      throw new Error(`${label} : le pays doit être un code ISO à deux lettres.`);
    }
    if (countries.has(item.country_code)) {
      throw new Error(`${label} : le pays ${item.country_code} est déjà présent.`);
    }
    countries.add(item.country_code);
    if (item.is_home_state) homeStateCount += 1;
    requiredText(item.paying_agents, `${label} : les agents payeurs`);
    requiredText(item.redemption_locations, `${label} : les lieux de rachat`);
    requiredText(item.information_locations, `${label} : les lieux d’information`);
  }
  if (homeStateCount !== 1) {
    throw new Error("Un et un seul pays doit être identifié comme État d’établissement.");
  }
}

export function normalizeEvidence(value: unknown): EvidenceInput[] {
  const parsed = parseCollection(value);
  if (!parsed) return [createDefaultEvidence(0)];
  return parsed.map((item, index) => {
    const record = asRecord(item);
    return {
      evidence_id: normalizeIdentifier(record.evidence_id, "EVIDENCE", index),
      evidence_type: normalizeEvidenceType(record.evidence_type),
      title: String(record.title ?? "Pièce justificative").trim(),
      reference: String(record.reference ?? "À confirmer").trim(),
      issuer: String(record.issuer ?? "À confirmer").trim(),
      issue_date: optionalText(record.issue_date),
      file_reference: String(record.file_reference ?? "À joindre").trim(),
      verification_status:
        record.verification_status === "VERIFIED" || record.verification_status === "REJECTED"
          ? record.verification_status
          : "PENDING",
    };
  });
}

export function createDefaultEvidence(index: number): EvidenceInput {
  return {
    evidence_id: stableId("EVIDENCE", index),
    evidence_type: "APPROVAL",
    title: "Agrément ou décision officielle",
    reference: "À confirmer",
    issuer: "AMF-UMOA ou autorité compétente — à confirmer",
    file_reference: "À joindre",
    verification_status: "PENDING",
  };
}

export function validateEvidence(value: EvidenceInput[]): void {
  validateRowCount(value, "pièce justificative");
  const identifiers = new Set<string>();
  for (const [index, item] of value.entries()) {
    const label = `Justificatif ${index + 1}`;
    validateIdentifier(item.evidence_id, label, identifiers);
    requiredText(item.title, `${label} : le titre`);
    requiredText(item.reference, `${label} : la référence`);
    requiredText(item.issuer, `${label} : l’émetteur`);
    requiredText(item.file_reference, `${label} : la référence du fichier`);
    if (item.issue_date && !/^\d{4}-\d{2}-\d{2}$/.test(item.issue_date)) {
      throw new Error(`${label} : la date doit respecter le format AAAA-MM-JJ.`);
    }
  }
}

function normalizeShareClass(value: unknown, index: number, defaultCurrency: string): ShareClassInput {
  const record = asRecord(value);
  const minimum = asRecord(record.initial_subscription_minimum);
  const decimalization = asRecord(record.decimalization);
  const incomePolicy = String(record.income_policy ?? "CAPITALIZED").toUpperCase();
  return {
    class_id: normalizeIdentifier(record.class_id, "CLASS", index),
    currency: normalizeCurrency(String(record.currency ?? defaultCurrency)),
    income_policy: incomePolicy === "DISTRIBUTED" ? "DISTRIBUTED" : "CAPITALIZED",
    initial_nav: finiteNumber(record.initial_nav, 10_000),
    initial_subscription_minimum: { display: String(minimum.display ?? "À confirmer").trim() },
    decimalization: { display: String(decimalization.display ?? "Parts entières").trim() },
  };
}

function parseCollection(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function resolveContext(context: StructuredAnswerContext | string): Required<StructuredAnswerContext> {
  return typeof context === "string"
    ? { currency: normalizeCurrency(context), countryCode: "CI" }
    : {
        currency: normalizeCurrency(context.currency ?? "XOF"),
        countryCode: normalizeCountryCode(context.countryCode ?? "CI"),
      };
}

function validateRowCount(value: unknown[], label: string, maximum = MAX_ROWS): void {
  if (!Array.isArray(value) || value.length < 1) {
    throw new Error(`Au moins une ligne « ${label} » est obligatoire.`);
  }
  if (value.length > maximum) {
    throw new Error(`La collection « ${label} » ne peut pas dépasser ${maximum} lignes.`);
  }
}

function validateIdentifier(value: string, label: string, seen: Set<string>): void {
  if (!/^[A-Z0-9][A-Z0-9_-]{0,47}$/.test(value)) {
    throw new Error(`${label} : l’identifiant doit contenir 1 à 48 caractères A-Z, 0-9, _ ou -.`);
  }
  if (seen.has(value)) throw new Error(`${label} : l’identifiant ${value} est déjà utilisé.`);
  seen.add(value);
}

function validatePercentage(value: number | undefined, label: string): void {
  if (value === undefined || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label} doit être compris entre 0 et 100.`);
  }
}

function validatePositive(value: number | undefined, label: string): void {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} doit être strictement positif.`);
  }
}

function requiredText(value: unknown, label: string): void {
  if (!String(value ?? "").trim()) throw new Error(`${label} doit être renseigné.`);
}

function stableId(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(2, "0")}`;
}

function normalizeIdentifier(value: unknown, prefix: string, index: number): string {
  const normalized = String(value ?? stableId(prefix, index)).trim().toUpperCase();
  return normalized || stableId(prefix, index);
}

function normalizeCurrency(value: string): string {
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "XOF";
}

function normalizeCountryCode(value: string): string {
  const country = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : "CI";
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalText(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function normalizeReviewStatus(value: unknown): "UNREVIEWED" | "PENDING_REVIEW" | "CONFIRMED" {
  return value === "CONFIRMED" || value === "PENDING_REVIEW" ? value : "UNREVIEWED";
}

function normalizeVerificationStatus(value: unknown): PartyInput["verification_status"] {
  if (value === "VERIFIED" || value === "PREFILLED_PENDING_CONFIRMATION") return value;
  return "USER_PROVIDED_PENDING_REVIEW";
}

function normalizeFeeRateType(value: unknown): FeeInput["rate_type"] {
  const normalized = String(value ?? "PERCENTAGE").toUpperCase();
  return new Set(["PERCENTAGE", "PER_MILLE", "FIXED", "NONE", "OTHER"]).has(normalized)
    ? (normalized as FeeInput["rate_type"])
    : "OTHER";
}

function normalizeFeeType(value: unknown, remuneration: boolean): FeeInput["fee_type"] {
  const normalized = String(value ?? (remuneration ? "MANAGEMENT" : "SUBSCRIPTION")).toUpperCase();
  return new Set([
    "SUBSCRIPTION",
    "REDEMPTION",
    "MANAGEMENT",
    "DEPOSITARY",
    "AUDIT",
    "DISTRIBUTION",
    "TRANSACTION",
    "OTHER",
  ]).has(normalized)
    ? (normalized as FeeInput["fee_type"])
    : "OTHER";
}

function normalizePartyRole(value: unknown): PartyInput["role"] {
  const normalized = String(value ?? "OTHER").toUpperCase();
  return new Set([
    "MANAGEMENT_COMPANY",
    "GOVERNANCE_MEMBER",
    "DEPOSITARY",
    "AUDITOR",
    "ACCOUNTING_CONTROL",
    "EXTERNAL_ADVISER",
    "DISTRIBUTOR",
    "PAYING_AGENT",
    "OTHER",
  ]).has(normalized)
    ? (normalized as PartyInput["role"])
    : "OTHER";
}

function normalizeRiskCategory(value: unknown): RiskFactorInput["category"] {
  const normalized = String(value ?? "OTHER").toUpperCase();
  return new Set([
    "CAPITAL_LOSS",
    "MARKET",
    "CREDIT",
    "INTEREST_RATE",
    "LIQUIDITY",
    "CURRENCY",
    "COUNTERPARTY",
    "OPERATIONAL",
    "CONCENTRATION",
    "VALUATION",
    "MANAGEMENT",
    "OTHER",
  ]).has(normalized)
    ? (normalized as RiskFactorInput["category"])
    : "OTHER";
}

function normalizeEvidenceType(value: unknown): EvidenceInput["evidence_type"] {
  const normalized = String(value ?? "OTHER").toUpperCase();
  return new Set([
    "APPROVAL",
    "RCCM",
    "STATUTES",
    "FUND_REGULATION",
    "SERVICE_AGREEMENT",
    "POLICY",
    "OFFICIAL_REGISTER",
    "FINANCIAL_STATEMENT",
    "LEGAL_MEMO",
    "TAX_MEMO",
    "OTHER",
  ]).has(normalized)
    ? (normalized as EvidenceInput["evidence_type"])
    : "OTHER";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function setPath(root: Record<string, unknown>, fieldPath: string, value: unknown): void {
  const segments = fieldPath.split(".").filter(Boolean);
  let cursor = root;
  for (const segment of segments.slice(0, -1)) {
    const current = cursor[segment];
    if (!current || typeof current !== "object" || Array.isArray(current)) cursor[segment] = {};
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[segments.at(-1)!] = value;
}