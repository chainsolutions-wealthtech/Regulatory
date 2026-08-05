import { CLAUSES, CLAUSE_CATALOG_VERSION } from "../catalog/clause-catalog.js";
import { DOCUMENT_SECTIONS, DOCUMENT_TEMPLATE_VERSION } from "../catalog/document-template.js";
import { evaluateCondition } from "./condition-engine.js";
import { renderClause } from "./clause-renderer.js";
import { hashObject, hashText } from "./hash.js";

/**
 * Compose un modèle documentaire intermédiaire traçable, puis son rendu Markdown.
 *
 * @param {{data: Record<string, any>, matrixRows: Array<any>, validation: any, answerLog: Array<any>, generatedAt?: string}} input
 */
export function composeProspectus({ data, matrixRows, validation, answerLog, generatedAt = new Date().toISOString() }) {
  const components = [];
  let componentSequence = 0;

  const addComponent = (component) => {
    componentSequence += 1;
    components.push({
      component_id: `CMP-${String(componentSequence).padStart(4, "0")}`,
      review_status: component.review_status ?? "PENDING_LEGAL_REVIEW",
      ...component,
    });
  };

  for (const clause of CLAUSES) {
    if (!evaluateCondition(clause.condition, data)) continue;
    const rendered = renderClause(clause.wording, data, { allowMissing: true });
    addComponent({
      type: clause.section_id === "COVER" ? "WARNING" : "PARAGRAPH",
      section_id: clause.section_id,
      content: rendered.text,
      clause_id: clause.clause_id,
      clause_version: clause.version,
      clause_status: clause.status,
      requirement_ids: clause.requirements,
      field_paths: clause.field_paths,
      missing_variables: rendered.missing_variables,
    });
  }

  addStructuredComponents(data, addComponent);

  const sections = DOCUMENT_SECTIONS
    .map((section) => ({
      ...section,
      components: components.filter((component) => component.section_id === section.id),
    }))
    .filter((section) => section.id === "COVER" || section.components.length > 0)
    .sort((left, right) => left.order - right.order);

  const concordance = buildConcordance(matrixRows, components, validation);
  const coverageCounts = countCoverage(concordance);
  const readyForComplianceReview = validation.counts.BLOCKER === 0 && coverageCounts.MISSING === 0;
  const markdown = renderMarkdown({ data, sections, validation, coverageCounts, readyForComplianceReview });
  const canonicalHash = hashObject(data);
  const documentHash = hashText(markdown);
  const generationId = `GEN-${hashObject({
    canonicalHash,
    template: DOCUMENT_TEMPLATE_VERSION,
    clauseCatalog: CLAUSE_CATALOG_VERSION,
    rulePack: data.regulatory_context?.rule_pack_version,
  }).slice(0, 16).toUpperCase()}`;

  const manifest = {
    generation_id: generationId,
    generated_at: generatedAt,
    document_status: readyForComplianceReview ? "READY_FOR_COMPLIANCE_REVIEW" : "DATA_INCOMPLETE",
    ready_for_compliance_review: readyForComplianceReview,
    ready_for_submission: false,
    rule_pack: data.regulatory_context?.rule_pack,
    rule_pack_version: data.regulatory_context?.rule_pack_version,
    template_version: DOCUMENT_TEMPLATE_VERSION,
    clause_catalog_version: CLAUSE_CATALOG_VERSION,
    canonical_data_sha256: canonicalHash,
    prospectus_markdown_sha256: documentHash,
    requirement_count: matrixRows.length,
    component_count: components.length,
    answer_count: answerLog.length,
    validation_counts: validation.counts,
    coverage_counts: coverageCounts,
    caveat:
      "Cette génération est une tranche verticale technique. Les clauses sont DRAFT et une revue humaine juridique, conformité et fiscale reste obligatoire.",
  };

  return {
    canonicalData: data,
    documentModel: {
      generation_id: generationId,
      template_version: DOCUMENT_TEMPLATE_VERSION,
      sections,
    },
    prospectusMarkdown: markdown,
    validation,
    concordance,
    answerLog,
    manifest,
  };
}

