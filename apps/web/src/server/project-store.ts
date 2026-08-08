import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedProjects } from "@/data/seed-projects";
import { createEmptyCoverage, getQuestionById } from "@/domain/regulatory-catalog";
import {
  calculateProgress,
  migrateProjectToCurrentCatalog,
  sanitizeAnswersAfterChange,
  toProjectSummary,
  validateProject,
} from "@/domain/questionnaire";
import type {
  CanonicalSnapshot,
  GenerationSnapshot,
  ProjectAnswer,
  ProspectusProject,
  ProjectSummary,
} from "@/domain/types";
import type {
  GeneratedProspectusArtifact,
  ProspectusPreview,
} from "@/server/generation-adapter";
import type {
  GenerationArtifactContent,
  GenerationArtifactSummary,
} from "@/server/storage/project-repository";

const DATA_ROOT = process.env.REGULATORY_LOCAL_DATA_ROOT
  ? path.resolve(process.env.REGULATORY_LOCAL_DATA_ROOT)
  : path.join(process.cwd(), ".local-data", "projects");

export async function listProjects(): Promise<ProjectSummary[]> {
  const projects = await readAllProjects();
  return projects
    .map((project) => toProjectSummary(project))
    .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getProject(projectId: string): Promise<ProspectusProject | null> {
  const stored = await readStoredProject(projectId);
  if (stored) return hydrateProject(stored);
  const seed = seedProjects.find((project) => project.id === projectId);
  return seed ? hydrateProject(structuredClone(seed)) : null;
}

export async function createProject(input: {
  name: string;
  category: ProspectusProject["category"];
  countryCode: string;
  operation: ProspectusProject["operation"];
  managementCompanyName: string;
}): Promise<ProspectusProject> {
  const now = new Date().toISOString();
  const answers = Object.fromEntries(
    [
      ["Q_REGULATORY_PACK_CONFIRMATION", "CONFIRMED", "DERIVED"],
      ["APP_PROJECT_OPERATION", input.operation, "USER"],
      ["APP_FUND_CATEGORY", input.category, "USER"],
      ["APP_HOME_STATE", input.countryCode, "USER"],
      ["APP_MANAGER_PROFILE_CONFIRMED", "false", "PREFILLED"],
      ["Q_SELECT_MANAGEMENT_COMPANY", input.managementCompanyName, "PREFILLED"],
      ["Q_FUND_LEGAL_NAME", input.name, "PREFILLED"],
      ["APP_FUND_CURRENCY", "XOF", "PREFILLED"],
    ].map(([questionId, value, source]) => [
      questionId,
      createAnswer(String(questionId), value, now, source as ProjectAnswer["source"]),
    ]),
  );

  const project = migrateProjectToCurrentCatalog({
    id: await uniqueProjectId(input.name),
    name: input.name,
    fundType: "FCP",
    category: input.category,
    jurisdiction: "UMOA",
    authority: "AMF-UMOA",
    operation: input.operation,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    createdBy: "local-prototype-user",
    managementCompany: {
      legalName: input.managementCompanyName,
      verificationStatus: "PREFILLED_PENDING_CONFIRMATION",
    },
    fund: {
      legalName: input.name,
      countryCode: input.countryCode,
      currency: "XOF",
      shareClassCount: 1,
    },
    answers,
    coverage: createEmptyCoverage(),
    findings: [],
    version: 1,
  });
  project.findings = validateProject(project);
  await persistProject(project, "PROJECT_CREATED");
  return project;
}

export async function saveAnswer(input: {
  projectId: string;
  questionId: string;
  value: unknown;
  updatedBy?: string;
}): Promise<ProspectusProject> {
  const question = getQuestionById(input.questionId);
  if (!question || question.interactive === false) throw new Error("QUESTION_NOT_FOUND");

  const project = await getProject(input.projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");

  const now = new Date().toISOString();
  project.answers[input.questionId] = {
    questionId: input.questionId,
    value: input.value,
    updatedAt: now,
    updatedBy: input.updatedBy ?? "local-prototype-user",
    source: "USER",
    reviewStatus: "UNREVIEWED",
  };
  project.answers = sanitizeAnswersAfterChange(project);
  project.updatedAt = now;
  project.version += 1;
  project.status =
    calculateProgress(project) === 100 ? "PRE_COMPLIANCE_REVIEW" : "QUESTIONNAIRE_IN_PROGRESS";
  project.findings = validateProject(project);

  await persistProject(project, "ANSWER_SAVED", {
    questionId: input.questionId,
    value: input.value,
  });
  return project;
}

export async function persistGenerationArtifacts(input: {
  projectId: string;
  generation: GenerationSnapshot;
  preview: ProspectusPreview;
  canonicalSnapshot: CanonicalSnapshot;
  artifacts: GeneratedProspectusArtifact[];
}): Promise<ProspectusProject> {
  const project = await getProject(input.projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");

  const directory = generationDirectory(project.id, input.generation.generationId);
  await mkdir(directory, { recursive: true });
  const previewPath = path.join(directory, "preview.json");
  const canonicalSnapshotPath = path.join(directory, "canonical-snapshot.json");
  const artifactPaths = new Map(
    input.artifacts.map((artifact) => [artifact.fileName, path.join(directory, artifact.fileName)]),
  );

  await Promise.all([
    writeStableJson(previewPath, input.preview),
    writeStableJson(canonicalSnapshotPath, input.canonicalSnapshot),
    ...input.artifacts.map((artifact) =>
      writeFile(path.join(directory, safeFileName(artifact.fileName)), artifact.content),
    ),
  ]);

  project.generation = {
    ...input.generation,
    artifactDirectoryPath: relativeToDataRoot(directory),
    previewPath: relativeToDataRoot(previewPath),
    canonicalSnapshotPath: relativeToDataRoot(canonicalSnapshotPath),
    canonicalDataPath: artifactRelativePath(artifactPaths, "canonical-data.json"),
    questionnaireStatePath: artifactRelativePath(artifactPaths, "questionnaire-state.json"),
    controlReportPath: artifactRelativePath(artifactPaths, "control-report.json"),
    concordancePath: artifactRelativePath(artifactPaths, "concordance.json"),
    documentModelPath: artifactRelativePath(artifactPaths, "document-model.json"),
    answerLogPath: artifactRelativePath(artifactPaths, "answer-log.json"),
    generationManifestPath: artifactRelativePath(artifactPaths, "generation-manifest.json"),
    markdownPath: artifactRelativePath(artifactPaths, "prospectus-draft.md"),
    docxPath: artifactRelativePath(artifactPaths, "prospectus-draft.docx"),
    docxManifestPath: artifactRelativePath(artifactPaths, "docx-manifest.json"),
    docxValidationPath: artifactRelativePath(artifactPaths, "docx-validation.json"),
  };
  project.updatedAt = new Date().toISOString();
  project.version += 1;
  project.findings = validateProject(project);
  await persistProject(project, "PROSPECTUS_GENERATED", project.generation);
  return project;
}

export async function listGenerationArtifacts(
  projectId: string,
  generationId: string,
): Promise<GenerationArtifactSummary[]> {
  const project = await getProject(projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const directory = generationDirectory(projectId, generationId);
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const fileNames = entries
    .filter((entry) => entry.isFile())
    .map((entry) => safeFileName(entry.name))
    .toSorted();
  return Promise.all(fileNames.map((fileName) => summarizeLocalArtifact(generationId, directory, fileName)));
}

export async function readGenerationArtifact(
  projectId: string,
  generationId: string,
  fileName: string,
): Promise<GenerationArtifactContent | null> {
  const project = await getProject(projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const safeName = safeFileName(fileName);
  const directory = generationDirectory(projectId, generationId);
  const available = await readdir(directory, { withFileTypes: true }).catch(() => []);
  if (!available.some((entry) => entry.isFile() && entry.name === safeName)) return null;
  const content = await readFile(path.join(directory, safeName));
  return {
    generationId,
    fileName: safeName,
    documentType: documentType(safeName),
    mediaType: mediaType(safeName),
    sha256: createHash("sha256").update(content).digest("hex"),
    byteSize: content.byteLength,
    content,
  };
}

async function summarizeLocalArtifact(
  generationId: string,
  directory: string,
  fileName: string,
): Promise<GenerationArtifactSummary> {
  const content = await readFile(path.join(directory, fileName));
  return {
    generationId,
    fileName,
    documentType: documentType(fileName),
    mediaType: mediaType(fileName),
    sha256: createHash("sha256").update(content).digest("hex"),
    byteSize: content.byteLength,
  };
}

async function readAllProjects(): Promise<ProspectusProject[]> {
  await mkdir(DATA_ROOT, { recursive: true });
  const storedIds = await readdir(DATA_ROOT, { withFileTypes: true })
    .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name))
    .catch(() => [] as string[]);

  const stored = (
    await Promise.all(storedIds.map((projectId) => readStoredProject(projectId)))
  ).filter((project): project is ProspectusProject => project !== null);
  const hydratedStored = stored.map(hydrateProject);

  const storedIdSet = new Set(hydratedStored.map((project) => project.id));
  const seeds = seedProjects
    .filter((project) => !storedIdSet.has(project.id))
    .map((project) => hydrateProject(structuredClone(project)));
  return [...hydratedStored, ...seeds];
}

async function readStoredProject(projectId: string): Promise<ProspectusProject | null> {
  try {
    const value = await readFile(currentPath(projectId), "utf8");
    return JSON.parse(value) as ProspectusProject;
  } catch {
    return null;
  }
}

function hydrateProject(project: ProspectusProject): ProspectusProject {
  const migrated = migrateProjectToCurrentCatalog(project);
  migrated.findings = validateProject(migrated);
  return migrated;
}

async function persistProject(
  project: ProspectusProject,
  eventType: string,
  details: unknown = {},
): Promise<void> {
  const directory = projectDirectory(project.id);
  const versionsDirectory = path.join(directory, "versions");
  await mkdir(versionsDirectory, { recursive: true });

  const versionName = `${String(project.version).padStart(5, "0")}.json`;
  await Promise.all([
    writeStableJson(currentPath(project.id), project),
    writeStableJson(path.join(versionsDirectory, versionName), project),
    appendFile(
      path.join(directory, "audit.ndjson"),
      `${JSON.stringify({
        eventId: randomUUID(),
        eventType,
        projectId: project.id,
        projectVersion: project.version,
        occurredAt: project.updatedAt,
        actor: "local-prototype-user",
        details,
      })}\n`,
      "utf8",
    ),
  ]);
}

async function uniqueProjectId(name: string): Promise<string> {
  const base = slugify(name) || randomUUID();
  if (!(await readStoredProject(base)) && !seedProjects.some((project) => project.id === base)) return base;
  return `${base}-${randomUUID().slice(0, 8)}`;
}

function createAnswer(
  questionId: string,
  value: unknown,
  updatedAt: string,
  source: ProjectAnswer["source"],
): ProjectAnswer {
  return {
    questionId,
    value,
    updatedAt,
    updatedBy: "local-prototype-user",
    source,
    reviewStatus: source === "USER" ? "UNREVIEWED" : "PENDING_REVIEW",
  };
}

function projectDirectory(projectId: string): string {
  return path.join(DATA_ROOT, safeId(projectId));
}

function generationDirectory(projectId: string, generationId: string): string {
  return path.join(projectDirectory(projectId), "generations", safeId(generationId));
}

function currentPath(projectId: string): string {
  return path.join(projectDirectory(projectId), "current.json");
}

function artifactRelativePath(
  artifactPaths: Map<string, string>,
  fileName: string,
): string | undefined {
  const filePath = artifactPaths.get(fileName);
  return filePath ? relativeToDataRoot(filePath) : undefined;
}

function relativeToDataRoot(filePath: string): string {
  return path.relative(DATA_ROOT, filePath).split(path.sep).join("/");
}

function safeId(value: string): string {
  if (!/^[a-z0-9-]+$/i.test(value)) throw new Error("INVALID_IDENTIFIER");
  return value;
}

function safeFileName(value: string): string {
  if (!/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(value) || value.includes("..")) {
    throw new Error("INVALID_ARTIFACT_FILE_NAME");
  }
  return value;
}

function mediaType(fileName: string): string {
  if (fileName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (fileName.endsWith(".json")) return "application/json";
  if (fileName.endsWith(".md")) return "text/markdown";
  if (fileName.endsWith(".csv")) return "text/csv";
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

function documentType(fileName: string): string {
  return fileName.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function writeStableJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
