import { FUND_CATEGORIES, MEMBER_STATES } from "./constants";
import type { ProspectusQuestion, QuestionGroup } from "./types";

export const QUESTION_GROUPS: QuestionGroup[] = [
  { id: "project", sequence: 1, title: "Projet", description: "Cadre réglementaire et type d’opération." },
  { id: "manager", sequence: 2, title: "Société de gestion", description: "Confirmation des informations institutionnelles préremplies." },
  { id: "fund", sequence: 3, title: "Identité du fonds", description: "Dénomination, durée, agrément et devise." },
  { id: "shares", sequence: 4, title: "Classes de parts", description: "Caractéristiques juridiques et économiques des parts." },
  { id: "actors", sequence: 5, title: "Intervenants", description: "Dépositaire, commissaires aux comptes et délégataires." },
  { id: "objective", sequence: 6, title: "Objectif de gestion", description: "Objectif, benchmark, horizon et style de gestion." },
  { id: "portfolio", sequence: 7, title: "Portefeuille", description: "Actifs, fourchettes, zones et contraintes." },
  { id: "risks", sequence: 8, title: "Risques", description: "Risques proposés automatiquement et risques spécifiques." },
  { id: "nav", sequence: 9, title: "Valeur liquidative", description: "Fréquence, calcul, publication et prix." },
  { id: "subscriptions", sequence: 10, title: "Souscriptions et rachats", description: "Canaux, cut-off, règlement et liquidité." },
  { id: "income", sequence: 11, title: "Revenus", description: "Capitalisation, distribution et calendrier." },
  { id: "fees", sequence: 12, title: "Frais", description: "Frais investisseurs, fonds et autres dépenses." },
  { id: "valuation", sequence: 13, title: "Valorisation", description: "Méthodes par actif, sources et méthodes de repli." },
  { id: "tax", sequence: 14, title: "Fiscalité", description: "Fiscalité du fonds et des porteurs, sous revue spécialisée." },
  { id: "distribution", sequence: 15, title: "Commercialisation", description: "Pays, distributeurs, agents payeurs et information." },
  { id: "performance", sequence: 16, title: "Performances", description: "Historique, benchmark et avertissements." },
  { id: "evidence", sequence: 17, title: "Justificatifs", description: "Pièces requises et provenance des informations." },
  { id: "review", sequence: 18, title: "Contrôles et revue", description: "Anomalies, assignations et décisions humaines." },
];

const booleanOptions = [
  { value: "true", label: "Oui" },
  { value: "false", label: "Non" },
];

