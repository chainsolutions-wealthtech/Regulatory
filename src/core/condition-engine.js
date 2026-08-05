import { getAtPath } from "./object-path.js";

/**
 * Évalue une condition de clause ou de composant.
 *
 * @param {any} condition
 * @param {Record<string, unknown>} data
 */
export function evaluateCondition(condition, data) {
  if (!condition) return true;
  if (condition.all) return condition.all.every((item) => evaluateCondition(item, data));
  if (condition.any) return condition.any.some((item) => evaluateCondition(item, data));
  if (condition.not) return !evaluateCondition(condition.not, data);

  const actual = getAtPath(data, condition.path);
  switch (condition.operator) {
    case "equals":
      return actual === condition.value;
    case "not_equals":
      return actual !== condition.value;
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";
    case "not_empty":
      return Array.isArray(actual) ? actual.length > 0 : Boolean(actual);
    case "includes":
      return Array.isArray(actual) && actual.includes(condition.value);
    case "greater_than":
      return typeof actual === "number" && actual > condition.value;
    default:
      throw new Error(`Opérateur conditionnel non pris en charge : ${condition.operator}`);
  }
}
