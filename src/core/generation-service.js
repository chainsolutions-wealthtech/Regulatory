import { applyQuestionnaireAnswers, buildQuestionCatalog, listApplicableQuestions } from "./questionnaire-engine.js";
import { runValidation } from "./rule-engine.js";
import { composeProspectus } from "./prospectus-composer.js";

/**
 * Chaîne de génération de la première tranche verticale.
 *
 * @param {{seedData: Record<string, unknown>, answers: Array<any>, matrixRows: Array<any>, generatedAt?: string}} input
 */
export function generateProspectusDraft({ seedData, answers, matrixRows, generatedAt }) {
  const questionCatalog = buildQuestionCatalog(matrixRows);
  const { data, answerLog } = applyQuestionnaireAnswers({ seedData, answers, questionCatalog });
  enrichCanonicalData(data);
  const applicableQuestions = listApplicableQuestions(questionCatalog, data);
  const validation = runValidation(data);
  const generation = composeProspectus({ data, matrixRows, validation, answerLog, generatedAt });

  return {
    ...generation,
    questionnaireState: {
      catalog_version: "CIRC005_MATRIX_EXECUTABLE_V0_1",
      total_questions: questionCatalog.length,
      applicable_questions: applicableQuestions.map((question) => ({
        question_id: question.question_id,
        requirement_id: question.requirement_id,
        type: question.type,
        label: question.label,
        options: question.options,
        canonical_fields: question.canonical_fields,
        output_section_id: question.output_section_id,
        review_roles: question.review_roles,
      })),
    },
  };
}

/** @param {Record<string, any>} data */
function enrichCanonicalData(data) {
  if (data.share_classes) data.share_classes.length = data.share_classes.length;
  data.fund ??= {};
  data.fund.country_of_constitution_name ??= countryName(data.fund.country_of_constitution);
  if (data.fund.approval?.date) {
    data.fund.approval.date_display ??= formatDate(data.fund.approval.date);
  }
  if (data.accounting?.financial_year_end) {
    data.accounting.financial_year_end_display ??= formatMonthDay(data.accounting.financial_year_end);
  }
  deriveRisks(data);
}

/** @param {Record<string, any>} data */
function deriveRisks(data) {
  if (Array.isArray(data.risks) && data.risks.length > 0) return;

  const ranges = data.investment?.asset_ranges ?? [];
  const used = new Set(ranges.filter((item) => Number(item.maximum_percent) > 0).map((item) => item.asset_class));
  const risks = [
    {
      risk_id: "CAPITAL_LOSS",
      label: "Risque de perte en capital",
      description: "Le capital investi n’est pas garanti et peut ne pas être intégralement restitué.",
      provenance: "DERIVED_FROM_PRODUCT_NATURE",
    },
  ];

  if (used.has("EQUITIES")) {
    risks.push({
      risk_id: "EQUITY_MARKET",
      label: "Risque actions",
      description: "La valeur des actions détenues peut fluctuer à la hausse comme à la baisse.",
      provenance: "DERIVED_FROM_ASSET_RANGE:EQUITIES",
    });
  }
  if (used.has("DEBT_AND_MONEY_MARKET")) {
    risks.push(
      {
        risk_id: "INTEREST_RATE",
        label: "Risque de taux",
        description: "La valeur des instruments de taux peut diminuer en cas de variation défavorable des taux d’intérêt.",
        provenance: "DERIVED_FROM_ASSET_RANGE:DEBT_AND_MONEY_MARKET",
      },
      {
        risk_id: "CREDIT",
        label: "Risque de crédit",
        description: "La dégradation de la qualité d’un émetteur peut affecter la valeur des titres détenus.",
        provenance: "DERIVED_FROM_ASSET_RANGE:DEBT_AND_MONEY_MARKET",
      },
    );
  }
  if (data.redemption?.allowed) {
    risks.push({
      risk_id: "LIQUIDITY",
      label: "Risque de liquidité",
      description: "Certains actifs peuvent être difficiles à céder rapidement dans des conditions normales de marché.",
      provenance: "DERIVED_FROM_REDEMPTION_AND_ASSET_PROFILE",
    });
  }
  if (data.investment?.management_style === "ACTIVE_DISCRETIONARY") {
    risks.push({
      risk_id: "DISCRETIONARY_MANAGEMENT",
      label: "Risque lié à la gestion discrétionnaire",
      description: "Les choix du gestionnaire peuvent ne pas produire les résultats attendus.",
      provenance: "DERIVED_FROM_MANAGEMENT_STYLE",
    });
  }
  risks.push({
    risk_id: "OPERATIONAL",
    label: "Risque opérationnel",
    description: "Une défaillance de processus, de système ou d’un prestataire peut affecter le Fonds.",
    provenance: "DERIVED_STANDARD_RISK_PENDING_REVIEW",
  });
  data.risks = risks;
}

/** @param {string} value */
function countryName(value) {
  return ({ CI: "Côte d’Ivoire", SN: "Sénégal", BJ: "Bénin", BF: "Burkina Faso", ML: "Mali", NE: "Niger", TG: "Togo", GW: "Guinée-Bissau" })[value] ?? value;
}

/** @param {string} value */
function formatDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
}

/** @param {string} value */
function formatMonthDay(value) {
  const [month, day] = value.split("-");
  const date = new Date(Date.UTC(2000, Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
}
