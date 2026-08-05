import { DOCUMENT_SECTIONS, DOCUMENT_TEMPLATE_VERSION } from "../catalog/document-template.js";
import { hashObject, hashText } from "./hash.js";

export const CIRC005_COMPLETENESS_EXTENSION_VERSION = "0.2.0";

/**
 * Complète la tranche verticale sans masquer les informations non vérifiées.
 * Une rubrique non vide peut rester PENDING_REVIEW ; zéro MISSING ne signifie
 * donc jamais validation juridique ou conformité finale.
 *
 * @param {ReturnType<import('./prospectus-composer.js').composeProspectus>} generation
 */
export function reconcileCirc005Completeness(generation) {
  const data = generation.canonicalData;
  const existingComponents = generation.documentModel.sections.flatMap((section) => section.components);
  const supplemental = buildSupplementalComponents(data);
  let sequence = existingComponents.length;

  const supplementalComponents = supplemental.map((component) => ({
    component_id: `CMP-${String(++sequence).padStart(4, "0")}`,
    type: "PARAGRAPH",
    clause_status: "DRAFT_LEGAL_REVIEW_REQUIRED",
    review_status: component.coverage_status === "PENDING_REVIEW"
      ? "PENDING_CONFIRMATION"
      : "PENDING_LEGAL_REVIEW",
    ...component,
  }));

  const allComponents = [...existingComponents, ...supplementalComponents];
  const sections = DOCUMENT_SECTIONS
    .map((section) => ({
      ...section,
      components: allComponents.filter((component) => component.section_id === section.id),
    }))
    .filter((section) => section.id === "COVER" || section.components.length > 0)
    .sort((left, right) => left.order - right.order);

  const concordance = generation.concordance.map((item) => ({ ...item }));
  const concordanceByRequirement = new Map(concordance.map((item) => [item.requirement_id, item]));

  for (const component of supplementalComponents) {
    for (const requirementId of component.requirement_ids ?? []) {
      const item = concordanceByRequirement.get(requirementId);
      if (!item) continue;
      item.component_ids = unique([...(item.component_ids ?? []), component.component_id]);
      item.clause_ids = unique([...(item.clause_ids ?? []), component.clause_id].filter(Boolean));
      item.coverage_status = component.coverage_status;
    }
  }

  applyHonestyOverrides(concordanceByRequirement, data);

  const coverageCounts = countCoverage(concordance);
  const missingRequirementIds = concordance
    .filter((item) => item.coverage_status === "MISSING")
    .map((item) => item.requirement_id);
  const pendingReviewRequirementIds = concordance
    .filter((item) => item.coverage_status === "PENDING_REVIEW")
    .map((item) => item.requirement_id);

  const extensionFindings = buildPendingFindings(pendingReviewRequirementIds);
  const validation = mergeValidation(generation.validation, extensionFindings);
  const readyForComplianceReview =
    validation.counts.BLOCKER === 0 &&
    missingRequirementIds.length === 0 &&
    pendingReviewRequirementIds.length === 0;

  validation.ready_for_compliance_review = readyForComplianceReview;
  validation.ready_for_submission = false;

  const markdown = renderMarkdown({
    data,
    sections,
    validation,
    coverageCounts,
    readyForComplianceReview,
  });
  const canonicalHash = hashObject(data);
  const documentHash = hashText(markdown);
  const generationId = `GEN-${hashObject({
    canonicalHash,
    documentHash,
    template: DOCUMENT_TEMPLATE_VERSION,
    completenessExtension: CIRC005_COMPLETENESS_EXTENSION_VERSION,
    rulePack: data.regulatory_context?.rule_pack_version,
  }).slice(0, 16).toUpperCase()}`;

  return {
    ...generation,
    documentModel: {
      ...generation.documentModel,
      generation_id: generationId,
      sections,
      completeness_extension_version: CIRC005_COMPLETENESS_EXTENSION_VERSION,
    },
    prospectusMarkdown: markdown,
    validation,
    concordance,
    manifest: {
      ...generation.manifest,
      generation_id: generationId,
      document_status: readyForComplianceReview
        ? "READY_FOR_COMPLIANCE_REVIEW"
        : missingRequirementIds.length > 0
          ? "DATA_INCOMPLETE"
          : "PENDING_HUMAN_REVIEW",
      ready_for_compliance_review: readyForComplianceReview,
      ready_for_submission: false,
      completeness_extension_version: CIRC005_COMPLETENESS_EXTENSION_VERSION,
      component_count: allComponents.length,
      validation_counts: validation.counts,
      coverage_counts: coverageCounts,
      missing_requirement_ids: missingRequirementIds,
      pending_review_requirement_ids: pendingReviewRequirementIds,
      canonical_data_sha256: canonicalHash,
      prospectus_markdown_sha256: documentHash,
      caveat:
        "Aucune exigence n’est silencieusement omise. Les rubriques non vérifiées restent PENDING_REVIEW et empêchent la revue conformité et la soumission.",
    },
  };
}

