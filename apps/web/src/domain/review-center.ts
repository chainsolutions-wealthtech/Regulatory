import type { ProspectusRole } from "@/domain/authorization";
import type { ReviewRequestRecord } from "@/domain/review-types";

export const REVIEW_CENTER_ROLES = [
  "RISK",
  "OPERATIONS",
  "COMPLIANCE",
  "LEGAL",
  "TAX",
  "SECURITY",
] as const satisfies readonly ProspectusRole[];

export const REVIEW_CENTER_OPEN_STATUSES = [
  "REQUESTED",
  "IN_PROGRESS",
  "CHANGES_REQUESTED",
] as const satisfies readonly ReviewRequestRecord["status"][];

export type ReviewCenterRoleFilter = (typeof REVIEW_CENTER_ROLES)[number] | "ALL";
export type ReviewCenterStatusFilter =
  | (typeof REVIEW_CENTER_OPEN_STATUSES)[number]
  | "OPEN";

export type ReviewCenterFilters = {
  query: string;
  role: ReviewCenterRoleFilter;
  status: ReviewCenterStatusFilter;
};

export type ReviewRequestUrgency = {
  label: "Correction requise" | "Échéance dépassée" | "En cours" | "À prendre";
  tone: "danger" | "warning" | "info";
  rank: number;
};

export function normalizeReviewCenterFilters(
  params: Record<string, string | string[] | undefined>,
): ReviewCenterFilters {
  const query = first(params.q).trim().slice(0, 80);
  const roleValue = first(params.role).toUpperCase();
  const statusValue = first(params.status).toUpperCase();

  const role: ReviewCenterRoleFilter = REVIEW_CENTER_ROLES.includes(
    roleValue as (typeof REVIEW_CENTER_ROLES)[number],
  )
    ? (roleValue as (typeof REVIEW_CENTER_ROLES)[number])
    : "ALL";

  const status: ReviewCenterStatusFilter = REVIEW_CENTER_OPEN_STATUSES.includes(
    statusValue as (typeof REVIEW_CENTER_OPEN_STATUSES)[number],
  )
    ? (statusValue as (typeof REVIEW_CENTER_OPEN_STATUSES)[number])
    : "OPEN";

  return { query, role, status };
}

export function reviewRequestMatchesFilters(
  project: { name: string },
  request: ReviewRequestRecord,
  filters: ReviewCenterFilters,
): boolean {
  if (filters.role !== "ALL" && request.role !== filters.role) return false;
  if (
    filters.status !== "OPEN" &&
    request.status !== filters.status
  ) {
    return false;
  }
  if (!REVIEW_CENTER_OPEN_STATUSES.includes(request.status as (typeof REVIEW_CENTER_OPEN_STATUSES)[number])) {
    return false;
  }

  const query = filters.query.toLocaleLowerCase("fr-FR");
  if (!query) return true;
  const haystack = [
    project.name,
    request.role,
    request.status,
    request.assignedTo ?? "",
    ...Object.keys(request.scope ?? {}),
  ]
    .join(" ")
    .toLocaleLowerCase("fr-FR");
  return haystack.includes(query);
}

export function reviewRequestUrgency(
  request: ReviewRequestRecord,
  now = new Date(),
): ReviewRequestUrgency {
  if (request.status === "CHANGES_REQUESTED") {
    return { label: "Correction requise", tone: "danger", rank: 0 };
  }
  if (request.dueAt) {
    const due = Date.parse(request.dueAt);
    if (Number.isFinite(due) && due < now.getTime()) {
      return { label: "Échéance dépassée", tone: "danger", rank: 1 };
    }
  }
  if (request.status === "IN_PROGRESS") {
    return { label: "En cours", tone: "info", rank: 2 };
  }
  return { label: "À prendre", tone: "warning", rank: 3 };
}

export function reviewScopeKeys(request: ReviewRequestRecord): string[] {
  return Object.keys(request.scope ?? {}).sort().slice(0, 4);
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}
