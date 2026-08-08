export type ProjectStatus =
  | "DRAFT"
  | "QUESTIONNAIRE_IN_PROGRESS"
  | "PRE_COMPLIANCE_REVIEW"
  | "INTERNAL_REVIEW"
  | "APPROVED_INTERNAL";

export type DataVerificationStatus =
  | "UNVERIFIED"
  | "PREFILLED_PENDING_CONFIRMATION"
  | "VERIFIED";

export type ReviewStatus = "UNREVIEWED" | "PENDING_REVIEW" | "CONFIRMED" | "REJECTED";

export type QuestionType =
  | "text"
  | "textarea"
  | "date"
  | "boolean"
  | "select"
  | "multi-select"
  | "number"
  | "structured-collection";

export type ShareClassInput = {
  class_id: string;
  name: string;
  currency: string;
  income_policy: "CAPITALISATION" | "DISTRIBUTION" | "MIXED";
  investor_category: string;
  initial_price?: number;
  minimum_subscription?: number;
  subscription_cutoff?: string;
  redemption_cutoff?: string;
  settlement_days?: number;
  entry_fee_max_percent?: number;
  exit_fee_max_percent?: number;
  management_fee_max_percent?: number;
  performance_fee_rule?: string;
  review_status: ReviewStatus;
};

export type AssetClassRangeInput = {
  range_id: string;
  asset_class: string;
  minimum_percent: number;
  target_percent?: number;
  maximum_percent: number;
  review_status: ReviewStatus;
};

export type FeeInput = {
  fee_id: string;
  fee_type:
    | "SUBSCRIPTION"
    | "REDEMPTION"
    | "MANAGEMENT"
    | "PERFORMANCE"
    | "DEPOSITARY"
    | "AUDIT"
    | "TRANSACTION"
    | "OTHER";
  level: "FUND" | "SHARE_CLASS";
  share_class_id?: string;
  rate_percent?: number;
  amount?: number;
  currency?: string;
  calculation_basis?: string;
  accrual_frequency?: string;
  payment_frequency?: string;
  recipient?: string;
  description?: string;
  review_status: ReviewStatus;
};

export type ValuationMethodInput = {
  method_id: string;
  asset_class: string;
  primary_method: string;
  price_source: string;
  fallback_method?: string;
  frequency: string;
  exception_process?: string;
  review_status: ReviewStatus;
};

export type PartyInput = {
  party_id: string;
  role:
    | "MANAGEMENT_COMPANY"
    | "GOVERNANCE_MEMBER"
    | "DEPOSITARY"
    | "AUDITOR"
    | "ACCOUNTING_CONTROL"
    | "EXTERNAL_ADVISER"
    | "DISTRIBUTOR"
    | "PAYING_AGENT"
    | "OTHER";
  legal_name: string;
  person_name?: string;
  legal_form?: string;
  approval_number?: string;
  registered_office?: string;
  main_activity?: string;
  function_title?: string;
  significant_external_activities?: string;
  conflicts?: string;
  verification_status: DataVerificationStatus;
};

export type RiskFactorInput = {
  risk_id: string;
  category:
    | "CAPITAL_LOSS"
    | "MARKET"
    | "CREDIT"
    | "INTEREST_RATE"
    | "LIQUIDITY"
    | "CURRENCY"
    | "COUNTERPARTY"
    | "OPERATIONAL"
    | "CONCENTRATION"
    | "VALUATION"
    | "MANAGEMENT"
    | "OTHER";
  label: string;
  description: string;
  source: "DERIVED" | "USER" | "REGULATORY_REFERENCE";
  review_status: ReviewStatus;
};

export type CountryArrangementInput = {
  arrangement_id: string;
  country_code: string;
  is_home_state: boolean;
  marketing_authorization_reference: string;
  paying_agents: string;
  redemption_locations: string;
  information_locations: string;
  review_status: ReviewStatus;
};

export type EvidenceInput = {
  evidence_id: string;
  evidence_type:
    | "APPROVAL"
    | "RCCM"
    | "STATUTES"
    | "FUND_REGULATION"
    | "SERVICE_AGREEMENT"
    | "POLICY"
    | "OFFICIAL_REGISTER"
    | "FINANCIAL_STATEMENT"
    | "LEGAL_MEMO"
    | "TAX_MEMO"
    | "OTHER";
  title: string;
  reference: string;
  issuer: string;
  issue_date?: string;
  file_reference: string;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
};

export type StructuredCollectionValue =
  | ShareClassInput[]
  | AssetClassRangeInput[]
  | FeeInput[]
  | ValuationMethodInput[]
  | PartyInput[]
  | RiskFactorInput[]
  | CountryArrangementInput[]
  | EvidenceInput[];

