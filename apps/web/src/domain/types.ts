export type ProjectStatus =
  | "DRAFT"
  | "QUESTIONNAIRE_IN_PROGRESS"
  | "PRE_COMPLIANCE_REVIEW"
  | "COMPLIANCE_REVIEW"
  | "LEGAL_REVIEW"
  | "READY_FOR_INTERNAL_APPROVAL";

export type CoverageStatus =
  | "IN_PROSPECTUS"
  | "IN_ATTACHED_REGULATION"
  | "IN_ATTACHED_CONSTITUTIVE_DOCUMENT"
  | "NOT_APPLICABLE"
  | "PENDING_REVIEW"
  | "MISSING"
  | "SYSTEM_METADATA";

export type StructuredCollectionQuestionType =
  | "SHARE_CLASS_COLLECTION"
  | "ASSET_RANGE_COLLECTION"
  | "FEE_COLLECTION"
  | "VALUATION_METHOD_COLLECTION"
  | "PARTY_COLLECTION"
  | "RISK_COLLECTION"
  | "COUNTRY_ARRANGEMENT_COLLECTION"
  | "EVIDENCE_COLLECTION";

export type QuestionType =
  | "TEXT"
  | "TEXTAREA"
  | "BOOLEAN"
  | "SELECT"
  | "MULTISELECT"
  | "DATE"
  | "TIME"
  | "PERCENTAGE"
  | "AMOUNT"
  | "COUNTRY"
  | "FILE"
  | StructuredCollectionQuestionType;

export type QuestionSourceKind =
  | "REGULATORY_MATRIX"
  | "APPLICATION"
  | "PENDING_REGULATORY_MAPPING";

export type QuestionOption = {
  value: string;
  label: string;
  description?: string;
};

export type DisplayCondition = {
  questionId: string;
  operator: "EQUALS" | "NOT_EQUALS" | "INCLUDES";
  value: string | boolean;
};

export type ReviewStatus = "UNREVIEWED" | "PENDING_REVIEW" | "CONFIRMED";
export type DataVerificationStatus =
  | "USER_PROVIDED_PENDING_REVIEW"
  | "PREFILLED_PENDING_CONFIRMATION"
  | "VERIFIED";

export type ShareClassInput = {
  class_id: string;
  currency: string;
  income_policy: "CAPITALIZED" | "DISTRIBUTED";
  initial_nav: number;
  initial_subscription_minimum: {
    display: string;
  };
  decimalization: {
    display: string;
  };
};

export type AssetClassRangeInput = {
  range_id: string;
  asset_class: string;
  minimum_percent: number;
  target_percent: number;
  maximum_percent: number;
  review_status: ReviewStatus;
};

export type FeeInput = {
  fee_id: string;
  fee_type:
    | "SUBSCRIPTION"
    | "REDEMPTION"
    | "MANAGEMENT"
    | "DEPOSITARY"
    | "AUDIT"
    | "DISTRIBUTION"
    | "TRANSACTION"
    | "OTHER";
  label: string;
  payer_type: "HOLDER" | "FUND_ASSETS";
  beneficiary: string;
  basis: string;
  rate_type: "PERCENTAGE" | "PER_MILLE" | "FIXED" | "NONE" | "OTHER";
  rate_percent?: number;
  rate_per_mille?: number;
  amount?: number;
  currency?: string;
  frequency: string;
  cap?: string;
  tax_display?: string;
  review_status: ReviewStatus;
};

export type ValuationMethodInput = {
  method_id: string;
  asset_class: string;
  primary_method: string;
  price_source: string;
  fallback_method: string;
  frequency: string;
  exception_process: string;
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
  interactive?: boolean;
  fieldPath: string;
  canonicalFieldPaths?: string[];
  requirementIds: string[];
  options?: QuestionOption[];
  displayCondition?: DisplayCondition;
  reviewRoles: string[];
  sourceKind: QuestionSourceKind;
  sourceMatrix?: string;
  sourceReference?: string;
  originalQuestionType?: string;
  implementationStatus?: string;
  applicability?: string;
  effects?: string[];
  controls?: string[];
  evidenceTypes?: string[];
  clauseGroupId?: string;
  outputSectionId?: string;
  uiFallback?: boolean;
};

export type QuestionGroup = {
  id: string;
  sequence: number;
  title: string;
  description: string;
  sourceKind?: QuestionSourceKind;
  regulatoryRequirementCount?: number;
  interactiveQuestionCount?: number;
};

export type QuestionGroupWithQuestions = QuestionGroup & {
  questions: ProspectusQuestion[];
};

export type CatalogMetadata = {
  schemaVersion: string;
  rulePack: string;
  sourceId: string;
  registryVersion: string;
  registryStatus: string;
  scope: string;
  catalogDigest: string;
  requirementCount: number;
  interactiveQuestionCount: number;
  systemQuestionCount: number;
  systemMetadataRequirementCount: number;
};

export type ProjectAnswer = {
  questionId: string;
  value: unknown;
  updatedAt: string;
  updatedBy: string;
  source: "USER" | "PREFILLED" | "DERIVED";
  reviewStatus: ReviewStatus;
};

export type CoverageSummary = Record<CoverageStatus, number>;

export type ValidationFinding = {
  id: string;
  severity: "BLOCKER" | "WARNING" | "INFO";
  title: string;
  message: string;
  questionIds: string[];
  remediation: string;
};

export type CanonicalAnswerRecord = {
  questionId: string;
  requirementIds: string[];
  canonicalFieldPaths: string[];
  value: unknown;
  source: ProjectAnswer["source"];
  reviewStatus: ProjectAnswer["reviewStatus"];
  sourceKind: QuestionSourceKind;
  sourceReference?: string;
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