/**
 * @param {Record<string, any>} data
 * @param {(component: any) => void} addComponent
 */
function addStructuredComponents(data, addComponent) {
  const shareClasses = data.share_classes ?? [];
  if (shareClasses.length > 0) {
    addComponent({
      type: "TABLE",
      section_id: "SEC_1_10_PARTS_CHARACTERISTICS",
      content: markdownTable(
        ["Classe", "Devise", "Revenus", "VL d’origine", "Minimum initial", "Décimalisation"],
        shareClasses.map((item) => [
          item.class_id,
          item.currency,
          labelIncomePolicy(item.income_policy),
          formatMoney(item.initial_nav, item.currency),
          item.initial_subscription_minimum?.display ?? "À compléter",
          item.decimalization?.display ?? "À compléter",
        ]),
      ),
      requirement_ids: ["CIRC005_1_10_FCP_PARTS_CHARACTERISTICS"],
      field_paths: ["share_classes"],
    });
  }

  const assetRanges = data.investment?.asset_ranges ?? [];
  if (assetRanges.length > 0) {
    addComponent({
      type: "TABLE",
      section_id: "SEC_1_15_INVESTMENT_POLICY",
      content: markdownTable(
        ["Catégorie d’actifs", "Minimum", "Maximum", "Précisions"],
        assetRanges.map((item) => [
          item.label ?? item.asset_class,
          `${item.minimum_percent} %`,
          `${item.maximum_percent} %`,
          item.notes ?? "—",
        ]),
      ),
      requirement_ids: [
        "CIRC005_1_15_B_FCP_PLACEMENT_POLICY",
        "CIRC005_1_15_D_FCP_POLICY_LIMITS",
        "CIRC005_1_15_E_FCP_TECHNIQUES_INSTRUMENTS",
      ],
      field_paths: ["investment.asset_ranges"],
      review_status: "PENDING_RISK_AND_COMPLIANCE_REVIEW",
    });
  }

  const risks = data.risks ?? [];
  if (risks.length > 0) {
    addComponent({
      type: "LIST",
      section_id: "SEC_1_15_INVESTMENT_POLICY",
      content: risks.map((risk) => `- **${risk.label}** : ${risk.description}`).join("\n"),
      requirement_ids: ["CIRC005_1_15_FCP_INVESTMENT_OBJECTIVES_POLICY"],
      field_paths: ["risks"],
      review_status: "PENDING_RISK_AND_COMPLIANCE_REVIEW",
    });
  }

  const valuationMethods = data.valuation?.methods ?? [];
  if (valuationMethods.length > 0) {
    addComponent({
      type: "TABLE",
      section_id: "SEC_1_16_VALUATION",
      content: markdownTable(
        ["Actif", "Méthode", "Source principale", "Méthode de repli"],
        valuationMethods.map((item) => [
          item.label ?? item.asset_class,
          item.method,
          item.primary_source,
          item.fallback_method,
        ]),
      ),
      requirement_ids: ["CIRC005_1_16_FCP_ASSET_VALUATION"],
      field_paths: ["valuation.methods"],
      review_status: "PENDING_RISK_AND_COMPLIANCE_REVIEW",
    });
  }

  if (data.pricing?.nav) {
    addComponent({
      type: "PARAGRAPH",
      section_id: "SEC_1_17_PRICE_DETERMINATION",
      content:
        `La valeur liquidative est calculée selon une fréquence ${labelFrequency(data.pricing.nav.frequency)}. ` +
        `${data.pricing.nav.calculation_method}. ` +
        `La publication intervient selon l’échéance suivante : ${data.pricing.publication?.deadline ?? "à compléter"}.`,
      requirement_ids: [
        "CIRC005_1_17_FCP_PRICE_DETERMINATION",
        "CIRC005_1_17_A_FCP_PRICE_METHOD_FREQUENCY",
        "CIRC005_1_17_C_FCP_PRICE_PUBLICATION",
      ],
      field_paths: ["pricing.nav", "pricing.publication"],
    });
  }

  const fees = data.fees ?? [];
  if (fees.length > 0) {
    addComponent({
      type: "TABLE",
      section_id: "SEC_1_18_REMUNERATION_REIMBURSEMENT",
      content: markdownTable(
        ["Frais", "Payeur", "Bénéficiaire", "Assiette", "Taux / montant", "Fréquence"],
        fees.map((fee) => [
          fee.label,
          fee.payer_type,
          fee.beneficiary,
          fee.basis,
          formatFee(fee),
          fee.frequency,
        ]),
      ),
      requirement_ids: [
        "CIRC005_1_17_B_FCP_TRANSACTION_FEES",
        "CIRC005_1_18_FCP_REMUNERATION_REIMBURSEMENT",
        "CIRC005_1_18_A_FCP_REMUNERATION_MODE_AMOUNT_CALCULATION",
        "CIRC005_5_4_OTHER_EXPENSES_FUND_ASSETS",
      ],
      field_paths: ["fees"],
      review_status: "PENDING_COMPLIANCE_REVIEW",
    });
  }

  const countries = data.distribution_countries ?? [];
  if (countries.length > 0) {
    addComponent({
      type: "TABLE",
      section_id: "SEC_4_COUNTRY_ARRANGEMENTS",
      content: markdownTable(
        ["État", "État d’établissement", "Souscription / rachat", "Information des porteurs"],
        countries.map((country) => [
          country.country_name,
          country.is_home_state ? "Oui" : "Non",
          country.redemption_and_subscription_summary,
          country.information_summary,
        ]),
      ),
      requirement_ids: countries.some((item) => !item.is_home_state)
        ? ["CIRC005_4_HOME_STATE_ARRANGEMENTS", "CIRC005_4_OTHER_MARKETING_STATE_ARRANGEMENTS"]
        : ["CIRC005_4_HOME_STATE_ARRANGEMENTS"],
      field_paths: ["distribution_countries"],
    });
  }

  if (data.tax) {
    addComponent({
      type: "WARNING",
      section_id: "SEC_1_5_TAX",
      content:
        data.tax.fund?.summary ??
        "La fiscalité applicable doit être complétée à partir de sources officielles et validée par les rôles fiscal et juridique.",
      requirement_ids: [
        "CIRC005_1_5_FCP_TAX_REGIME",
        "CIRC005_1_5_FCP_WITHHOLDING_INCOME",
        "CIRC005_1_5_FCP_WITHHOLDING_CAPITAL_GAINS",
      ],
      field_paths: ["tax"],
      review_status: "TAX_AND_LEGAL_REVIEW_REQUIRED",
    });
  }

  if (data.economic_information) {
    addComponent({
      type: "WARNING",
      section_id: "SEC_5_3_ECONOMIC_INFORMATION",
      content:
        data.economic_information.summary ??
        "Contenu à déterminer après interprétation validée de la notion d’informations d’ordre économique.",
      requirement_ids: ["CIRC005_5_3_ECONOMIC_INFORMATION"],
      field_paths: ["economic_information"],
      review_status: "LEGAL_REVIEW_REQUIRED",
    });
  }
}

