import { createHash, randomUUID } from "node:crypto";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import { CATALOG_METADATA, createEmptyCoverage, getQuestionById } from "@/domain/regulatory-catalog";
import {
  migrateProjectToCurrentCatalog,
  sanitizeAnswersAfterChange,
  toProjectSummary,
  validateProject,
} from "@/domain/questionnaire";
import { normalizeQuestionValueForPersistence } from "@/domain/structured-answers";
import type {
  CanonicalSnapshot,
  GenerationSnapshot,
  ProjectAnswer,
  ProspectusProject,
  ProjectSummary,
} from "@/domain/types";
import { buildCanonicalSnapshot } from "@/server/canonical-snapshot";
import type { ArtifactStore, StagedArtifactBatch } from "@/server/storage/artifact-store";
import type {
  CreateProjectInput,
  PersistGenerationInput,
  ProjectRepository,
  SaveAnswerInput,
} from "@/server/storage/project-repository";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

export type PostgresProjectRepositoryOptions = {
  pool: Pool;
  identityProvider: VerifiedIdentityProvider;
  artifactStore: ArtifactStore;
};

type ProjectRow = QueryResultRow & {
  id: string;
  organization_id: string;
  canonical_slug: string;
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
  schema_version: string;
  catalog_digest: string;
  created_at: Date | string;
  frozen_at: Date | string | null;
};

type AnswerRow = QueryResultRow & {
  question_id: string;
  value: unknown;
  source: ProjectAnswer["source"];
  review_status: ProjectAnswer["reviewStatus"];
  updated_by: string;
  updated_at: Date | string;
};