function buildSupplementalComponents(data) {
  const holderFees = (data.fees ?? []).filter((fee) => fee.payer_type === "HOLDER");
  const channels = data.subscriptions?.sales_channels ?? [];
  const paymentMethods = data.subscriptions?.payment_methods ?? [];
  const issuePrice = data.parts?.issue?.issue_price;

  return [
    component({
      id: "CIRC005_SCOPE_METADATA_V1",
      section: "COVER",
      requirements: ["CIRC005_GENERAL_SCOPE"],
      coverage: "SYSTEM_METADATA",
      content:
        `Périmètre configuré : ${data.regulatory_context?.jurisdiction ?? "UMOA"}, ` +
        `${data.regulatory_context?.rule_pack ?? "UMOA_OPCVM_FCP"}. ` +
        "La Circulaire n°05 complète le règlement du Fonds et les documents constitutifs annexés.",
    }),
    component({
      id: "CIRC005_EFFECTIVE_DATE_PENDING_V1",
      section: "COVER",
      requirements: ["CIRC005_GENERAL_EFFECTIVE_DATE"],
      coverage: "PENDING_REVIEW",
      content:
        "La date officielle de publication et la prise d’effet de la Circulaire n°05/CREPMF/2022 restent à confirmer dans le registre officiel.",
    }),
    component({
      id: "CIRC005_ACCOUNTING_CONTROL_PENDING_V1",
      section: "SEC_1_7_ACCOUNTING_CONTROL",
      requirements: ["CIRC005_1_7_FCP_ACCOUNTING_CONTROL_PERSONS"],
      coverage: "PENDING_REVIEW",
      content:
        data.accounting_control?.summary ??
        "L’identité et la qualité des personnes chargées du contrôle des données comptables doivent être confirmées à partir des décisions de nomination et lettres de mission.",
    }),
    component({
      id: "CIRC005_PART_RIGHT_NATURE_V1",
      section: "SEC_1_10_PARTS_CHARACTERISTICS",
      requirements: ["CIRC005_1_10_A_FCP_RIGHT_NATURE"],
      coverage: "IN_PROSPECTUS",
      content:
        data.parts?.legal_right_description ??
        "Chaque part représente un droit de copropriété sur les actifs du Fonds, proportionnel au nombre de parts détenues.",
    }),
    component({
      id: "CIRC005_PART_REPRESENTATION_V1",
      section: "SEC_1_10_PARTS_CHARACTERISTICS",
      requirements: ["CIRC005_1_10_B_FCP_TITLES_CERTIFICATES"],
      coverage: "IN_PROSPECTUS",
      content:
        data.parts?.representation_summary ??
        "Les parts sont dématérialisées et inscrites en compte ou sur le registre tenu selon les modalités opérationnelles du Fonds. Aucun certificat physique n’est émis.",
    }),
    component({
      id: "CIRC005_PART_FORM_COUPONS_V1",
      section: "SEC_1_10_PARTS_CHARACTERISTICS",
      requirements: ["CIRC005_1_10_C_FCP_FORM_COUPONS"],
      coverage: "IN_PROSPECTUS",
      content:
        data.parts?.form_summary ??
        "Les parts sont dématérialisées. Aucun coupon matériel n’est attaché aux parts.",
    }),
    component({
      id: "CIRC005_LIQUIDATION_CIRCUMSTANCES_PENDING_V1",
      section: "SEC_1_10_PARTS_CHARACTERISTICS",
      requirements: ["CIRC005_1_10_E_FCP_LIQUIDATION_CIRCUMSTANCES"],
      coverage: "PENDING_REVIEW",
      content:
        data.liquidation?.circumstances_summary ??
        "Les circonstances, autorités compétentes et modalités de liquidation doivent être rapprochées du règlement du Fonds et du corpus réglementaire applicable.",
    }),
    component({
      id: "CIRC005_LIQUIDATION_RIGHTS_PENDING_V1",
      section: "SEC_1_10_PARTS_CHARACTERISTICS",
      requirements: ["CIRC005_1_10_F_FCP_LIQUIDATION_HOLDER_RIGHTS"],
      coverage: "PENDING_REVIEW",
      content:
        data.liquidation?.holder_rights_summary ??
        "Les droits des porteurs lors de la liquidation, dont l’information et la répartition du produit net, doivent être confirmés dans le règlement du Fonds.",
    }),
    component({
      id: "CIRC005_ISSUE_AND_SALE_V1",
      section: "SEC_1_12_ISSUE_SALE",
      requirements: ["CIRC005_1_12_FCP_ISSUE_SALE"],
      coverage: "IN_PROSPECTUS",
      content:
        `Les parts sont émises au prix initial de ${formatMoney(issuePrice, "XOF")}. ` +
        `Les souscriptions sont reçues par ${joinFrench(channels)} et réglées par ${joinFrench(paymentMethods)}. ` +
        "Les modalités opérationnelles restent soumises à confirmation par le centralisateur et les distributeurs habilités.",
    }),
    component({
      id: "CIRC005_SPECIALIZATION_PENDING_V1",
      section: "SEC_1_15_INVESTMENT_POLICY",
      requirements: ["CIRC005_1_15_C_FCP_GEOGRAPHIC_SECTOR_SPECIALIZATION"],
      coverage: "PENDING_REVIEW",
      content:
        data.investment?.specialization_summary ??
        "Aucune spécialisation géographique ou sectorielle distincte n’est déclarée dans le présent projet ; ce point doit être confirmé par la société de gestion.",
    }),
    component({
      id: "CIRC005_EXPENSE_REIMBURSEMENT_PENDING_V1",
      section: "SEC_1_18_REMUNERATION_REIMBURSEMENT",
      requirements: ["CIRC005_1_18_B_FCP_EXPENSE_REIMBURSEMENT"],
      coverage: "PENDING_REVIEW",
      content:
        data.expense_reimbursements?.summary ??
        "Aucun remboursement de frais distinct des rémunérations et dépenses déjà recensées n’est déclaré ; cette absence doit être confirmée par les conventions et la politique de frais.",
    }),
    component({
      id: "CIRC005_MANAGER_OTHER_FUNDS_PENDING_V1",
      section: "SEC_1_SGO_OTHER_FUNDS",
      requirements: ["CIRC005_1_3_SGO_OTHER_FUNDS"],
      coverage: "PENDING_REVIEW",
      content:
        data.manager?.managed_funds_summary ??
        "La liste exhaustive et à jour des autres OPC gérés par la société de gestion doit être confirmée à partir du registre officiel et du référentiel institutionnel.",
    }),
    component({
      id: "CIRC005_MANAGER_GOVERNANCE_PENDING_V1",
      section: "SEC_1_SGO_GOVERNANCE",
      requirements: ["CIRC005_1_8_A_SGO_GOVERNANCE_MEMBERS"],
      coverage: "PENDING_REVIEW",
      content:
        data.manager?.governance_summary ??
        "L’identité et les fonctions des membres des organes d’administration, de direction et de surveillance doivent être confirmées à partir des pièces sociales et décisions de nomination.",
    }),
    component({
      id: "CIRC005_MANAGER_EXTERNAL_ACTIVITIES_PENDING_V1",
      section: "SEC_1_SGO_GOVERNANCE",
      requirements: ["CIRC005_1_8_B_SGO_EXTERNAL_ACTIVITIES"],
      coverage: "PENDING_REVIEW",
      content:
        data.manager?.external_activities_summary ??
        "Les activités externes significatives et les conflits d’intérêts éventuels des membres de gouvernance doivent être déclarés et revus par la conformité.",
    }),
    component({
      id: "CIRC005_HOLDER_EXPENSES_V1",
      section: "SEC_5_4_OTHER_EXPENSES",
      requirements: ["CIRC005_5_4_OTHER_EXPENSES_HOLDER"],
      coverage: "IN_PROSPECTUS",
      type: "TABLE",
      content: holderFees.length > 0
        ? markdownTable(
            ["Dépense ou commission", "Bénéficiaire", "Assiette", "Taux / montant"],
            holderFees.map((fee) => [fee.label, fee.beneficiary, fee.basis, formatFee(fee)]),
          )
        : "Aucune autre dépense ou commission payée directement par le porteur n’est déclarée.",
    }),
  ];
}

