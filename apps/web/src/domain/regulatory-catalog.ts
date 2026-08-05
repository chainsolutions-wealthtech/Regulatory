import generatedCatalog from "@/generated/regulatory-catalog.json";
import { APPLICATION_GROUPS, APPLICATION_QUESTIONS } from "./application-questions";
import { MEMBER_STATES } from "./constants";
import { STRUCTURED_QUESTION_TYPES } from "./structured-answers";
import type {
  CatalogMetadata,
  CoverageSummary,
  DisplayCondition,
  ProspectusQuestion,
  QuestionGroup,
  QuestionOption,
  QuestionSourceKind,
  QuestionType,
} from "./types";

type GeneratedRequirement = {
  requirementId: string;
  questionId: string;
  groupId: string;
  registrySequence: number;
  label: string;
  helpText: string;
  originalQuestionType: string;
  uiType: QuestionType;
  uiFallback: boolean;
  interactive: boolean;
  required: boolean;
  canonicalFieldPaths: string[];
  options: QuestionOption[];
  effects: string[];
  conditionHints: string[];
  displayCondition: DisplayCondition | null;
  clauseGroupId: string | null;
  controls: string[];
  evidenceTypes: string[];
  outputSectionId: string | null;
  reviewRoles: string[];
  implementationStatus: string;
  sourceMatrix: string;
  sourceReference: string;
  applicability: string | null;
  registryReviewStatus: string;
  defaultCoverageStatus: string;
};

type GeneratedGroup = QuestionGroup & {
  regulatoryRequirementCount: number;
  interactiveQuestionCount: number;
};

type GeneratedCatalog = {
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
  groups: GeneratedGroup[];
  requirements: GeneratedRequirement[];
};

const catalog = generatedCatalog as GeneratedCatalog;

export const CATALOG_METADATA: CatalogMetadata = {
  schemaVersion: catalog.schemaVersion,
  rulePack: catalog.rulePack,
  sourceId: catalog.sourceId,
  registryVersion: catalog.registryVersion,
  registryStatus: catalog.registryStatus,
  scope: catalog.scope,
  catalogDigest: catalog.catalogDigest,
  requirementCount: catalog.requirementCount,
  interactiveQuestionCount: catalog.interactiveQuestionCount,
  systemQuestionCount: catalog.systemQuestionCount,
  systemMetadataRequirementCount: catalog.systemMetadataRequirementCount,
};

export const REGULATORY_REQUIREMENTS = catalog.requirements;

const QUESTION_GROUPS_UNSORTED = mergeGroups(
  catalog.groups.map((group) => ({ ...group, sourceKind: "REGULATORY_MATRIX" as QuestionSourceKind })),
  APPLICATION_GROUPS,
);

const regulatoryQuestions: ProspectusQuestion[] = catalog.requirements
  .filter((requirement) => requirement.interactive)
  .map((requirement) => {
    const structuredType = STRUCTURED_QUESTION_TYPES[requirement.questionId];
    return {
      id: requirement.questionId,
      groupId: requirement.groupId,
      sequence: requirement.registrySequence,
      label: requirement.label,
      helpText: requirement.helpText,
      type: structuredType ?? normalizeUiType(requirement),
      required: requirement.required,
      interactive: true,
      fieldPath:
        canonicalPathOverride(requirement.questionId) ??
        requirement.canonicalFieldPaths[0] ??
        `regulatoryAnswers.${requirement.questionId}`,
      canonicalFieldPaths: canonicalPathsOverride(requirement.questionId) ?? requirement.canonicalFieldPaths,
      requirementIds: [requirement.requirementId],
      options: structuredType ? undefined : normalizeOptions(requirement),
      displayCondition: requirement.displayCondition ?? undefined,
      reviewRoles: requirement.reviewRoles,
      sourceKind: "REGULATORY_MATRIX" as const,
      sourceMatrix: requirement.sourceMatrix,
      sourceReference: requirement.sourceReference,
      originalQuestionType: requirement.originalQuestionType,
      implementationStatus: requirement.implementationStatus,
      applicability: requirement.applicability ?? undefined,
      effects: requirement.effects,
      controls: requirement.controls,
      evidenceTypes: requirement.evidenceTypes,
      clauseGroupId: requirement.clauseGroupId ?? undefined,
      outputSectionId: requirement.outputSectionId ?? undefined,
      uiFallback: structuredType ? false : requirement.uiFallback,
    };
  });