function renderMarkdown({ data, sections, validation, coverageCounts, readyForComplianceReview }) {
  const lines = [
    `# ${data.fund?.legal_name ?? "Prospectus FCP"}`,
    "",
    `**Statut : ${data.regulatory_context?.document_status ?? "DRAFT"}**`,
    "",
    `**Pack réglementaire : ${data.regulatory_context?.rule_pack ?? "UMOA_OPCVM_FCP"} — ${data.regulatory_context?.rule_pack_version ?? "version à définir"}**`,
    "",
  ];

  for (const section of sections) {
    lines.push(`## ${section.title}`, "");
    for (const component of section.components) {
      if (component.type === "WARNING") lines.push(`> ${component.content}`, "");
      else lines.push(component.content, "");
    }
  }

  lines.push(
    "## État des contrôles automatisés",
    "",
    `- Blocages : ${validation.counts.BLOCKER}`,
    `- Avertissements : ${validation.counts.WARNING}`,
    `- Informations : ${validation.counts.INFO}`,
    `- Exigences couvertes dans le projet : ${coverageCounts.IN_PROSPECTUS}`,
    `- Exigences encore manquantes : ${coverageCounts.MISSING}`,
    `- Exigences en métadonnées système : ${coverageCounts.SYSTEM_METADATA}`,
    `- Prêt pour revue conformité : ${readyForComplianceReview ? "oui" : "non"}`,
    "- Prêt pour soumission : non",
    "",
    "> Cette sortie reste un document de pré-conformité. Elle exige une validation humaine avant toute soumission au régulateur.",
    "",
  );

  return lines.join("\n");
}

