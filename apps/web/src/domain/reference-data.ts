import { APPLICATION_QUESTIONS } from "./application-questions";
import { MEMBER_STATES } from "./constants";

/** UI projection only: no regulatory source, approval or dynamic register is created. */
export const UMOA_MEMBER_STATE_BASELINE = MEMBER_STATES.map((state) => ({
  code: state.value,
  label: state.label,
  provenance: "apps/web/src/domain/constants.ts",
  status: "STATIC_APPLICATION_BASELINE" as const,
}));

const fundCurrencyQuestion = APPLICATION_QUESTIONS.find((question) => question.id === "APP_FUND_CURRENCY");

/** Reuse the existing XOF option; missing catalog data must not be invented. */
export const XOF_APPLICATION_BASELINE = (fundCurrencyQuestion?.options ?? [])
  .filter((option) => option.value === "XOF")
  .map((option) => ({
    code: option.value,
    label: option.label,
    provenance: "apps/web/src/domain/application-questions.ts#APP_FUND_CURRENCY",
    status: "STATIC_APPLICATION_BASELINE" as const,
  }));

/** Categories are navigation placeholders, not verified institutions or calendars. */
export const UNAVAILABLE_DYNAMIC_REFERENCE_FAMILIES = [
  { id: "management-companies", label: "Sociétés de gestion" },
  { id: "depositaries", label: "Dépositaires" },
  { id: "auditors", label: "Commissaires aux comptes" },
  { id: "distributors", label: "Distributeurs et agents payeurs" },
  { id: "calendars", label: "Calendriers opérationnels et jours non ouvrés" },
] as const;