function applyHonestyOverrides(byRequirement, data) {
  const pending = new Set([
    "CIRC005_1_2_FCP_CONSTITUTION_DATE",
    "CIRC005_1_5_FCP_TAX_REGIME",
    "CIRC005_1_5_FCP_WITHHOLDING_INCOME",
    "CIRC005_1_5_FCP_WITHHOLDING_CAPITAL_GAINS",
    "CIRC005_1_1_SGO_IDENTITY",
    "CIRC005_1_2_SGO_CONSTITUTION_DATE",
    "CIRC005_1_9_A_SGO_SUBSCRIBED_CAPITAL",
    "CIRC005_1_9_B_SGO_PAID_UP_CAPITAL",
    "CIRC005_2_1_DEPOSITARY_IDENTITY",
    "CIRC005_2_2_DEPOSITARY_MAIN_ACTIVITY",
    "CIRC005_5_3_ECONOMIC_INFORMATION",
  ]);

  if (data.fund?.constitution_date) pending.delete("CIRC005_1_2_FCP_CONSTITUTION_DATE");
  if (data.tax?.source_reference) {
    pending.delete("CIRC005_1_5_FCP_TAX_REGIME");
    pending.delete("CIRC005_1_5_FCP_WITHHOLDING_INCOME");
    pending.delete("CIRC005_1_5_FCP_WITHHOLDING_CAPITAL_GAINS");
  }
  if (data.manager?.profile_status === "VERIFIED") {
    pending.delete("CIRC005_1_1_SGO_IDENTITY");
    pending.delete("CIRC005_1_2_SGO_CONSTITUTION_DATE");
    pending.delete("CIRC005_1_9_A_SGO_SUBSCRIBED_CAPITAL");
    pending.delete("CIRC005_1_9_B_SGO_PAID_UP_CAPITAL");
  }
  if (data.depositary?.profile_status === "VERIFIED") {
    pending.delete("CIRC005_2_1_DEPOSITARY_IDENTITY");
    pending.delete("CIRC005_2_2_DEPOSITARY_MAIN_ACTIVITY");
  }
  if (data.economic_information?.review_status === "VALIDATED") {
    pending.delete("CIRC005_5_3_ECONOMIC_INFORMATION");
  }

  for (const requirementId of pending) {
    const item = byRequirement.get(requirementId);
    if (item) item.coverage_status = "PENDING_REVIEW";
  }
}

