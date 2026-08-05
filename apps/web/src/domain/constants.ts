export const MEMBER_STATES = [
  { value: "BJ", label: "Bénin" },
  { value: "BF", label: "Burkina Faso" },
  { value: "CI", label: "Côte d’Ivoire" },
  { value: "GW", label: "Guinée-Bissau" },
  { value: "ML", label: "Mali" },
  { value: "NE", label: "Niger" },
  { value: "SN", label: "Sénégal" },
  { value: "TG", label: "Togo" },
] as const;

export const FUND_CATEGORIES = [
  { value: "MONETARY", label: "Fonds monétaire" },
  { value: "BOND", label: "Fonds obligataire" },
  { value: "EQUITY", label: "Fonds actions" },
  { value: "DIVERSIFIED", label: "Fonds diversifié" },
  { value: "FUND_OF_FUNDS", label: "Fonds de fonds simple" },
] as const;

export const PROJECT_STATUS_LABELS = {
  DRAFT: "Brouillon",
  QUESTIONNAIRE_IN_PROGRESS: "Questionnaire en cours",
  PRE_COMPLIANCE_REVIEW: "Pré-conformité",
  COMPLIANCE_REVIEW: "Revue conformité",
  LEGAL_REVIEW: "Revue juridique",
  READY_FOR_INTERNAL_APPROVAL: "Prêt pour validation interne",
} as const;
