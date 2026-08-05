import { getAtPath } from "../core/object-path.js";

export const RULE_CATALOG_VERSION = "0.1.0";

export const RULES = [
  requiredRule({ rule_id: "RULE_FUND_NAME_REQUIRED", path: "fund.legal_name", severity: "BLOCKER", requirement_ids: ["CIRC005_1_1_FCP_DENOMINATION"], message: "La dénomination officielle du fonds est obligatoire." }),
  requiredRule({ rule_id: "RULE_MANAGER_REQUIRED", path: "manager.legal_name", severity: "BLOCKER", requirement_ids: ["CIRC005_1_1_SGO_IDENTITY"], message: "La société de gestion doit être identifiée." }),
  requiredRule({ rule_id: "RULE_DEPOSITARY_REQUIRED", path: "depositary.legal_name", severity: "BLOCKER", requirement_ids: ["CIRC005_2_1_DEPOSITARY_IDENTITY"], message: "Le dépositaire doit être identifié." }),
  {
    rule_id: "RULE_AT_LEAST_ONE_SHARE_CLASS",
    severity: "BLOCKER",
    requirement_ids: ["CIRC005_1_10_FCP_PARTS_CHARACTERISTICS"],
    evaluate(data) {
      const classes = getAtPath(data, "share_classes");
      return Array.isArray(classes) && classes.length > 0 ? [] : [finding(this, "Le fonds doit comporter au moins une classe de parts.", ["share_classes"])];
    },
  },
  {
    rule_id: "RULE_SHARE_CLASS_CORE_FIELDS",
    severity: "BLOCKER",
    requirement_ids: ["CIRC005_1_10_FCP_PARTS_CHARACTERISTICS"],
    evaluate(data) {
      const classes = getAtPath(data, "share_classes");
      if (!Array.isArray(classes)) return [];
      const findings = [];
      classes.forEach((shareClass, index) => {
        for (const field of ["class_id", "currency", "income_policy", "initial_nav"]) {
          if (shareClass[field] === undefined || shareClass[field] === null || shareClass[field] === "") {
            findings.push(finding(this, `La classe ${index + 1} doit renseigner ${field}.`, [`share_classes.${index}.${field}`]));
          }
        }
      });
      return findings;
    },
  },
  {
    rule_id: "RULE_ASSET_RANGE_VALIDITY",
    severity: "BLOCKER",
    requirement_ids: ["CIRC005_1_15_D_FCP_POLICY_LIMITS"],
    evaluate(data) {
      const ranges = getAtPath(data, "investment.asset_ranges");
      if (!Array.isArray(ranges)) return [finding(this, "Les fourchettes d’exposition doivent être renseignées.", ["investment.asset_ranges"])];
      return ranges.flatMap((range, index) => {
        const minimum = range.minimum_percent;
        const maximum = range.maximum_percent;
        if (typeof minimum !== "number" || typeof maximum !== "number" || minimum < 0 || maximum > 100 || minimum > maximum) {
          return [finding(this, `Fourchette d’exposition invalide pour ${range.asset_class ?? `la ligne ${index + 1}`}.`, [`investment.asset_ranges.${index}`])];
        }
        return [];
      });
    },
  },
  {
    rule_id: "RULE_SUM_MINIMUMS_POSSIBLE",
    severity: "BLOCKER",
    requirement_ids: ["CIRC005_1_15_D_FCP_POLICY_LIMITS"],
    evaluate(data) {
      const ranges = getAtPath(data, "investment.asset_ranges");
      if (!Array.isArray(ranges)) return [];
      const total = ranges.reduce((sum, range) => sum + (Number(range.minimum_percent) || 0), 0);
      return total <= 100 ? [] : [finding(this, `La somme des expositions minimales atteint ${total} %, au-delà de 100 %.`, ["investment.asset_ranges"])];
    },
  },
  {
    rule_id: "RULE_REDEMPTION_PROCESS_COMPLETE",
    severity: "BLOCKER",
    requirement_ids: ["CIRC005_1_13_FCP_REDEMPTION_REIMBURSEMENT"],
    evaluate(data) {
      if (getAtPath(data, "redemption.allowed") !== true) return [];
      return missingFields(this, data, ["redemption.cutoff.display", "redemption.execution_nav.description", "redemption.settlement_days.standard_business_days"], "Le processus de rachat est incomplet.");
    },
  },
  {
    rule_id: "RULE_SUSPENSION_CIRCUMSTANCES_REQUIRED",
    severity: "BLOCKER",
    requirement_ids: ["CIRC005_1_13_FCP_SUSPENSION"],
    evaluate(data) {
      if (getAtPath(data, "redemption.suspension.allowed") !== true) return [];
      return missingFields(this, data, ["redemption.suspension.circumstances", "redemption.suspension.notification"], "Le cadre de suspension des rachats est incomplet.");
    },
  },
  {
    rule_id: "RULE_VALUATION_METHOD_PER_USED_ASSET",
    severity: "BLOCKER",
    requirement_ids: ["CIRC005_1_16_FCP_ASSET_VALUATION"],
    evaluate(data) {
      const usedAssets = (getAtPath(data, "investment.asset_ranges") ?? []).filter((range) => Number(range.maximum_percent) > 0).map((range) => range.asset_class);
      const methods = getAtPath(data, "valuation.methods") ?? [];
      const covered = new Set(methods.map((method) => method.asset_class));
      const missing = usedAssets.filter((assetClass) => !covered.has(assetClass));
      return missing.length === 0 ? [] : [finding(this, `Méthode de valorisation manquante pour : ${missing.join(", ")}.`, ["valuation.methods"])];
    },
  },
  {
    rule_id: "RULE_FEE_BASIS_BENEFICIARY_PAYER_COMPLETE",
    severity: "BLOCKER",
    requirement_ids: ["CIRC005_1_17_B_FCP_TRANSACTION_FEES", "CIRC005_1_18_A_FCP_REMUNERATION_MODE_AMOUNT_CALCULATION", "CIRC005_5_4_OTHER_EXPENSES_HOLDER", "CIRC005_5_4_OTHER_EXPENSES_FUND_ASSETS"],
    evaluate(data) {
      const fees = getAtPath(data, "fees");
      if (!Array.isArray(fees)) return [];
      const findings = [];
      fees.forEach((fee, index) => {
        for (const field of ["label", "payer_type", "beneficiary", "basis", "rate_type"]) {
          if (fee[field] === undefined || fee[field] === null || fee[field] === "") findings.push(finding(this, `Le frais ${index + 1} ne renseigne pas ${field}.`, [`fees.${index}.${field}`]));
        }
        if (fee.rate_type === "PERCENTAGE" && typeof fee.rate_percent !== "number") findings.push(finding(this, `Le frais ${index + 1} doit renseigner rate_percent.`, [`fees.${index}.rate_percent`]));
        if (fee.rate_type === "PER_MILLE" && typeof fee.rate_per_mille !== "number") findings.push(finding(this, `Le frais ${index + 1} doit renseigner rate_per_mille.`, [`fees.${index}.rate_per_mille`]));
      });
      return findings;
    },
  },
  {
    rule_id: "RULE_TAX_SOURCE_REQUIRED",
    severity: "WARNING",
    requirement_ids: ["CIRC005_1_5_FCP_TAX_REGIME", "CIRC005_1_5_FCP_WITHHOLDING_INCOME", "CIRC005_1_5_FCP_WITHHOLDING_CAPITAL_GAINS"],
    evaluate(data) {
      return getAtPath(data, "tax.source_reference") ? [] : [finding(this, "La fiscalité reste à confirmer à partir d’une source officielle ou d’une note fiscale validée.", ["tax.source_reference"], "Faire compléter et valider la section par le rôle TAX/LEGAL.")];
    },
  },
  {
    rule_id: "RULE_ECONOMIC_INFORMATION_REVIEW",
    severity: "WARNING",
    requirement_ids: ["CIRC005_5_3_ECONOMIC_INFORMATION"],
    evaluate(data) {
      return getAtPath(data, "economic_information.review_status") === "LEGAL_REVIEW_REQUIRED" ? [finding(this, "La rubrique « informations d’ordre économique » reste soumise à interprétation juridique.", ["economic_information"], "Définir le contenu après étude des textes complémentaires et revue juridique.")] : [];
    },
  },
];

function requiredRule(config) {
  return {
    rule_id: config.rule_id,
    severity: config.severity,
    requirement_ids: config.requirement_ids,
    evaluate(data) {
      const value = getAtPath(data, config.path);
      return value === undefined || value === null || value === "" ? [finding(this, config.message, [config.path])] : [];
    },
  };
}

function missingFields(rule, data, paths, message) {
  const missing = paths.filter((path) => {
    const value = getAtPath(data, path);
    return value === undefined || value === null || value === "";
  });
  return missing.length ? [finding(rule, `${message} Champs manquants : ${missing.join(", ")}.`, missing)] : [];
}

function finding(rule, message, fieldPaths, remediation = "Corriger les données sources puis relancer les contrôles.") {
  return { rule_id: rule.rule_id, severity: rule.severity, message, field_paths: fieldPaths, requirement_ids: rule.requirement_ids, remediation };
}
