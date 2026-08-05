import { getAtPath } from "./object-path.js";

const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_.\[\]-]+)\s*}}/g;

/**
 * Rend une clause paramétrique. Les valeurs absentes restent visibles comme données à compléter.
 *
 * @param {string} wording
 * @param {Record<string, unknown>} data
 * @param {{allowMissing?: boolean}} [options]
 */
export function renderClause(wording, data, options = {}) {
  const missing = [];
  const text = wording.replace(VARIABLE_PATTERN, (_, path) => {
    const value = getAtPath(data, path);
    if (value === undefined || value === null || value === "") {
      missing.push(path);
      if (options.allowMissing === false) {
        throw new Error(`Variable de clause absente : ${path}`);
      }
      return `[À COMPLÉTER : ${path}]`;
    }
    return formatValue(value);
  });

  return { text, missing_variables: [...new Set(missing)] };
}

/** @param {unknown} value */
function formatValue(value) {
  if (typeof value === "boolean") return value ? "oui" : "non";
  if (typeof value === "number") return new Intl.NumberFormat("fr-FR").format(value);
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  return String(value);
}