export const QUESTIONS: ProspectusQuestion[] = [...APPLICATION_QUESTIONS, ...regulatoryQuestions]
  .toSorted((left, right) => {
    const groupDelta = groupSequence(left.groupId) - groupSequence(right.groupId);
    return groupDelta === 0 ? left.sequence - right.sequence : groupDelta;
  });

export const QUESTION_GROUPS: QuestionGroup[] = mergeGroups(
  catalog.groups.map((group) => ({ ...group, sourceKind: "REGULATORY_MATRIX" as QuestionSourceKind })),
  APPLICATION_GROUPS,
).toSorted((left, right) => left.sequence - right.sequence);

export const KNOWN_QUESTION_IDS = new Set(QUESTIONS.map((question) => question.id));
export const REGULATORY_QUESTION_IDS = new Set(regulatoryQuestions.map((question) => question.id));
export const REQUIREMENT_IDS = new Set(catalog.requirements.map((requirement) => requirement.requirementId));

export function getQuestionById(questionId: string): ProspectusQuestion | undefined {
  return QUESTIONS.find((question) => question.id === questionId);
}

export function createEmptyCoverage(): CoverageSummary {
  const systemMetadata = CATALOG_METADATA.systemMetadataRequirementCount;
  return {
    IN_PROSPECTUS: 0,
    IN_ATTACHED_REGULATION: 0,
    IN_ATTACHED_CONSTITUTIVE_DOCUMENT: 0,
    NOT_APPLICABLE: 0,
    PENDING_REVIEW: CATALOG_METADATA.requirementCount - systemMetadata,
    MISSING: 0,
    SYSTEM_METADATA: systemMetadata,
  };
}

function normalizeUiType(requirement: GeneratedRequirement): QuestionType {
  if (requirement.originalQuestionType === "COUNTRY_MULTI_SELECT") return "MULTISELECT";
  return requirement.uiType;
}

function normalizeOptions(requirement: GeneratedRequirement): QuestionOption[] | undefined {
  if (requirement.options.length > 0) return requirement.options;
  if (requirement.originalQuestionType === "COUNTRY_MULTI_SELECT") {
    return MEMBER_STATES.map((state) => ({ ...state }));
  }
  return undefined;
}

function canonicalPathOverride(questionId: string): string | undefined {
  return {
    Q_SHARE_CLASSES_COUNT: "share_classes",
    Q_ASSET_EXPOSURE_MATRIX: "investment_policy.asset_class_ranges",
    Q_TRANSACTION_FEES: "fees.transaction",
    Q_REMUNERATION_DETAILS: "remunerations",
    Q_VALUATION_METHODS: "valuation.methods",
    Q_CONFIRM_GOVERNANCE_MEMBERS: "manager.governance_members",
    Q_HOME_STATE_ARRANGEMENTS: "distribution_countries",
    Q_MARKETING_COUNTRIES: "distribution.marketing_country_codes",
  }[questionId];
}

function canonicalPathsOverride(questionId: string): string[] | undefined {
  const path = canonicalPathOverride(questionId);
  return path ? [path] : undefined;
}

function mergeGroups(...sources: QuestionGroup[][]): QuestionGroup[] {
  const groups = new Map<string, QuestionGroup>();
  for (const source of sources) {
    for (const group of source) {
      const existing = groups.get(group.id);
      groups.set(group.id, existing ? { ...existing, ...group, sequence: Math.min(existing.sequence, group.sequence) } : group);
    }
  }
  return [...groups.values()];
}

function groupSequence(groupId: string): number {
  return QUESTION_GROUPS_UNSORTED.find((group) => group.id === groupId)?.sequence ?? 999;
}
