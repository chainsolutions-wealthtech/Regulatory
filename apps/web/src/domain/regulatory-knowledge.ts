import knowledge from "@/generated/regulatory-knowledge.json";

export type RegulatorySourceType = "INSTRUCTION" | "CIRCULAR" | "DECISION";

export type RegulatoryRegistrySource = {
  sourceKey: string;
  type: RegulatorySourceType;
  actualiteId: number;
  number: number | null;
  year: number | null;
  reference: string;
  title: string;
  summary: string;
  category: string | null;
  portalDate: string | null;
  portalValid: boolean | null;
  portalAbrogated: boolean | null;
  documentUrl: string | null;
  documentPresent: boolean;
  documentBase64Sha256: string | null;
  apiUrl: string | null;
  rawSha256: string | null;
  sanctions2022ReferenceMatch: boolean;
  sanctionsSubjectMatch: boolean;
};

export type MaterializedRegulatorySource = {
  sourceId: string;
  title: string;
  sourceUrl: string | null;
  retrievedAt: string | null;
  repositoryCopy: string | null;
  extractedText: string | null;
  sha256: string | null;
  byteSize: number | null;
  pageCount: number | null;
  extractionStatus: string | null;
  legalReviewStatus: string | null;
};

export type Inst066RequirementCandidate = {
  id: string;
  sourceId: string;
  articleNumber: number;
  sourcePages: number[];
  normalizedRequirementCandidate: string;
  applicabilityCandidate: string;
  products: string[];
  documentTypes: string[];
  canonicalFields: string[];
  questionIds: string[];
  clauseGroupIds: string[];
  controlIds: string[];
  evidenceTypes: string[];
  outputSectionIds: string[];
  reviewRoles: string[];
  circ005RequirementLinks: string[];
  status: string;
  activation: "FORBIDDEN";
  legalReviewStatus: string;
  complianceReviewStatus: string;
  sourceTextExcerpt: string;
  provenance: {
    sourceArtifact?: string;
    ocrDerivative?: string;
    articleBlock?: string;
    textQuality?: string;
  };
};

export type RegulatoryDependency = {
  dependencyId: string;
  articleNumber: number;
  articleTitle: string;
  dependencyKind: string;
  sourceWording: string;
  sourceContextExcerpt: string;
  rawReferenceStatus: string;
  effectiveReferenceStatus: string;
  resolvedSourceId: string | null;
  officialReference: string | null;
  resolutionOrigin: string;
  resolutionOverlayRegistry: string | null;
  activation: "FORBIDDEN";
  legalReviewStatus: string;
  complianceReviewStatus: string;
};

export const REGULATORY_KNOWLEDGE_METADATA = {
  schemaVersion: knowledge.schemaVersion,
  catalogDigest: knowledge.catalogDigest,
  sourceCounts: knowledge.sourceCounts,
  inst066: {
    sourceId: knowledge.inst066.sourceId,
    sourceSha256: knowledge.inst066.sourceSha256,
    status: knowledge.inst066.status,
    activation: knowledge.inst066.activation,
    requirementCandidateCount: knowledge.inst066.requirementCandidateCount,
    caveat: knowledge.inst066.caveat,
  },
  dependencyStatus: knowledge.dependencies.status,
  dependencySummary: knowledge.dependencies.summary,
  dependencyBoundary: knowledge.dependencies.boundary,
} as const;

export const REGULATORY_REGISTRY_SOURCES =
  knowledge.sourceCatalogs as RegulatoryRegistrySource[];

export const MATERIALIZED_REGULATORY_SOURCES =
  knowledge.materializedSources as MaterializedRegulatorySource[];

export const INST066_REQUIREMENT_CANDIDATES =
  knowledge.inst066.requirements as Inst066RequirementCandidate[];

export const REGULATORY_DEPENDENCIES =
  knowledge.dependencies.items as RegulatoryDependency[];
