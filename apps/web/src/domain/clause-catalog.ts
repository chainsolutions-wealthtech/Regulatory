import generatedClauseCatalog from "@/generated/clause-catalog.json";

export type ClauseCategory =
  | "LOCKED_REGULATORY"
  | "VALIDATED_PARAMETERIZED"
  | "CONDITIONAL"
  | "COMPOSED"
  | "FACTUAL"
  | string;

export type GeneratedClause = {
  clauseId: string;
  version: number;
  category: ClauseCategory;
  status: string;
  sectionId: string;
  requirementIds: string[];
  fieldPaths: string[];
  condition: unknown | null;
  wording: string;
};

type GeneratedClauseCatalog = {
  schemaVersion: string;
  generatedBy: string;
  doNotEdit: boolean;
  clauseCatalogVersion: string;
  catalogDigest: string;
  clauseCount: number;
  categoryCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  clauses: GeneratedClause[];
};

const catalog = generatedClauseCatalog as GeneratedClauseCatalog;

export const CLAUSE_CATALOG_METADATA = {
  schemaVersion: catalog.schemaVersion,
  clauseCatalogVersion: catalog.clauseCatalogVersion,
  catalogDigest: catalog.catalogDigest,
  clauseCount: catalog.clauseCount,
  categoryCounts: catalog.categoryCounts,
  statusCounts: catalog.statusCounts,
  generatedBy: catalog.generatedBy,
  doNotEdit: catalog.doNotEdit,
};

export const CLAUSE_CATALOG = catalog.clauses;

export function getClauseById(clauseId: string): GeneratedClause | undefined {
  return CLAUSE_CATALOG.find((clause) => clause.clauseId === clauseId);
}