export function createPostgresProjectRepository(
  options: PostgresProjectRepositoryOptions,
): ProjectRepository {
  const { pool, identityProvider, artifactStore } = options;

  return {
    driver: "postgresql",

    async listProjects(): Promise<ProjectSummary[]> {
      const identity = await resolveIdentity(identityProvider);
      return withTenantTransaction(pool, identity, async (client) => {
        const result = await client.query<{ id: string }>(
          `select id
             from regulatory.projects
            where archived_at is null
            order by updated_at desc, id`,
        );
        const summaries: ProjectSummary[] = [];
        for (const row of result.rows) {
          const project = await loadProject(client, row.id);
          if (project) summaries.push(toProjectSummary(project));
        }
        return summaries;
      });
    },

    async getProject(projectId: string): Promise<ProspectusProject | null> {
      const identity = await resolveIdentity(identityProvider);
      return withTenantTransaction(pool, identity, (client) => loadProject(client, projectId));
    },

    async createProject(input: CreateProjectInput): Promise<ProspectusProject> {
      const identity = await resolveIdentity(identityProvider);
      return withTenantTransaction(pool, identity, async (client) => {
        const now = new Date().toISOString();
        const projectId = randomUUID();
        const versionId = randomUUID();
        const canonicalSlug = `${slugify(input.name)}-${projectId.slice(0, 8)}`;
        const projectResult = await client.query<ProjectRow>(
          `insert into regulatory.projects (
             id, organization_id, canonical_slug, legal_name, category, operation,
             status, created_by, created_at, updated_at
           ) values ($1, $2, $3, $4, $5, $6, 'DRAFT', $7, $8, $8)
           returning *`,
          [
            projectId,
            identity.organizationId,
            canonicalSlug,
            input.name.trim(),
            input.category,
            input.operation,
            identity.userId,
            now,
          ],
        );
        await client.query(
          `insert into regulatory.project_versions (
             id, organization_id, project_id, version_number, schema_version,
             catalog_digest, created_by, created_at
           ) values ($1, $2, $3, 1, $4, $5, $6, $7)`,
          [
            versionId,
            identity.organizationId,
            projectId,
            "PROSPECTUS_CANONICAL_MODEL_V1",
            CATALOG_METADATA.catalogDigest,
            identity.userId,
            now,
          ],
        );

        const initialAnswers = initialProjectAnswers(input, identity.userId, now);
        await insertAnswers(client, identity, versionId, initialAnswers);
        let project = hydrateProject(
          projectResult.rows[0],
          {
            id: versionId,
            version_number: 1,
            schema_version: "PROSPECTUS_CANONICAL_MODEL_V1",
            catalog_digest: CATALOG_METADATA.catalogDigest,
            created_at: now,
            frozen_at: null,
          },
          initialAnswers,
          null,
          null,
        );
        const snapshot = buildCanonicalSnapshot(project);
        await persistSnapshotAndCollections(client, identity, versionId, snapshot);
        await appendAuditEvent(client, identity, {
          projectId,
          projectVersionId: versionId,
          eventType: "PROJECT_CREATED",
          entityType: "project",
          entityId: projectId,
          payload: {
            canonicalSlug,
            category: input.category,
            operation: input.operation,
            versionNumber: 1,
          },
        });
        project = {
          ...project,
          coverage: snapshot.coverage,
          findings: snapshot.findings,
        };
        return project;
      });
    },

    async saveAnswer(input: SaveAnswerInput): Promise<ProspectusProject> {
      const identity = await resolveIdentity(identityProvider);
      return withTenantTransaction(pool, identity, async (client) => {
        const locked = await loadProjectForUpdate(client, input.projectId);
        if (!locked) throw new Error("PROJECT_NOT_FOUND");
        assertExpectedVersion(input.expectedVersion, locked.project.version);
        if (locked.version.frozen_at) throw new Error("PROJECT_VERSION_FROZEN");

        const question = getQuestionById(input.questionId);
        if (!question || question.interactive === false) {
          throw new Error("QUESTION_UNKNOWN_OR_NON_INTERACTIVE");
        }
        const normalizedValue = normalizeQuestionValueForPersistence(
          input.questionId,
          input.value,
          {
            currency: locked.project.fund.currency,
            countryCode: locked.project.fund.countryCode,
          },
        );
        const now = new Date().toISOString();
        const updatedBy = input.updatedBy ?? identity.userId;
        const nextProject: ProspectusProject = structuredClone(locked.project);
        nextProject.answers[input.questionId] = {
          questionId: input.questionId,
          value: normalizedValue,
          updatedAt: now,
          updatedBy,
          source: "USER",
          reviewStatus: "UNREVIEWED",
        };
        nextProject.updatedAt = now;
        nextProject.version += 1;
        nextProject.status = "QUESTIONNAIRE_IN_PROGRESS";
        nextProject.answers = sanitizeAnswersAfterChange(nextProject);
        applyProjectMetadataAnswers(nextProject);

        const nextVersionId = randomUUID();
        await client.query(
          `insert into regulatory.project_versions (
             id, organization_id, project_id, version_number, schema_version,
             catalog_digest, source_version_id, change_summary, created_by, created_at
           ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            nextVersionId,
            identity.organizationId,
            input.projectId,
            nextProject.version,
            "PROSPECTUS_CANONICAL_MODEL_V1",
            CATALOG_METADATA.catalogDigest,
            locked.version.id,
            `Réponse ${input.questionId} mise à jour`,
            identity.userId,
            now,
          ],
        );
        await insertAnswers(client, identity, nextVersionId, nextProject.answers);
        await client.query(
          `update regulatory.projects
              set legal_name = $1,
                  category = $2,
                  operation = $3,
                  status = $4,
                  updated_at = $5
            where id = $6`,
          [
            nextProject.name,
            nextProject.category,
            nextProject.operation,
            nextProject.status,
            now,
            input.projectId,
          ],
        );

        const snapshot = buildCanonicalSnapshot(nextProject);
        await persistSnapshotAndCollections(client, identity, nextVersionId, snapshot);
        await appendAuditEvent(client, identity, {
          projectId: input.projectId,
          projectVersionId: nextVersionId,
          eventType: "ANSWER_SAVED",
          entityType: "project_answer",
          entityId: input.questionId,
          payload: {
            questionId: input.questionId,
            versionNumber: nextProject.version,
            expectedVersion: input.expectedVersion ?? null,
            reviewStatus: "UNREVIEWED",
          },
        });
        return {
          ...nextProject,
          coverage: snapshot.coverage,
          findings: validateProject(nextProject),
          catalog: catalogMetadata(),
        };
      });
    },

    async persistGenerationArtifacts(input: PersistGenerationInput): Promise<ProspectusProject> {
      const identity = await resolveIdentity(identityProvider);
      const staged = await artifactStore.stage({
        organizationId: identity.organizationId,
        projectId: input.projectId,
        generationId: input.generation.generationId,
        artifacts: input.artifacts,
      });
      try {
        const project = await withTenantTransaction(pool, identity, async (client) => {
          const locked = await loadProjectForUpdate(client, input.projectId);
          if (!locked) throw new Error("PROJECT_NOT_FOUND");
          assertExpectedVersion(input.expectedVersion, locked.project.version);
          if (input.canonicalSnapshot.projectVersion !== locked.project.version) {
            throw new Error(
              `CANONICAL_SNAPSHOT_VERSION_CONFLICT:${input.canonicalSnapshot.projectVersion}:${locked.project.version}`,
            );
          }
          const snapshotId = await persistSnapshotAndCollections(
            client,
            identity,
            locked.version.id,
            input.canonicalSnapshot,
          );
          await persistGeneratedDocuments(
            client,
            identity,
            locked.version.id,
            snapshotId,
            input.generation,
            staged,
          );
          await client.query(
            `update regulatory.projects
                set status = 'PRE_COMPLIANCE_REVIEW', updated_at = $1
              where id = $2`,
            [input.generation.generatedAt, input.projectId],
          );
          await appendAuditEvent(client, identity, {
            projectId: input.projectId,
            projectVersionId: locked.version.id,
            eventType: "DOCUMENT_BUNDLE_GENERATED",
            entityType: "generated_document_bundle",
            entityId: input.generation.generationId,
            payload: {
              generationId: input.generation.generationId,
              artifactCount: staged.artifacts.length,
              snapshotId,
              readyForSubmission: false,
            },
          });
          return {
            ...locked.project,
            status: "PRE_COMPLIANCE_REVIEW" as const,
            updatedAt: input.generation.generatedAt,
            generation: input.generation,
            coverage: input.canonicalSnapshot.coverage,
            findings: input.canonicalSnapshot.findings,
          };
        });
        await staged.commit();
        return project;
      } catch (error) {
        await staged.rollback();
        throw error;
      }
    },
  };
}

async function resolveIdentity(
  provider: VerifiedIdentityProvider,
): Promise<VerifiedIdentityContext> {
  return assertVerifiedIdentity(await provider.getVerifiedIdentity());
}

async function withTenantTransaction<T>(
  pool: Pool,
  identity: VerifiedIdentityContext,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.current_organization_id', $1, true)", [
      identity.organizationId,
    ]);
    const membership = await client.query(
      `select 1
         from regulatory.organization_memberships
        where organization_id = $1
          and user_id = $2
          and revoked_at is null
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

async function loadProject(
  client: PoolClient,
  projectId: string,
): Promise<ProspectusProject | null> {
  const projectResult = await client.query<ProjectRow>(
    `select * from regulatory.projects where id = $1 and archived_at is null`,
    [projectId],
  );
  if (projectResult.rowCount !== 1) return null;
  const versionResult = await client.query<VersionRow>(
    `select *
       from regulatory.project_versions
      where project_id = $1
      order by version_number desc
      limit 1`,
    [projectId],
  );
  if (versionResult.rowCount !== 1) throw new Error("PROJECT_VERSION_NOT_FOUND");
  return hydrateLoadedProject(client, projectResult.rows[0], versionResult.rows[0]);
}

async function loadProjectForUpdate(
  client: PoolClient,
  projectId: string,
): Promise<{ project: ProspectusProject; version: VersionRow } | null> {
  const projectResult = await client.query<ProjectRow>(
    `select *
       from regulatory.projects
      where id = $1 and archived_at is null
      for update`,
    [projectId],
  );
  if (projectResult.rowCount !== 1) return null;
  const versionResult = await client.query<VersionRow>(
    `select *
       from regulatory.project_versions
      where project_id = $1
      order by version_number desc
      limit 1
      for update`,
    [projectId],
  );
  if (versionResult.rowCount !== 1) throw new Error("PROJECT_VERSION_NOT_FOUND");
  return {
    project: await hydrateLoadedProject(client, projectResult.rows[0], versionResult.rows[0]),
    version: versionResult.rows[0],
  };
}

async function hydrateLoadedProject(
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
  const generationManifest = generationResult.rows[0]?.generation_manifest;
  const generation = isRecord(generationManifest?.project_generation)
    ? (generationManifest?.project_generation as unknown as GenerationSnapshot)
    : undefined;
  return hydrateProject(
    projectRow,
    versionRow,
    answers,
    snapshotResult.rows[0] ?? null,
    generation ?? null,
  );
}

function hydrateProject(
  projectRow: ProjectRow,
  versionRow: VersionRow,
  answers: Record<string, ProjectAnswer>,
  snapshot: { coverage: unknown; findings: unknown } | null,
  generation: GenerationSnapshot | null,
): ProspectusProject {
  const shareClassAnswer = answers.Q_SHARE_CLASSES_COUNT?.value;
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
    updatedAt: iso(projectRow.updated_at),
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
    coverage: isCoverage(snapshot?.coverage) ? snapshot.coverage : createEmptyCoverage(),
    findings: Array.isArray(snapshot?.findings) ? snapshot.findings : [],
    generation: generation ?? undefined,
    catalog: catalogMetadata(),
    version: Number(versionRow.version_number),
  };
  const migrated = migrateProjectToCurrentCatalog(project);
  migrated.findings = validateProject(migrated);
  return migrated;
}

function initialProjectAnswers(
  input: CreateProjectInput,
  userId: string,
  now: string,
): Record<string, ProjectAnswer> {
  const values: Record<string, unknown> = {
    APP_PROJECT_OPERATION: input.operation,
    APP_FUND_CATEGORY: input.category,
    APP_HOME_STATE: input.countryCode,
    Q_SELECT_MANAGEMENT_COMPANY: input.managementCompanyName,
    APP_MANAGER_PROFILE_CONFIRMED: "false",
    Q_FUND_LEGAL_NAME: input.name,
    APP_FUND_CURRENCY: "XOF",
    Q_SHARE_CLASSES_COUNT: normalizeQuestionValueForPersistence(
      "Q_SHARE_CLASSES_COUNT",
      false,
      { currency: "XOF", countryCode: input.countryCode },
    ),
    APP_INITIAL_NAV: "10000",
  };
  return Object.fromEntries(
    Object.entries(values).map(([questionId, value]) => [
      questionId,
      {
        questionId,
        value,
        updatedAt: now,
        updatedBy: userId,
        source: questionId === "Q_SELECT_MANAGEMENT_COMPANY" ? "PREFILLED" : "USER",
        reviewStatus: "UNREVIEWED",
      } satisfies ProjectAnswer,
    ]),
  );
}

async function insertAnswers(
  client: PoolClient,
  identity: VerifiedIdentityContext,
  versionId: string,
  answers: Record<string, ProjectAnswer>,
): Promise<void> {
  for (const answer of Object.values(answers)) {
    const question = getQuestionById(answer.questionId);
    await client.query(
      `insert into regulatory.project_answers (
         organization_id, project_version_id, question_id, value, source,
         review_status, requirement_codes, canonical_field_paths, updated_by, updated_at
       ) values ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10)`,
      [
        identity.organizationId,
        versionId,
        answer.questionId,
        JSON.stringify(answer.value),
        answer.source,
        answer.reviewStatus,
        question?.requirementIds ?? [],
        question?.canonicalFieldPaths ?? [question?.fieldPath].filter(Boolean),
        identity.userId,
        answer.updatedAt,
      ],
    );
  }
}

async function persistSnapshotAndCollections(
  client: PoolClient,
  identity: VerifiedIdentityContext,
  versionId: string,
  snapshot: CanonicalSnapshot,
): Promise<string> {
  const snapshotHash = sha256(stableStringify(snapshot));
  const existing = await client.query<{ id: string }>(
    `select id
       from regulatory.canonical_snapshots
      where project_version_id = $1 and snapshot_sha256 = $2`,
    [versionId, snapshotHash],
  );
  let snapshotId = existing.rows[0]?.id;
  if (!snapshotId) {
    snapshotId = randomUUID();
    await client.query(
      `insert into regulatory.canonical_snapshots (
         id, organization_id, project_version_id, schema_version, snapshot_sha256,
         canonical_data, coverage, findings, ready_for_submission, created_at
       ) values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, false, $9)`,
      [
        snapshotId,
        identity.organizationId,
        versionId,
        "PROSPECTUS_CANONICAL_MODEL_V1",
        snapshotHash,
        JSON.stringify(snapshot.canonicalData),
        JSON.stringify(snapshot.coverage),
        JSON.stringify(snapshot.findings),
        snapshot.snapshotCreatedAt,
      ],
    );
  }
  await syncCanonicalCollections(client, identity, versionId, snapshot.canonicalData);
  return snapshotId;
}

async function syncCanonicalCollections(
  client: PoolClient,
  identity: VerifiedIdentityContext,
  versionId: string,
  canonicalData: Record<string, unknown>,
): Promise<void> {
  for (const table of [
    "project_share_classes",
    "project_asset_ranges",
    "project_fees",
    "project_valuation_methods",
    "project_parties",
    "project_risks",
    "project_country_arrangements",
    "evidence_items",
  ]) {
    await client.query(`delete from regulatory.${table} where project_version_id = $1`, [versionId]);
  }

  for (const item of arrayAt(canonicalData, "share_classes")) {
    await client.query(
      `insert into regulatory.project_share_classes (
         organization_id, project_version_id, class_id, currency, income_policy,
         initial_nav, initial_subscription_minimum, decimalization, review_status
       ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)`,
      [
        identity.organizationId,
        versionId,
        item.class_id,
        item.currency,
        item.income_policy,
        item.initial_nav,
        JSON.stringify(item.initial_subscription_minimum),
        JSON.stringify(item.decimalization),
        item.review_status ?? "UNREVIEWED",
      ],
    );
  }

  for (const item of arrayAt(canonicalData, "investment_policy.asset_class_ranges")) {
    await client.query(
      `insert into regulatory.project_asset_ranges (
         organization_id, project_version_id, range_id, asset_class,
         minimum_percent, target_percent, maximum_percent, review_status
       ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        identity.organizationId,
        versionId,
        item.range_id,
        item.asset_class,
        item.minimum_percent,
        item.target_percent,
        item.maximum_percent,
        item.review_status ?? "UNREVIEWED",
      ],
    );
  }

  for (const [collectionKind, items] of [
    ["TRANSACTION_FEE", arrayAt(canonicalData, "fees.transaction")],
    ["REMUNERATION", arrayAt(canonicalData, "remunerations")],
  ] as const) {
    for (const item of items) {
      await client.query(
        `insert into regulatory.project_fees (
           organization_id, project_version_id, fee_id, collection_kind, fee_type,
           label, payer_type, beneficiary, basis, rate_type, rate_percent,
           rate_per_mille, amount, currency, frequency, cap, tax_display, review_status
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
           $12, $13, $14, $15, $16, $17, $18
         )`,
        [
          identity.organizationId,
          versionId,
          item.fee_id,
          collectionKind,
          item.fee_type,
          item.label,
          item.payer_type,
          item.beneficiary,
          item.basis,
          item.rate_type,
          item.rate_percent ?? null,
          item.rate_per_mille ?? null,
          item.amount ?? null,
          item.currency ?? null,
          item.frequency,
          item.cap ?? null,
          item.tax_display ?? null,
          item.review_status ?? "UNREVIEWED",
        ],
      );
    }
  }

  for (const item of arrayAt(canonicalData, "valuation.methods")) {
    await client.query(
      `insert into regulatory.project_valuation_methods (
         organization_id, project_version_id, method_id, asset_class, primary_method,
         price_source, fallback_method, frequency, exception_process, review_status
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        identity.organizationId,
        versionId,
        item.method_id,
        item.asset_class,
        item.primary_method,
        item.price_source,
        item.fallback_method,
        item.frequency,
        item.exception_process,
        item.review_status ?? "UNREVIEWED",
      ],
    );
  }

  for (const [collectionKind, items] of [
    ["GOVERNANCE", arrayAt(canonicalData, "manager.governance_members")],
    ["SERVICE_PROVIDER", arrayAt(canonicalData, "service_providers")],
  ] as const) {
    for (const item of items) {
      await client.query(
        `insert into regulatory.project_parties (
           organization_id, project_version_id, party_id, collection_kind, role,
           legal_name, person_name, legal_form, approval_number, registered_office,
           main_activity, function_title, significant_external_activities, conflicts,
           verification_status
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15
         )`,
        [
          identity.organizationId,
          versionId,
          item.party_id,
          collectionKind,
          item.role,
          item.legal_name ?? "",
          item.person_name ?? null,
          item.legal_form ?? null,
          item.approval_number ?? null,
          item.registered_office ?? null,
          item.main_activity ?? null,
          item.function_title ?? null,
          item.significant_external_activities ?? null,
          item.conflicts ?? null,
          item.verification_status ?? "USER_PROVIDED_PENDING_REVIEW",
        ],
      );
    }
  }

  for (const item of arrayAt(canonicalData, "risks")) {
    await client.query(
      `insert into regulatory.project_risks (
         organization_id, project_version_id, risk_id, category, label,
         description, source, review_status
       ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        identity.organizationId,
        versionId,
        item.risk_id,
        item.category,
        item.label,
        item.description,
        item.source,
        item.review_status ?? "UNREVIEWED",
      ],
    );
  }

  for (const item of arrayAt(canonicalData, "distribution_countries")) {
    await client.query(
      `insert into regulatory.project_country_arrangements (
         organization_id, project_version_id, arrangement_id, country_code,
         is_home_state, marketing_authorization_reference, paying_agents,
         redemption_locations, information_locations, review_status
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        identity.organizationId,
        versionId,
        item.arrangement_id,
        item.country_code,
        item.is_home_state,
        item.marketing_authorization_reference,
        item.paying_agents,
        item.redemption_locations,
        item.information_locations,
        item.review_status ?? "UNREVIEWED",
      ],
    );
  }

  for (const item of arrayAt(canonicalData, "evidence")) {
    const verified = item.verification_status === "VERIFIED";
    await client.query(
      `insert into regulatory.evidence_items (
         organization_id, project_version_id, evidence_id, evidence_type, title,
         reference, issuer, issue_date, file_reference, verification_status,
         verified_by, verified_at
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        identity.organizationId,
        versionId,
        item.evidence_id,
        item.evidence_type,
        item.title,
        item.reference,
        item.issuer,
        item.issue_date ?? null,
        item.file_reference,
        item.verification_status ?? "PENDING",
        verified ? identity.userId : null,
        verified ? new Date().toISOString() : null,
      ],
    );
  }
}

async function persistGeneratedDocuments(
  client: PoolClient,
  identity: VerifiedIdentityContext,
  versionId: string,
  snapshotId: string,
  generation: GenerationSnapshot,
  staged: StagedArtifactBatch,
): Promise<void> {
  for (const artifact of staged.artifacts) {
    await client.query(
      `insert into regulatory.generated_documents (
         organization_id, project_version_id, canonical_snapshot_id, generation_id,
         document_type, media_type, storage_reference, sha256, byte_size,
         document_status, ready_for_submission, generation_manifest, created_by, created_at
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         'DRAFT_PRE_COMPLIANCE_REVIEW', false, $10::jsonb, $11, $12
       )
       on conflict (project_version_id, generation_id, document_type)
       do update set
         storage_reference = excluded.storage_reference,
         sha256 = excluded.sha256,
         byte_size = excluded.byte_size,
         generation_manifest = excluded.generation_manifest,
         created_at = excluded.created_at`,
      [
        identity.organizationId,
        versionId,
        snapshotId,
        generation.generationId,
        artifact.documentType,
        artifact.mediaType,
        artifact.storageReference,
        artifact.sha256,
        artifact.byteSize,
        JSON.stringify({
          project_generation: generation,
          artifact_file_name: artifact.fileName,
          ready_for_submission: false,
        }),
        identity.userId,
        generation.generatedAt,
      ],
    );
  }
}

async function appendAuditEvent(
  client: PoolClient,
  identity: VerifiedIdentityContext,
  input: {
    projectId: string;
    projectVersionId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  const previous = await client.query<{ event_hash: string }>(
    `select event_hash
       from regulatory.audit_events
      where organization_id = $1
      order by occurred_at desc, id desc
      limit 1`,
    [identity.organizationId],
  );
  const previousHash = previous.rows[0]?.event_hash ?? null;
  const occurredAt = new Date().toISOString();
  const eventId = randomUUID();
  const eventHash = sha256(
    stableStringify({
      eventId,
      organizationId: identity.organizationId,
      projectId: input.projectId,
      projectVersionId: input.projectVersionId,
      actorId: identity.userId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      occurredAt,
      payload: input.payload,
      previousHash,
    }),
  );
  await client.query(
    `insert into regulatory.audit_events (
       id, organization_id, project_id, project_version_id, actor_id, event_type,
       entity_type, entity_id, occurred_at, payload, previous_hash, event_hash
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12)`,
    [
      eventId,
      identity.organizationId,
      input.projectId,
      input.projectVersionId,
      identity.userId,
      input.eventType,
      input.entityType,
      input.entityId,
      occurredAt,
      JSON.stringify(input.payload),
      previousHash,
      eventHash,
    ],
  );
}

function applyProjectMetadataAnswers(project: ProspectusProject): void {
  project.name = String(project.answers.Q_FUND_LEGAL_NAME?.value ?? project.name);
  project.fund.legalName = project.name;
  project.category = String(project.answers.APP_FUND_CATEGORY?.value ?? project.category) as ProspectusProject["category"];
  project.operation = String(project.answers.APP_PROJECT_OPERATION?.value ?? project.operation) as ProspectusProject["operation"];
  project.fund.countryCode = String(project.answers.APP_HOME_STATE?.value ?? project.fund.countryCode);
  project.fund.currency = String(project.answers.APP_FUND_CURRENCY?.value ?? project.fund.currency);
  project.managementCompany.legalName = String(
    project.answers.Q_SELECT_MANAGEMENT_COMPANY?.value ?? project.managementCompany.legalName,
  );
  const shareClasses = project.answers.Q_SHARE_CLASSES_COUNT?.value;
  project.fund.shareClassCount = Array.isArray(shareClasses) ? shareClasses.length : project.fund.shareClassCount;
}

function assertExpectedVersion(expected: number | undefined, actual: number): void {
  if (expected !== undefined && expected !== actual) {
    throw new Error(`PROJECT_VERSION_CONFLICT:${expected}:${actual}`);
  }
}

function catalogMetadata(): NonNullable<ProspectusProject["catalog"]> {
  return {
    schemaVersion: CATALOG_METADATA.schemaVersion,
    digest: CATALOG_METADATA.catalogDigest,
    requirementCount: CATALOG_METADATA.requirementCount,
    interactiveQuestionCount: CATALOG_METADATA.interactiveQuestionCount,
  };
}

function arrayAt(root: Record<string, unknown>, path: string): Array<Record<string, unknown>> {
  let current: unknown = root;
  for (const segment of path.split(".")) {
    if (!isRecord(current)) return [];
    current = current[segment];
  }
  return Array.isArray(current)
    ? current.filter(isRecord)
    : [];
}

function isCoverage(value: unknown): value is ProspectusProject["coverage"] {
  return isRecord(value) && typeof value.PENDING_REVIEW === "number";
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeJsonValue(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function slugify(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return normalized || "prospectus-project";
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortRecursively(value));
}

function sortRecursively(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortRecursively);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortRecursively(nested)]),
    );
  }
  return value;
}
