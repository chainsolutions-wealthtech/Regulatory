import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MATRIX_FILES = [
  "CIRC005_FCP_MATRIX_01_GENERAL_IDENTITY_TAX.csv",
  "CIRC005_FCP_MATRIX_02_PARTS_OPERATIONS.csv",
  "CIRC005_FCP_MATRIX_03_INVESTMENT_PRICING.csv",
  "CIRC005_FCP_MATRIX_04_ACTORS_COUNTRY_OTHER.csv",
];

/**
 * Charge les quatre matrices CIRC005 déjà présentes dans le dépôt.
 * Aucun identifiant réglementaire n'est recréé dans le code.
 *
 * @param {string} [repoRoot]
 */
export async function loadCirc005Matrix(repoRoot = resolveRepoRoot()) {
  const matrixDirectory = path.join(repoRoot, "regulatory", "matrices");
  const rows = [];

  for (const filename of MATRIX_FILES) {
    const content = await readFile(path.join(matrixDirectory, filename), "utf8");
    rows.push(...parseSemicolonCsv(content, filename));
  }

  assertUnique(rows, "requirement_id");
  assertUnique(rows.filter((row) => row.question_id), "question_id");
  return rows;
}

/**
 * @param {string} content
 * @param {string} filename
 */
export function parseSemicolonCsv(content, filename = "matrix.csv") {
  const lines = content.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error(`Matrice vide ou invalide : ${filename}`);
  }

  const headers = lines[0].split(";").map((value) => value.trim());
  return lines.slice(1).filter(Boolean).map((line, index) => {
    const columns = line.split(";");
    if (columns.length !== headers.length) {
      throw new Error(
        `Nombre de colonnes invalide dans ${filename}, ligne ${index + 2}: ` +
          `${columns.length} au lieu de ${headers.length}.`,
      );
    }

    const raw = Object.fromEntries(headers.map((header, columnIndex) => [header, columns[columnIndex].trim()]));
    return {
      ...raw,
      canonical_fields: splitPipe(raw.canonical_fields),
      options: parseOptions(raw.options),
      effects: splitPipe(raw.effects),
      controls: splitPipe(raw.controls),
      evidence_types: splitPipe(raw.evidence_types),
      review_roles: splitPipe(raw.review_roles),
      matrix_file: filename,
      matrix_line: index + 2,
    };
  });
}

/** @param {string} value */
function splitPipe(value) {
  return value ? value.split("|").map((item) => item.trim()).filter(Boolean) : [];
}

/** @param {string} value */
function parseOptions(value) {
  return splitPipe(value).map((option) => {
    const separatorIndex = option.indexOf("::");
    if (separatorIndex < 0) {
      return { value: option, label: option };
    }
    return {
      value: option.slice(0, separatorIndex),
      label: option.slice(separatorIndex + 2),
    };
  });
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} key
 */
function assertUnique(rows, key) {
  const values = new Set();
  for (const row of rows) {
    const value = row[key];
    if (!value) continue;
    if (values.has(value)) {
      throw new Error(`Identifiant dupliqué dans les matrices : ${String(value)}`);
    }
    values.add(value);
  }
}

function resolveRepoRoot() {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "..", "..");
}
