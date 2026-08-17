import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import { seedProjects } from "@/data/seed-projects";
import { createEmptyCoverage } from "@/domain/regulatory-catalog";
import { migrateProjectToCurrentCatalog, validateProject } from "@/domain/questionnaire";
import type { GenerationSnapshot, ProjectAnswer, ProspectusProject } from "@/domain/types";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

export type ProjectVersionSummary = {
  version: number;
  createdAt: string;
  answerCount: number;
  frozen: boolean;
};

export interface ProjectVersionRepository {
  readonly driver: "local-json" | "postgresql";
  listProjectVersions(projectId: string): Promise<ProjectVersionSummary[]>;
  getProjectVersion(projectId: string, version: number): Promise<ProspectusProject | null>;
}

const LOCAL_DATA_ROOT = process.env.REGULATORY_LOCAL_DATA_ROOT
  ? path.resolve(process.env.REGULATORY_LOCAL_DATA_ROOT)
  : path.join(process.cwd(), ".local-data", "projects");

export const localProjectVersionRepository: ProjectVersionRepository = {
  driver: "local-json",

  async listProjectVersions(projectId) {
    const directory = localVersionsDirectory(projectId);
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    const versions: ProjectVersionSummary[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !/^\d{5}\.json$/.test(entry.name)) continue;
      const project = await readLocalVersionFile(path.join(directory, entry.name));
      if (!project) continue;
      versions.push({
        version: project.version,
        createdAt: project.updatedAt,
        answerCount: Object.keys(project.answers ?? {}).length,
        frozen: false,
      });
    }

    if (versions.length === 0) {
      const seed = seedProjects.find((project) => project.id === projectId);
      if (seed) {
        const hydrated = hydrateHistoricalProject(structuredClone(seed));
        versions.push({
          version: hydrated.version,
          createdAt: hydrated.updatedAt,
          answerCount: Object.keys(hydrated.answers ?? {}).length,
          frozen: false,
        });
      }
    }

    return versions.toSorted((left, right) => right.version - left.version);
  },

  async getProjectVersion(projectId, version) {
    if (!Number.isInteger(version) || version <= 0) return null;
    const filePath = path.join(localVersionsDirectory(projectId), `${String(version).padStart(5, "0")}.json`);
    const stored = await readLocalVersionFile(filePath);
    if (stored) return hydrateHistoricalProject(stored);
    const seed = seedProjects.find((project) => project.id === projectId && project.version === version);
    return seed ? hydrateHistoricalProject(structuredClone(seed)) : null;
  },
};

export function createPostgresProjectVersionRepository(options: {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
}): ProjectVersionRepository {
  return {
    driver: "postgresql",

    async listProjectVersions(projectId) {
      const identity = await resolveIdentity(options.identityProvider);
      return withTenantReadTransaction(options.pool, identity, async (client) => {
        const project = await client.query(
          `select 1 from regulatory.projects where id = $1 and archived_at is null`,
          [projectId],
        );
        if (project.rowCount !== 1) return [];
        const result = await client.query<VersionSummaryRow>(
          `select v.version_number,
                  v.created_at,
                  v.frozen_at,
                  count(a.id)::int as answer_count
             from regulatory.project_versions v
             left join regulatory.project_answers a on a.project_version_id = v.id
            where v.project_id = $1
            group by v.id, v.version_number, v.created_at, v.frozen_at
            order by v.version_number desc`,
          [projectId],
        );
        return result.rows.map((row) => ({
          version: Number(row.version_number),
          createdAt: iso(row.created_at),
          answerCount: Number(row.answer_count),
          frozen: row.frozen_at !== null,
        }));
      });
    },

    async getProjectVersion(projectId, version) {
      if (!Number.isInteger(version) || version <= 0) return null;
      const identity = await resolveIdentity(options.identityProvider);
      return withTenantReadTransaction(options.pool, identity, async (client) => {
        const projectResult = await client.query<ProjectRow>(
          `select * from regulatory.projects where id = $1 and archived_at is null`,
          [projectId],
        );
        if (projectResult.rowCount !== 1) return null;
        const versionResult = await client.query<VersionRow>(
          `select * from regulatory.project_versions
            where project_id = $1 and version_number = $2
            limit 1`,
          [projectId, version],
        );
        if (versionResult.rowCount !== 1) return null;
        return hydratePostgresVersion(client, projectResult.rows[0], versionResult.rows[0]);
      });
    },
  };
}

type VersionSummaryRow = QueryResultRow & {
  version_number: number;
  created_at: Date | string;
  frozen_at: Date | string | null;
  answer_count: number;
};