export const QUESTIONS: ProspectusQuestion[] = [
  q("project.operation", "project", 1, "Quel type de projet créez-vous ?", "Choisissez entre une création et la mise à jour d’un prospectus existant.", "SELECT", true, "project.operation", ["CIRC005_GENERAL_SCOPE"], [
    { value: "CREATE", label: "Création d’un nouveau fonds" },
    { value: "UPDATE", label: "Mise à jour d’un prospectus existant" },
  ]),
  q("project.category", "project", 2, "Quelle est la catégorie principale du fonds ?", "Cette réponse déclenche les questions, risques et méthodes de valorisation applicables.", "SELECT", true, "fund.category", ["CIRC005_1_15_A_FCP_INVESTMENT_OBJECTIVE"], [...FUND_CATEGORIES]),
  q("project.country", "project", 3, "Dans quel État membre le fonds est-il constitué ?", "Le pays détermine certains référentiels opérationnels et fiscaux.", "COUNTRY", true, "fund.countryCode", ["CIRC005_1_1_FCP_DENOMINATION"], [...MEMBER_STATES]),

  q("manager.confirm", "manager", 1, "Confirmez-vous la société de gestion préremplie ?", "Une confirmation ne remplace pas la vérification des pièces officielles.", "BOOLEAN", true, "managementCompany.confirmed", ["CIRC005_1_1_SGO_IDENTITY"], booleanOptions),
  q("manager.legalName", "manager", 2, "Dénomination légale de la société de gestion", "Utilisez la dénomination figurant sur l’agrément et les statuts.", "TEXT", true, "managementCompany.legalName", ["CIRC005_1_1_SGO_IDENTITY"]),
  q("manager.approval", "manager", 3, "Numéro d’agrément de la société de gestion", "Cette donnée devra être rapprochée du registre officiel AMF-UMOA.", "TEXT", true, "managementCompany.approvalNumber", ["CIRC005_1_1_SGO_IDENTITY"]),

  q("fund.legalName", "fund", 1, "Dénomination complète du fonds", "Saisissez le nom qui apparaîtra sur la couverture et dans toutes les sections.", "TEXT", true, "fund.legalName", ["CIRC005_1_1_FCP_DENOMINATION"]),
  q("fund.constitutionDate", "fund", 2, "Date de constitution", "Joignez ensuite le document constitutif correspondant.", "DATE", true, "fund.constitutionDate", ["CIRC005_1_2_FCP_CONSTITUTION_DATE"]),
  q("fund.duration", "fund", 3, "Durée du fonds", "Exemple : 99 ans ou durée indéterminée.", "TEXT", true, "fund.duration", ["CIRC005_1_2_FCP_CONSTITUTION_DURATION"]),
  q("fund.currency", "fund", 4, "Devise comptable", "La devise doit être cohérente avec les classes de parts et les règles de VL.", "SELECT", true, "fund.currency", ["CIRC005_1_10_PARTS_CHARACTERISTICS"], [
    { value: "XOF", label: "Franc CFA BCEAO (XOF)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "USD", label: "Dollar américain (USD)" },
  ]),

  q("shares.multiple", "shares", 1, "Le fonds comporte-t-il plusieurs classes de parts ?", "Chaque classe peut avoir sa propre devise, politique de revenus, éligibilité et structure de frais.", "BOOLEAN", true, "shareClasses.multiple", ["CIRC005_1_10_PARTS_CHARACTERISTICS"], booleanOptions),
  q("shares.initialNav", "shares", 2, "Valeur liquidative initiale de la première classe", "Indiquez le montant dans la devise de la classe.", "AMOUNT", true, "shareClasses.0.initialNav", ["CIRC005_1_12_FCP_ISSUE_SALE"]),
  q("shares.incomePolicy", "shares", 3, "Politique de revenus de la première classe", "Capitalisation ou distribution.", "SELECT", true, "shareClasses.0.incomePolicy", ["CIRC005_1_14_FCP_INCOME_POLICY"], [
    { value: "CAPITALISATION", label: "Capitalisation" },
    { value: "DISTRIBUTION", label: "Distribution" },
  ]),

  q("actors.depositary", "actors", 1, "Dépositaire", "Sélectionnez ou saisissez l’établissement désigné.", "TEXT", true, "depositary.legalName", ["CIRC005_2_1_DEPOSITARY_IDENTITY"]),
  q("actors.auditor", "actors", 2, "Commissaire aux comptes titulaire", "Indiquez le cabinet et le représentant signataire.", "TEXT", true, "auditor.legalName", ["CIRC005_1_7_FCP_ACCOUNTING_CONTROL_PERSONS"]),
  q("actors.delegate", "actors", 3, "Une fonction est-elle déléguée à un prestataire externe ?", "Toute délégation doit être documentée et contrôlée.", "BOOLEAN", true, "delegation.enabled", ["CIRC005_3_1_ADVISER_IDENTITY"], booleanOptions),
  q("actors.delegateName", "actors", 4, "Identité du délégataire", "Décrivez aussi la fonction déléguée et le contrat.", "TEXT", true, "delegation.legalName", ["CIRC005_3_1_ADVISER_IDENTITY"], undefined, { questionId: "actors.delegate", operator: "EQUALS", value: "true" }),

  q("objective.text", "objective", 1, "Quel est l’objectif de gestion ?", "Formulez le résultat recherché, sans promettre une performance garantie.", "TEXTAREA", true, "investment.objective", ["CIRC005_1_15_A_FCP_INVESTMENT_OBJECTIVE"]),
  q("objective.horizon", "objective", 2, "Durée de placement recommandée", "Exemple : supérieure à trois ans.", "TEXT", true, "investment.recommendedHoldingPeriod", ["CIRC005_5_2_TARGET_INVESTOR"]),
  q("objective.benchmark", "objective", 3, "Le fonds utilise-t-il un benchmark ?", "Précisez s’il s’agit d’un objectif de comparaison et non d’une contrainte de réplication.", "BOOLEAN", true, "investment.benchmark.enabled", ["CIRC005_1_15_A_FCP_INVESTMENT_OBJECTIVE"], booleanOptions),
  q("objective.benchmarkName", "objective", 4, "Nom et source du benchmark", "Indiquez l’administrateur et la méthode d’utilisation.", "TEXT", true, "investment.benchmark.name", ["CIRC005_1_15_A_FCP_INVESTMENT_OBJECTIVE"], undefined, { questionId: "objective.benchmark", operator: "EQUALS", value: "true" }),

  q("portfolio.equityMax", "portfolio", 1, "Exposition maximale aux actions", "Pourcentage maximal de l’actif net.", "PERCENTAGE", true, "investment.assetRanges.equity.max", ["CIRC005_1_15_B_FCP_INVESTMENT_TECHNIQUES"]),
  q("portfolio.debtMin", "portfolio", 2, "Exposition minimale aux obligations et titres de créance", "Pourcentage minimal de l’actif net.", "PERCENTAGE", true, "investment.assetRanges.debt.min", ["CIRC005_1_15_B_FCP_INVESTMENT_TECHNIQUES"]),
  q("portfolio.debtMax", "portfolio", 3, "Exposition maximale aux obligations et titres de créance", "Pourcentage maximal de l’actif net.", "PERCENTAGE", true, "investment.assetRanges.debt.max", ["CIRC005_1_15_B_FCP_INVESTMENT_TECHNIQUES"]),
  q("portfolio.derivatives", "portfolio", 4, "Le fonds utilise-t-il des instruments dérivés ?", "Cette réponse ouvre les questions relatives aux sous-jacents, contreparties et limites.", "BOOLEAN", true, "investment.derivatives.enabled", ["CIRC005_1_15_B_FCP_INVESTMENT_TECHNIQUES"], booleanOptions),
  q("portfolio.derivativePurpose", "portfolio", 5, "Finalité des instruments dérivés", "Sélectionnez la couverture, l’exposition ou les deux.", "MULTISELECT", true, "investment.derivatives.purposes", ["CIRC005_1_15_B_FCP_INVESTMENT_TECHNIQUES"], [
    { value: "HEDGING", label: "Couverture" },
    { value: "EXPOSURE", label: "Exposition" },
  ], { questionId: "portfolio.derivatives", operator: "EQUALS", value: "true" }),

  q("risks.confirm", "risks", 1, "Confirmez-vous les risques proposés automatiquement ?", "La proposition automatique doit être revue par les fonctions gestion des risques et conformité.", "BOOLEAN", true, "risks.confirmed", ["CIRC005_1_16_FCP_RISK_PROFILE"], booleanOptions),
  q("risks.specific", "risks", 2, "Risque spécifique à ajouter", "Décrivez uniquement un risque propre à la stratégie qui n’est pas déjà couvert.", "TEXTAREA", false, "risks.specific", ["CIRC005_1_16_FCP_RISK_PROFILE"]),

  q("nav.frequency", "nav", 1, "Fréquence de calcul de la valeur liquidative", "Choisissez la fréquence opérationnelle retenue.", "SELECT", true, "nav.frequency", ["CIRC005_1_17_FCP_PRICE_DETERMINATION"], [
    { value: "DAILY", label: "Quotidienne" },
    { value: "WEEKLY", label: "Hebdomadaire" },
    { value: "MONTHLY", label: "Mensuelle" },
  ]),
  q("nav.day", "nav", 2, "Jour ou règle de calcul", "Exemple : chaque lundi sur la base des cours du vendredi.", "TEXT", true, "nav.calculationRule", ["CIRC005_1_17_FCP_PRICE_DETERMINATION"]),
  q("nav.publication", "nav", 3, "Canal de publication de la VL", "Indiquez les lieux et moyens de mise à disposition.", "TEXT", true, "nav.publicationChannels", ["CIRC005_4_CROSS_BORDER_ARRANGEMENTS"]),

  q("subscriptions.minimum", "subscriptions", 1, "Souscription initiale minimale", "Montant minimal dans la devise de la classe.", "AMOUNT", true, "subscription.initialMinimum", ["CIRC005_1_12_FCP_ISSUE_SALE"]),
  q("subscriptions.cutoff", "subscriptions", 2, "Heure limite de réception des ordres", "Saisissez l’heure locale applicable.", "TIME", true, "subscription.cutoff", ["CIRC005_1_13_FCP_REDEMPTION"]),
  q("subscriptions.gate", "subscriptions", 3, "Un mécanisme de plafonnement des rachats est-il prévu ?", "La clause et les conditions doivent être rapprochées de l’Instruction 66 et du règlement du fonds.", "BOOLEAN", true, "redemption.gate.enabled", ["CIRC005_1_13_FCP_REDEMPTION"], booleanOptions),
  q("subscriptions.gateThreshold", "subscriptions", 4, "Seuil du plafonnement", "Pourcentage du nombre de parts ou de l’actif selon la règle validée.", "PERCENTAGE", true, "redemption.gate.threshold", ["CIRC005_1_13_FCP_REDEMPTION"], undefined, { questionId: "subscriptions.gate", operator: "EQUALS", value: "true" }),

  q("income.distributionFrequency", "income", 1, "Fréquence de distribution", "Cette question n’apparaît que pour une classe de distribution.", "SELECT", true, "income.distributionFrequency", ["CIRC005_1_14_FCP_INCOME_POLICY"], [
    { value: "ANNUAL", label: "Annuelle" },
    { value: "SEMI_ANNUAL", label: "Semestrielle" },
    { value: "QUARTERLY", label: "Trimestrielle" },
  ], { questionId: "shares.incomePolicy", operator: "EQUALS", value: "DISTRIBUTION" }),

  q("fees.subscription", "fees", 1, "Commission maximale de souscription", "Indiquez le taux maximal supporté par le porteur.", "PERCENTAGE", true, "fees.subscription.max", ["CIRC005_5_4_OTHER_EXPENSES_HOLDER"]),
  q("fees.management", "fees", 2, "Commission maximale de gestion", "Indiquez le taux annuel maximal et son assiette.", "PERCENTAGE", true, "fees.management.max", ["CIRC005_1_18_A_FCP_REMUNERATION"]),
  q("fees.performance", "fees", 3, "Une commission de performance est-elle prévue ?", "Une formule complète, un benchmark, une période et des mécanismes de protection sont requis.", "BOOLEAN", true, "fees.performance.enabled", ["CIRC005_1_18_A_FCP_REMUNERATION"], booleanOptions),

  q("valuation.debt", "valuation", 1, "Méthode de valorisation des obligations", "Décrivez la source primaire, la méthode de repli et le traitement des titres peu liquides.", "TEXTAREA", true, "valuation.methods.debt", ["CIRC005_1_17_FCP_PRICE_DETERMINATION"]),
  q("valuation.equity", "valuation", 2, "Méthode de valorisation des actions", "Précisez le cours retenu et le traitement des titres non cotés.", "TEXTAREA", false, "valuation.methods.equity", ["CIRC005_1_17_FCP_PRICE_DETERMINATION"]),

  q("tax.source", "tax", 1, "Source juridique de la fiscalité du fonds", "Aucune mention fiscale ne peut être validée sans source officielle et revue fiscale.", "TEXT", true, "tax.sourceReference", ["CIRC005_1_5_FCP_TAX_REGIME"]),
  q("tax.review", "tax", 2, "La revue fiscale a-t-elle été réalisée ?", "Seul un rôle habilité peut confirmer cette étape.", "BOOLEAN", true, "tax.reviewed", ["CIRC005_1_5_FCP_TAX_REGIME"], booleanOptions),

  q("distribution.countries", "distribution", 1, "États de commercialisation", "Sélectionnez tous les États concernés.", "MULTISELECT", true, "distribution.countries", ["CIRC005_4_CROSS_BORDER_ARRANGEMENTS"], [...MEMBER_STATES]),
  q("distribution.channels", "distribution", 2, "Canaux de souscription et d’information", "Indiquez les distributeurs, agents payeurs et lieux d’information.", "TEXTAREA", true, "distribution.channels", ["CIRC005_4_CROSS_BORDER_ARRANGEMENTS"]),

  q("performance.available", "performance", 1, "Un historique de performance est-il disponible ?", "Pour un nouveau fonds, répondez non et conservez l’avertissement réglementaire.", "BOOLEAN", true, "performance.available", ["CIRC005_5_1_HISTORICAL_PERFORMANCE"], booleanOptions),
  q("performance.source", "performance", 2, "Source et période de l’historique", "Indiquez la source, la période et le benchmark comparatif.", "TEXT", true, "performance.source", ["CIRC005_5_1_HISTORICAL_PERFORMANCE"], undefined, { questionId: "performance.available", operator: "EQUALS", value: "true" }),

  q("evidence.fundRegulation", "evidence", 1, "Règlement du fonds", "Téléversez ou référencez la version devant couvrir les rubriques déportées.", "FILE", true, "evidence.fundRegulation", ["CIRC005_GENERAL_SCOPE"]),
  q("evidence.approvals", "evidence", 2, "Agréments et décisions", "Ajoutez les décisions concernant la SGO, le fonds et les intervenants.", "FILE", true, "evidence.approvals", ["CIRC005_1_1_SGO_IDENTITY"]),

  q("review.owner", "review", 1, "Responsable de la prochaine revue", "Choisissez le rôle chargé de traiter les points restants.", "SELECT", true, "review.nextOwner", ["CIRC005_GENERAL_SCOPE"], [
    { value: "COMPLIANCE", label: "Conformité" },
    { value: "LEGAL", label: "Juridique" },
    { value: "TAX", label: "Fiscalité" },
    { value: "RISK", label: "Risques" },
    { value: "PRODUCT", label: "Métier produit" },
  ]),
];

function q(
  id: string,
  groupId: string,
  sequence: number,
  label: string,
  helpText: string,
  type: ProspectusQuestion["type"],
  required: boolean,
  fieldPath: string,
  requirementIds: string[],
  options?: ProspectusQuestion["options"],
  displayCondition?: ProspectusQuestion["displayCondition"],
): ProspectusQuestion {
  return {
    id,
    groupId,
    sequence,
    label,
    helpText,
    type,
    required,
    fieldPath,
    requirementIds,
    options,
    displayCondition,
    reviewRoles: groupId === "tax" ? ["TAX", "LEGAL", "COMPLIANCE"] : ["PRODUCT", "COMPLIANCE"],
  };
}
