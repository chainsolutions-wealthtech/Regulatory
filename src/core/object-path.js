/**
 * Lit une valeur à partir d'un chemin canonique pointé.
 * Les chemins avec [] sont normalisés vers le nom de collection.
 *
 * @param {unknown} source
 * @param {string} path
 * @returns {unknown}
 */
export function getAtPath(source, path) {
  const tokens = normalizePath(path).split(".").filter(Boolean);
  let cursor = source;

  for (const token of tokens) {
    if (cursor == null || typeof cursor !== "object") {
      return undefined;
    }
    cursor = cursor[token];
  }

  return cursor;
}

/**
 * Écrit une valeur à partir d'un chemin canonique pointé.
 *
 * @param {Record<string, unknown>} target
 * @param {string} path
 * @param {unknown} value
 */
export function setAtPath(target, path, value) {
  const tokens = normalizePath(path).split(".").filter(Boolean);
  if (tokens.length === 0) {
    throw new Error("Le chemin canonique ne peut pas être vide.");
  }

  let cursor = target;
  for (const token of tokens.slice(0, -1)) {
    const existing = cursor[token];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      cursor[token] = {};
    }
    cursor = /** @type {Record<string, unknown>} */ (cursor[token]);
  }

  cursor[tokens.at(-1)] = structuredClone(value);
}

/**
 * Fusionne récursivement des objets sans muter les entrées.
 * Les tableaux sont remplacés intégralement afin d'éviter les doublons implicites.
 *
 * @param {Record<string, unknown>} base
 * @param {Record<string, unknown>} patch
 * @returns {Record<string, unknown>}
 */
export function deepMerge(base, patch) {
  const result = structuredClone(base);

  for (const [key, value] of Object.entries(patch)) {
    const current = result[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      result[key] = deepMerge(
        /** @type {Record<string, unknown>} */ (current),
        /** @type {Record<string, unknown>} */ (value),
      );
    } else {
      result[key] = structuredClone(value);
    }
  }

  return result;
}

/** @param {string} path */
export function normalizePath(path) {
  return path.replaceAll("[]", "").trim();
}
