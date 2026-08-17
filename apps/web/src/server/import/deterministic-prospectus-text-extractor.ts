import type { ProspectusExtractionProposal } from "@/server/import/prospectus-import-service";

type TextExtractionInput = {
  text: string;
  page?: number;
};

type ExtractionRule = {
  fieldPath: string;
  confidence: number;
  match(line: string): string | null;
  normalize(value: string): unknown | null;
};

const RULES: ExtractionRule[] = [
  {
    fieldPath: "fund.legal_name",
    confidence: 0.92,
    match: (line) => capture(line, /^(?:D[ée]nomination(?: du Fonds)?|Nom du Fonds)\s*:\s*(.+)$/iu),
    normalize: normalizeShortText,
  },
  {
    fieldPath: "fund.legal_form",
    confidence: 0.95,
    match: (line) => capture(line, /^Forme juridique\s*:\s*(.+)$/iu),
    normalize: normalizeLegalForm,
  },
  {
    fieldPath: "fund.duration_type",
    confidence: 0.91,
    match: (line) => capture(line, /^Dur[ée]e\s*:\s*(.+)$/iu),
    normalize: normalizeDuration,
  },
  {
    fieldPath: "accounting.financial_year_end_display",
    confidence: 0.9,
    match: (line) =>
      capture(
        line,
        /^(?:Cl[oô]ture de l['’]exercice|Date de cl[oô]ture(?: de l['’]exercice)?)\s*:\s*(.+)$/iu,
      ),
    normalize: normalizeShortText,
  },
];

export function createDeterministicProspectusTextExtractor() {
  return {
    extractText(input: TextExtractionInput): ProspectusExtractionProposal[] {
      const lines = input.text
        .split(/\r?\n/u)
        .map((line) => line.replace(/\s+/gu, " ").trim())
        .filter(Boolean);

      const proposals: ProspectusExtractionProposal[] = [];
      for (const rule of RULES) {
        const candidates = new Map<string, { value: unknown; anchor: string }>();
        for (const line of lines) {
          const raw = rule.match(line);
          if (raw === null) continue;
          const value = rule.normalize(raw);
          if (value === null) continue;
          const key = stableValueKey(value);
          if (!candidates.has(key)) candidates.set(key, { value, anchor: line });
        }

        // A field is proposed only when the document yields one unambiguous normalized value.
        if (candidates.size !== 1) continue;
        const candidate = [...candidates.values()][0];
        proposals.push({
          proposedCanonicalFieldPath: rule.fieldPath,
          extractedValue: candidate.value,
          confidence: rule.confidence,
          sourceLocation: {
            ...(input.page === undefined ? {} : { page: input.page }),
            textAnchor: candidate.anchor,
          },
        });
      }
      return proposals;
    },
  };
}

function capture(line: string, pattern: RegExp): string | null {
  const match = pattern.exec(line);
  return match?.[1]?.trim() || null;
}

function normalizeShortText(value: string): string | null {
  const normalized = value.replace(/\s+/gu, " ").trim();
  if (!normalized || normalized.length > 180) return null;
  return normalized;
}

function normalizeLegalForm(value: string): "FCP" | "SICAV" | null {
  const normalized = value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toUpperCase();
  if (/\bFCP\b/u.test(normalized) || /FONDS COMMUN DE PLACEMENT/u.test(normalized)) return "FCP";
  if (/\bSICAV\b/u.test(normalized) || /SOCIETE D['’]?INVESTISSEMENT A CAPITAL VARIABLE/u.test(normalized)) {
    return "SICAV";
  }
  return null;
}

function normalizeDuration(value: string): "INDEFINITE" | "LIMITED" | null {
  const normalized = value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (/\b(indeterminee|illimitee|perpetuelle)\b/u.test(normalized)) return "INDEFINITE";
  if (/\b(determinee|limitee)\b/u.test(normalized)) return "LIMITED";
  return null;
}

function stableValueKey(value: unknown): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase("fr") : JSON.stringify(value);
}
