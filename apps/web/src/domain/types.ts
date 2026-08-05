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
  | "SHARE_CLASS_COLLECTION";

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
  reviewStatus: "UNREVIEWED" | "PENDING_REVIEW" | "CONFIRMED";
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