export type ProspectusQuestion = {
  id: string;
  groupId: string;
  sequence: number;
  label: string;
  helpText: string;
  example?: string;
  type: QuestionType;
  required: boolean;
  interactive: boolean;
  options?: Array<{ value: string; label: string }>;
  canonicalFieldPaths: string[];
  requirementIds: string[];
  reviewRoles: string[];
  displayCondition?: {
    questionId: string;
    equals?: unknown;
    includes?: unknown;
  };
  structuredCollection?: {
    collectionType:
      | "SHARE_CLASSES"
      | "ASSET_CLASS_RANGES"
      | "FEES"
      | "VALUATION_METHODS"
      | "PARTIES"
      | "RISKS"
      | "COUNTRY_ARRANGEMENTS"
      | "EVIDENCE";
    minimumRows?: number;
  };
};

export type QuestionGroup = {
  id: string;
  title: string;
  description: string;
  sequence: number;
  questions: ProspectusQuestion[];
};

export type ProjectAnswer = {
  questionId: string;
  value: unknown;
  updatedAt: string;
  updatedBy: string;
  source: "USER" | "PREFILLED" | "DERIVED";
  reviewStatus: ReviewStatus;
};

export type CoverageStatus =
  | "IN_PROSPECTUS"
  | "IN_ATTACHED_REGULATION"
  | "IN_ATTACHED_CONSTITUTIVE_DOCUMENT"
  | "NOT_APPLICABLE"
  | "PENDING_REVIEW"
  | "MISSING"
  | "SYSTEM_METADATA";

export type CoverageEntry = {
  requirementId: string;
  source: string;
  status: CoverageStatus;
  sectionId?: string;
  justification?: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

export type CoverageSummary = {
  entries: CoverageEntry[];
  counts: Record<CoverageStatus, number>;
};

export type ValidationFinding = {
  id: string;
  severity: "INFO" | "WARNING" | "BLOCKER";
  message: string;
  remediation: string;
  questionId?: string;
  requirementId?: string;
};

export type CanonicalAnswerRecord = {
  questionId: string;
  requirementIds: string[];
  canonicalFieldPaths: string[];
  value: unknown;
  source: ProjectAnswer["source"];
  reviewStatus: ReviewStatus;
  updatedAt: string;
  updatedBy: string;
};

export type CanonicalSnapshot = {
  schemaVersion: "WEB_CANONICAL_SNAPSHOT_V1";
  snapshotCreatedAt: string;
  projectId: string;
  projectVersion: number;
  projectUpdatedAt: string;
  catalogDigest: string;
  rulePack: string;
  requirementCount: number;
  readyForSubmission: false;
  canonicalData: Record<string, unknown>;
  structuredAnswers: Record<string, { canonicalFieldPaths: string[]; value: unknown }>;
  answerRecords: CanonicalAnswerRecord[];
  legacyUnmappedAnswers: string[];
  coverage: CoverageSummary;
  findings: ValidationFinding[];
};

export type GenerationSnapshot = {
  generationId: string;
  generatedAt: string;
  documentStatus: "DRAFT_PRE_COMPLIANCE_REVIEW";
  readyForComplianceReview: boolean;
  readyForSubmission: false;
  artifactDirectoryPath?: string;
  markdownPath?: string;
  docxPath?: string;
  pdfPath?: string;
  reviewPackagePath?: string;
  previewPath?: string;
  canonicalSnapshotPath?: string;
  canonicalDataPath?: string;
  questionnaireStatePath?: string;
  controlReportPath?: string;
  concordancePath?: string;
  documentModelPath?: string;
  answerLogPath?: string;
  generationManifestPath?: string;
  docxManifestPath?: string;
  docxValidationPath?: string;
  pdfManifestPath?: string;
  reviewPackageManifestPath?: string;
  catalogDigest?: string;
  requirementCount?: number;
  questionCount?: number;
};

export type ProspectusProject = {
  id: string;
  name: string;
  fundType: "FCP";
  category: "MONETARY" | "BOND" | "EQUITY" | "DIVERSIFIED" | "FUND_OF_FUNDS";
  jurisdiction: "UMOA";
  authority: "AMF-UMOA";
  operation: "CREATE" | "UPDATE";
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  managementCompany: {
    id?: string;
    legalName: string;
    approvalNumber?: string;
    verificationStatus: "PREFILLED_PENDING_CONFIRMATION" | "VERIFIED";
  };
  fund: {
    legalName: string;
    countryCode: string;
    currency: string;
    shareClassCount: number;
  };
  answers: Record<string, ProjectAnswer>;
  coverage: CoverageSummary;
  findings: ValidationFinding[];
  generation?: GenerationSnapshot;
  catalog?: {
    schemaVersion: string;
    digest: string;
    requirementCount: number;
    interactiveQuestionCount: number;
  };
  version: number;
};

export type ProjectSummary = Pick<
  ProspectusProject,
  "id" | "name" | "status" | "updatedAt" | "category" | "coverage"
> & {
  progress: number;
  blockers: number;
  warnings: number;
};