function buildPendingFindings(requirementIds) {
  const groups = [
    {
      id: "RULE_PENDING_OFFICIAL_EFFECTIVE_DATE",
      requirements: ["CIRC005_GENERAL_EFFECTIVE_DATE"],
      message: "La date officielle de publication et de prise d’effet reste à vérifier.",
      remediation: "Rapprocher le registre officiel et enregistrer la provenance vérifiée.",
    },
    {
      id: "RULE_PENDING_FUND_LEGAL_DETAILS",
      requirements: [
        "CIRC005_1_2_FCP_CONSTITUTION_DATE",
        "CIRC005_1_7_FCP_ACCOUNTING_CONTROL_PERSONS",
        "CIRC005_1_10_E_FCP_LIQUIDATION_CIRCUMSTANCES",
        "CIRC005_1_10_F_FCP_LIQUIDATION_HOLDER_RIGHTS",
      ],
      message: "Des caractéristiques juridiques du Fonds restent à confirmer par les pièces constitutives.",
      remediation: "Collecter le règlement, les décisions de nomination et les pièces de constitution.",
    },
    {
      id: "RULE_PENDING_MANAGER_REFERENCE_DATA",
      requirements: [
        "CIRC005_1_1_SGO_IDENTITY",
        "CIRC005_1_2_SGO_CONSTITUTION_DATE",
        "CIRC005_1_3_SGO_OTHER_FUNDS",
        "CIRC005_1_8_A_SGO_GOVERNANCE_MEMBERS",
        "CIRC005_1_8_B_SGO_EXTERNAL_ACTIVITIES",
        "CIRC005_1_9_A_SGO_SUBSCRIBED_CAPITAL",
        "CIRC005_1_9_B_SGO_PAID_UP_CAPITAL",
      ],
      message: "Le profil institutionnel de la société de gestion est prérempli mais non vérifié.",
      remediation: "Charger le registre officiel, le RCCM, les statuts, les décisions de nomination et les données de capital.",
    },
    {
      id: "RULE_PENDING_DEPOSITARY_REFERENCE_DATA",
      requirements: ["CIRC005_2_1_DEPOSITARY_IDENTITY", "CIRC005_2_2_DEPOSITARY_MAIN_ACTIVITY"],
      message: "Le profil du dépositaire reste à confirmer à partir de l’agrément et de la convention.",
      remediation: "Vérifier l’identité, la forme, les sièges, l’activité et le mandat du dépositaire.",
    },
    {
      id: "RULE_PENDING_POLICY_CONFIRMATIONS",
      requirements: [
        "CIRC005_1_15_C_FCP_GEOGRAPHIC_SECTOR_SPECIALIZATION",
        "CIRC005_1_18_B_FCP_EXPENSE_REIMBURSEMENT",
      ],
      message: "La spécialisation et l’absence de remboursements de frais distincts restent à confirmer.",
      remediation: "Faire confirmer ces choix par la gestion, les risques et la conformité.",
    },
  ];

  const pendingSet = new Set(requirementIds);
  return groups
    .map((group) => ({
      rule_id: group.id,
      severity: "WARNING",
      message: group.message,
      field_paths: [],
      requirement_ids: group.requirements.filter((id) => pendingSet.has(id)),
      remediation: group.remediation,
    }))
    .filter((finding) => finding.requirement_ids.length > 0);
}

