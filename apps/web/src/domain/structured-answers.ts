import type { ShareClassInput } from "@/domain/types";

export const SHARE_CLASS_QUESTION_ID = "Q_SHARE_CLASSES_COUNT";
const MAX_SHARE_CLASSES = 20;
const INCOME_POLICIES = new Set<ShareClassInput["income_policy"]>([
  "CAPITALIZED",
  "DISTRIBUTED",
]);

export function normalizeQuestionValueForPersistence(
  questionId: string,
  value: unknown,
  defaultCurrency = "XOF",
): unknown {
  if (questionId !== SHARE_CLASS_QUESTION_ID) return value;
  const classes = normalizeShareClasses(value, defaultCurrency);
  validateShareClasses(classes);
  return classes;
}

export function normalizeQuestionValueForSnapshot(
  questionId: string,
  value: unknown,
  defaultCurrency = "XOF",
): unknown {
  if (questionId !== SHARE_CLASS_QUESTION_ID) return value;
  return normalizeShareClasses(value, defaultCurrency);
}

export function normalizeShareClasses(
  value: unknown,
  defaultCurrency = "XOF",
): ShareClassInput[] {
  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeShareClass(item, index, defaultCurrency));
  }

  const legacyMultiple = value === true || value === "true";
  const count = legacyMultiple ? 2 : 1;
  return Array.from({ length: count }, (_, index) => createDefaultShareClass(index, defaultCurrency));
}

export function createDefaultShareClass(
  index: number,
  defaultCurrency = "XOF",
): ShareClassInput {
  return {
    class_id: classIdentifier(index),
    currency: normalizeCurrency(defaultCurrency),
    income_policy: "CAPITALIZED",
    initial_nav: 10_000,
    initial_subscription_minimum: {
      display: "À confirmer",
    },
    decimalization: {
      display: "Parts entières",
    },
  };
}

export function validateShareClasses(value: ShareClassInput[]): void {
  if (value.length < 1) throw new Error("Au moins une classe de parts est obligatoire.");
  if (value.length > MAX_SHARE_CLASSES) {
    throw new Error(`Le nombre de classes de parts ne peut pas dépasser ${MAX_SHARE_CLASSES}.`);
  }

  const identifiers = new Set<string>();
  for (const [index, item] of value.entries()) {
    const position = index + 1;
    if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(item.class_id)) {
      throw new Error(
        `Classe ${position} : l’identifiant doit contenir 1 à 32 caractères A-Z, 0-9, _ ou -.`,
      );
    }
    if (identifiers.has(item.class_id)) {
      throw new Error(`Classe ${position} : l’identifiant ${item.class_id} est déjà utilisé.`);
    }
    identifiers.add(item.class_id);

    if (!/^[A-Z]{3}$/.test(item.currency)) {
      throw new Error(`Classe ${position} : la devise doit être un code ISO à trois lettres.`);
    }
    if (!INCOME_POLICIES.has(item.income_policy)) {
      throw new Error(`Classe ${position} : la politique de revenus est invalide.`);
    }
    if (!Number.isFinite(item.initial_nav) || item.initial_nav <= 0) {
      throw new Error(`Classe ${position} : la valeur liquidative d’origine doit être positive.`);
    }
    if (!item.initial_subscription_minimum.display.trim()) {
      throw new Error(`Classe ${position} : le minimum de souscription doit être renseigné.`);
    }
    if (!item.decimalization.display.trim()) {
      throw new Error(`Classe ${position} : la règle de décimalisation doit être renseignée.`);
    }
  }
}

function normalizeShareClass(
  value: unknown,
  index: number,
  defaultCurrency: string,
): ShareClassInput {
  const record = isRecord(value) ? value : {};
  const minimum = isRecord(record.initial_subscription_minimum)
    ? record.initial_subscription_minimum
    : {};
  const decimalization = isRecord(record.decimalization) ? record.decimalization : {};
  const parsedInitialNav = Number(record.initial_nav);
  const incomePolicy = String(record.income_policy ?? "CAPITALIZED").toUpperCase();

  return {
    class_id: String(record.class_id ?? classIdentifier(index)).trim().toUpperCase(),
    currency: normalizeCurrency(String(record.currency ?? defaultCurrency)),
    income_policy: incomePolicy === "DISTRIBUTED" ? "DISTRIBUTED" : "CAPITALIZED",
    initial_nav: Number.isFinite(parsedInitialNav) ? parsedInitialNav : 10_000,
    initial_subscription_minimum: {
      display: String(minimum.display ?? "À confirmer").trim(),
    },
    decimalization: {
      display: String(decimalization.display ?? "Parts entières").trim(),
    },
  };
}

function classIdentifier(index: number): string {
  const alphabetIndex = index % 26;
  const cycle = Math.floor(index / 26);
  const suffix = String.fromCharCode(65 + alphabetIndex);
  return cycle === 0 ? `CLASS-${suffix}` : `CLASS-${suffix}-${cycle + 1}`;
}

function normalizeCurrency(value: string): string {
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "XOF";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
