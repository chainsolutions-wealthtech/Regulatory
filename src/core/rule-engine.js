import { RULES, RULE_CATALOG_VERSION } from "../catalog/rules.js";

/**
 * Exécute les règles déterministes de la tranche verticale.
 *
 * @param {Record<string, unknown>} data
 */
export function runValidation(data) {
  const findings = RULES.flatMap((rule) => rule.evaluate(data));
  const counts = {
    INFO: findings.filter((item) => item.severity === "INFO").length,
    WARNING: findings.filter((item) => item.severity === "WARNING").length,
    BLOCKER: findings.filter((item) => item.severity === "BLOCKER").length,
  };

  return {
    rule_catalog_version: RULE_CATALOG_VERSION,
    status: counts.BLOCKER > 0 ? "VALIDATION_FAILED" : counts.WARNING > 0 ? "PASSED_WITH_WARNINGS" : "PASSED",
    counts,
    findings,
    ready_for_compliance_review: counts.BLOCKER === 0,
    ready_for_submission: false,
  };
}