function buildConcordance(matrixRows, components, validation) {
  const findingsByRequirement = new Map();
  for (const finding of validation.findings) {
    for (const requirementId of finding.requirement_ids ?? []) {
      const current = findingsByRequirement.get(requirementId) ?? [];
      current.push(finding);
      findingsByRequirement.set(requirementId, current);
    }
  }

  return matrixRows.map((row) => {
    const linkedComponents = components.filter((component) =>
      component.requirement_ids?.includes(row.requirement_id),
    );
    const findings = findingsByRequirement.get(row.requirement_id) ?? [];
    let coverageStatus = linkedComponents.length > 0 ? "IN_PROSPECTUS" : "MISSING";
    if (linkedComponents.length === 0 && row.question_type === "SYSTEM") coverageStatus = "SYSTEM_METADATA";
    if (
      row.requirement_id === "CIRC005_4_OTHER_MARKETING_STATE_ARRANGEMENTS" &&
      linkedComponents.length === 0
    ) coverageStatus = "NOT_APPLICABLE";

    return {
      requirement_id: row.requirement_id,
      matrix_source: `${row.matrix_file}:${row.matrix_line}`,
      question_id: row.question_id,
      output_section_id: row.output_section_id,
      coverage_status: coverageStatus,
      component_ids: linkedComponents.map((component) => component.component_id),
      clause_ids: linkedComponents.map((component) => component.clause_id).filter(Boolean),
      validation_findings: findings.map((finding) => finding.rule_id),
      review_roles: row.review_roles,
    };
  });
}

function countCoverage(concordance) {
  const counts = {
    IN_PROSPECTUS: 0,
    IN_ATTACHED_REGULATION: 0,
    IN_ATTACHED_CONSTITUTIVE_DOCUMENT: 0,
    NOT_APPLICABLE: 0,
    PENDING_REVIEW: 0,
    MISSING: 0,
    SYSTEM_METADATA: 0,
  };
  for (const item of concordance) counts[item.coverage_status] = (counts[item.coverage_status] ?? 0) + 1;
  return counts;
}

function markdownTable(headers, rows) {
  const escape = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

function formatMoney(value, currency) {
  if (typeof value !== "number") return "À compléter";
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${new Intl.NumberFormat("fr-FR").format(value)} ${currency ?? ""}`.trim();
  }
}

function formatFee(fee) {
  if (fee.rate_type === "NONE") return "Néant";
  if (fee.rate_type === "PERCENTAGE") return `${fee.rate_percent} %${fee.tax_display ? ` ${fee.tax_display}` : ""}`;
  if (fee.rate_type === "FIXED") return `${new Intl.NumberFormat("fr-FR").format(fee.amount)} ${fee.currency}`;
  if (fee.rate_type === "PER_MILLE") return `${fee.rate_per_mille} ‰`;
  return "À compléter";
}

function labelIncomePolicy(policy) {
  return ({ CAPITALIZATION: "Capitalisation", DISTRIBUTION: "Distribution" })[policy] ?? policy;
}

function labelFrequency(frequency) {
  return ({ DAILY: "quotidienne", WEEKLY: "hebdomadaire", MONTHLY: "mensuelle" })[frequency] ?? frequency;
}
