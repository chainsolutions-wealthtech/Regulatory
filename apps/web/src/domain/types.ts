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
  | "FILE";

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

export type ProspectusQuestion = {
  id: string;
  groupId: string;
  sequence: number;
  label: string;
  helpText: string;
  example?: string;
  type: QuestionType;
  required: boolean;
  fieldPath: string;
  requirementIds: string[];
  options?: QuestionOption[];
  displayCondition?: DisplayCondition;
  reviewRoles: string[];
};

export type QuestionGroup = {
  id: string;
  sequence: number;
  title: string;
  description: string;
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

export type GenerationSnapshot = {
  generationId: string;
  generatedAt: string;
  documentStatus: "DRAFT_PRE_COMPLIANCE_REVIEW";
  readyForComplianceReview: boolean;
  readyForSubmission: false;
  markdownPath?: string;
  docxPath?: string;
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