function mergeValidation(validation, extraFindings) {
  const findings = uniqueBy(
    [...validation.findings, ...extraFindings],
    (finding) => `${finding.rule_id}:${(finding.requirement_ids ?? []).join("|")}`,
  );
  const counts = {
    INFO: findings.filter((item) => item.severity === "INFO").length,
    WARNING: findings.filter((item) => item.severity === "WARNING").length,
    BLOCKER: findings.filter((item) => item.severity === "BLOCKER").length,
  };
  return {
    ...validation,
    status: counts.BLOCKER > 0 ? "VALIDATION_FAILED" : counts.WARNING > 0 ? "PASSED_WITH_WARNINGS" : "PASSED",
    counts,
    findings,
  };
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
    `- Exigences couvertes dans le prospectus : ${coverageCounts.IN_PROSPECTUS}`,
    `- Exigences en attente de revue ou confirmation : ${coverageCounts.PENDING_REVIEW}`,
    `- Exigences encore manquantes : ${coverageCounts.MISSING}`,
    `- Exigences non applicables : ${coverageCounts.NOT_APPLICABLE}`,
    `- Exigences en métadonnées système : ${coverageCounts.SYSTEM_METADATA}`,
    `- Prêt pour revue conformité : ${readyForComplianceReview ? "oui" : "non"}`,
    "- Prêt pour soumission : non",
    "",
    "> Cette sortie reste un document de pré-conformité. Zéro exigence manquante ne vaut ni validation juridique, ni validation conformité, ni décision du régulateur.",
    "",
  );

  return lines.join("\n");
}

function component({ id, section, requirements, coverage, content, type = "PARAGRAPH" }) {
  return {
    clause_id: id,
    clause_version: 1,
    section_id: section,
    requirement_ids: requirements,
    field_paths: [],
    coverage_status: coverage,
    type,
    content,
  };
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
  if (value === null || value === undefined) return "à confirmer";
  return `${new Intl.NumberFormat("fr-FR").format(Number(value))} ${currency}`;
}

function formatFee(fee) {
  if (fee.rate_type === "NONE") return "Néant";
  if (fee.rate_type === "PERCENTAGE") return `${fee.rate_percent} %${fee.tax_display ? ` ${fee.tax_display}` : ""}`;
  if (fee.rate_type === "PER_MILLE") return `${fee.rate_per_mille} ‰`;
  if (fee.rate_type === "FIXED") return formatMoney(fee.amount, fee.currency);
  return fee.display ?? "À compléter";
}

function joinFrench(values) {
  if (!Array.isArray(values) || values.length === 0) return "des canaux à confirmer";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} et ${values.at(-1)}`;
}

function unique(values) {
  return [...new Set(values)];
}

function uniqueBy(values, keyFn) {
  const seen = new Set();
  return values.filter((value) => {
    const key = keyFn(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