type ProjectRow = QueryResultRow & {
  id: string;
  legal_name: string;
  category: ProspectusProject["category"];
  operation: ProspectusProject["operation"];
  status: ProspectusProject["status"];
  created_by: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type VersionRow = QueryResultRow & {
  id: string;
  version_number: number;
  created_at: Date | string;
};

type AnswerRow = QueryResultRow & {
  question_id: string;
  value: unknown;
  source: ProjectAnswer["source"];
  review_status: ProjectAnswer["reviewStatus"];
  updated_by: string;
  updated_at: Date | string;
};

async function hydratePostgresVersion(
  client: PoolClient,
  projectRow: ProjectRow,
  versionRow: VersionRow,
): Promise<ProspectusProject> {
  const [answersResult, snapshotResult, generationResult] = await Promise.all([
    client.query<AnswerRow>(
      `select question_id, value, source, review_status, updated_by, updated_at
         from regulatory.project_answers
        where project_version_id = $1
        order by question_id`,
      [versionRow.id],
    ),
    client.query<{ coverage: unknown; findings: unknown }>(
      `select coverage, findings
         from regulatory.canonical_snapshots
        where project_version_id = $1
        order by created_at desc
        limit 1`,
      [versionRow.id],
    ),
    client.query<{ generation_manifest: Record<string, unknown> }>(
      `select generation_manifest
         from regulatory.generated_documents
        where project_version_id = $1
        order by created_at desc
        limit 1`,
      [versionRow.id],
    ),
  ]);

  const answers = Object.fromEntries(
    answersResult.rows.map((row) => [
      row.question_id,
      {
        questionId: row.question_id,
        value: normalizeJsonValue(row.value),
        updatedAt: iso(row.updated_at),
        updatedBy: row.updated_by,
        source: row.source,
        reviewStatus: row.review_status,
      } satisfies ProjectAnswer,
    ]),
  );
  const shareClassAnswer = answers.Q_SHARE_CLASSES_COUNT?.value;
  const generationManifest = generationResult.rows[0]?.generation_manifest;
  const generation = isRecord(generationManifest?.project_generation)
    ? (generationManifest.project_generation as unknown as GenerationSnapshot)
    : undefined;

  const project: ProspectusProject = {
    id: projectRow.id,
    name: projectRow.legal_name,
    fundType: "FCP",
    category: projectRow.category,
    jurisdiction: "UMOA",
    authority: "AMF-UMOA",
    operation: projectRow.operation,
    status: projectRow.status,
    createdAt: iso(projectRow.created_at),
    updatedAt: iso(versionRow.created_at),
    createdBy: projectRow.created_by,
    managementCompany: {
      legalName: String(answers.Q_SELECT_MANAGEMENT_COMPANY?.value ?? "À confirmer"),
      approvalNumber: optionalString(answers.APP_MANAGER_APPROVAL_NUMBER?.value),
      verificationStatus:
        String(answers.APP_MANAGER_PROFILE_CONFIRMED?.value) === "true"
          ? "VERIFIED"
          : "PREFILLED_PENDING_CONFIRMATION",
    },
    fund: {
      legalName: String(answers.Q_FUND_LEGAL_NAME?.value ?? projectRow.legal_name),
      countryCode: String(answers.APP_HOME_STATE?.value ?? "CI"),
      currency: String(answers.APP_FUND_CURRENCY?.value ?? "XOF"),
      shareClassCount: Array.isArray(shareClassAnswer)
        ? shareClassAnswer.length
        : String(shareClassAnswer) === "true"
          ? 2
          : 1,
    },
    answers,
    coverage: isCoverage(snapshotResult.rows[0]?.coverage)
      ? snapshotResult.rows[0].coverage
      : createEmptyCoverage(),
    findings: Array.isArray(snapshotResult.rows[0]?.findings)
      ? snapshotResult.rows[0].findings
      : [],
    generation,
    version: Number(versionRow.version_number),
  };
  return hydrateHistoricalProject(project);
}

async function withTenantReadTransaction<T>(
  pool: Pool,
  identity: VerifiedIdentityContext,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin read only");
    await client.query("select set_config('app.current_organization_id', $1, true)", [identity.organizationId]);
    const membership = await client.query(
      `select 1 from regulatory.organization_memberships
        where organization_id = $1 and user_id = $2 and revoked_at is null
        limit 1`,
      [identity.organizationId, identity.userId],
    );
    if (membership.rowCount !== 1) throw new Error("IDENTITY_ORGANIZATION_MEMBERSHIP_REQUIRED");
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function resolveIdentity(provider: VerifiedIdentityProvider): Promise<VerifiedIdentityContext> {
  return assertVerifiedIdentity(await provider.getVerifiedIdentity());
}

async function readLocalVersionFile(filePath: string): Promise<ProspectusProject | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as ProspectusProject;
  } catch {
    return null;
  }
}

function localVersionsDirectory(projectId: string): string {
  if (!/^[a-z0-9-]+$/i.test(projectId)) throw new Error("INVALID_IDENTIFIER");
  return path.join(LOCAL_DATA_ROOT, projectId, "versions");
}

function hydrateHistoricalProject(project: ProspectusProject): ProspectusProject {
  const migrated = migrateProjectToCurrentCatalog(project);
  migrated.findings = validateProject(migrated);
  return migrated;
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeJsonValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isCoverage(value: unknown): value is ProspectusProject["coverage"] {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
