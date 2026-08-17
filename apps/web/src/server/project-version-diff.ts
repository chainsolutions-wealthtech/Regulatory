import type { ProspectusProject } from "@/domain/types";

export type ProjectVersionDiff = {
  fromVersion: number;
  toVersion: number;
  changedAnswerIds: string[];
  addedAnswerIds: string[];
  removedAnswerIds: string[];
  changedAnswerCount: number;
  addedAnswerCount: number;
  removedAnswerCount: number;
  readyForSubmission: false;
};

/**
 * Compare deux snapshots déjà chargés sans aucune mutation ni restauration.
 * Le tri des clés objet rend la comparaison indépendante de l'ordre
 * d'insertion JSON et donc stable entre les drivers local et PostgreSQL.
 */
export function buildProjectVersionDiff(
  fromProject: ProspectusProject,
  toProject: ProspectusProject,
): ProjectVersionDiff {
  const fromIds = new Set(Object.keys(fromProject.answers));
  const toIds = new Set(Object.keys(toProject.answers));
  const addedAnswerIds = [...toIds].filter((id) => !fromIds.has(id)).toSorted();
  const removedAnswerIds = [...fromIds].filter((id) => !toIds.has(id)).toSorted();
  const changedAnswerIds = [...fromIds]
    .filter(
      (id) =>
        toIds.has(id) &&
        stableSerialize(fromProject.answers[id]?.value) !==
          stableSerialize(toProject.answers[id]?.value),
    )
    .toSorted();

  return {
    fromVersion: fromProject.version,
    toVersion: toProject.version,
    changedAnswerIds,
    addedAnswerIds,
    removedAnswerIds,
    changedAnswerCount: changedAnswerIds.length,
    addedAnswerCount: addedAnswerIds.length,
    removedAnswerCount: removedAnswerIds.length,
    readyForSubmission: false,
  };
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableSerialize(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
