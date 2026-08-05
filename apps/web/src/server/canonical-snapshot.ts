import "server-only";

import { CATALOG_METADATA, getQuestionById } from "@/domain/regulatory-catalog";
import { validateProject } from "@/domain/questionnaire";
import type {
  CanonicalAnswerRecord,
  CanonicalSnapshot,
  ProspectusProject,
} from "@/domain/types";

export function buildCanonicalSnapshot(project: ProspectusProject): CanonicalSnapshot {
  const canonicalData: Record<string, unknown> = {};
  const structuredAnswers: CanonicalSnapshot["structuredAnswers"] = {};
  const answerRecords: CanonicalAnswerRecord[] = [];
  const legacyUnmappedAnswers: string[] = [];

  for (const [questionId, answer] of Object.entries(project.answers).toSorted(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const question = getQuestionById(questionId);
    if (!question) {
      legacyUnmappedAnswers.push(questionId);
      continue;
    }

    const canonicalFieldPaths = question.canonicalFieldPaths ?? [question.fieldPath];
    structuredAnswers[questionId] = {
      canonicalFieldPaths,
      value: answer.value,
    };

    for (const fieldPath of canonicalFieldPaths) {
      setCanonicalValue(canonicalData, fieldPath, answer.value);
    }

    answerRecords.push({
      questionId,
      requirementIds: question.requirementIds,
      canonicalFieldPaths,
      value: answer.value,
      source: answer.source,
      reviewStatus: answer.reviewStatus,
      sourceKind: question.sourceKind,
      sourceReference: question.sourceReference,
    });
  }

  return {
    schemaVersion: "WEB_CANONICAL_SNAPSHOT_V1",
    projectId: project.id,
    projectVersion: project.version,
    catalogDigest: CATALOG_METADATA.catalogDigest,
    rulePack: CATALOG_METADATA.rulePack,
    requirementCount: CATALOG_METADATA.requirementCount,
    readyForSubmission: false,
    canonicalData,
    structuredAnswers,
    answerRecords,
    legacyUnmappedAnswers,
    coverage: structuredClone(project.coverage),
    findings: validateProject(project),
  };
}

function setCanonicalValue(root: Record<string, unknown>, fieldPath: string, value: unknown): void {
  if (!fieldPath || fieldPath.includes("[]")) {
    const repeating = getOrCreateRecord(root, "_repeating");
    repeating[fieldPath || "_unknown"] = value;
    return;
  }

  const segments = fieldPath.split(".").filter(Boolean);
  if (segments.length === 0) return;

  let cursor: Record<string, unknown> = root;
  for (const segment of segments.slice(0, -1)) {
    cursor = getOrCreateRecord(cursor, segment);
  }
  cursor[segments.at(-1)!] = value;
}

function getOrCreateRecord(parent: Record<string, unknown>, key: string): Record<string, unknown> {
  const current = parent[key];
  if (current && typeof current === "object" && !Array.isArray(current)) {
    return current as Record<string, unknown>;
  }
  const created: Record<string, unknown> = {};
  parent[key] = created;
  return created;
}
