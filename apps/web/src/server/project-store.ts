import "server-only";

import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedProjects } from "@/data/seed-projects";
import { EMPTY_COVERAGE } from "@/domain/constants";
import {
  calculateProgress,
  sanitizeAnswersAfterChange,
  toProjectSummary,
  validateProject,
} from "@/domain/questionnaire";
import type { ProspectusProject, ProjectAnswer, ProjectSummary } from "@/domain/types";

const DATA_ROOT = path.join(process.cwd(), ".local-data", "projects");

export async function listProjects(): Promise<ProjectSummary[]> {
  const projects = await readAllProjects();
  return projects
    .map((project) => toProjectSummary(project))
    .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getProject(projectId: string): Promise<ProspectusProject | null> {
  const stored = await readStoredProject(projectId);
  if (stored) {
    return { ...stored, findings: validateProject(stored) };
  }
  const seed = seedProjects.find((project) => project.id === projectId);
  return seed ? structuredClone({ ...seed, findings: validateProject(seed) }) : null;
}

export async function createProject(input: {
  name: string;
  category: ProspectusProject["category"];
  countryCode: string;
  operation: ProspectusProject["operation"];
  managementCompanyName: string;
}): Promise<ProspectusProject> {
  const now = new Date().toISOString();
  const project: ProspectusProject = {
    id: slugify(input.name) || randomUUID(),
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
    answers: {},
    coverage: structuredClone(EMPTY_COVERAGE),
    findings: [],
    version: 1,
  };
  await persistProject(project, "PROJECT_CREATED");
  return project;
}

export async function saveAnswer(input: {
  projectId: string;
  questionId: string;
  value: unknown;
  updatedBy?: string;
}): Promise<ProspectusProject> {
  const project = await getProject(input.projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");

  const now = new Date().toISOString();
  const answer: ProjectAnswer = {
    questionId: input.questionId,
    value: input.value,
    updatedAt: now,
    updatedBy: input.updatedBy ?? "local-prototype-user",
    source: "USER",
    reviewStatus: "UNREVIEWED",
  };

  project.answers[input.questionId] = answer;
  project.answers = sanitizeAnswersAfterChange(project);
  project.updatedAt = now;
  project.version += 1;
  project.status = calculateProgress(project) === 100 ? "PRE_COMPLIANCE_REVIEW" : "QUESTIONNAIRE_IN_PROGRESS";
  project.findings = validateProject(project);

  await persistProject(project, "ANSWER_SAVED", {
    questionId: input.questionId,
    value: input.value,
  });
  return project;
}

export async function persistGeneration(
  projectId: string,
  generation: ProspectusProject["generation"],
): Promise<ProspectusProject> {
  const project = await getProject(projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  project.generation = generation;
  project.updatedAt = new Date().toISOString();
  project.version += 1;
  project.findings = validateProject(project);
  await persistProject(project, "PROSPECTUS_GENERATED", generation);
  return project;
}

async function readAllProjects(): Promise<ProspectusProject[]> {
  await mkdir(DATA_ROOT, { recursive: true });
  const storedIds = await readdir(DATA_ROOT, { withFileTypes: true })
    .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name))
    .catch(() => [] as string[]);

  const stored = (
    await Promise.all(storedIds.map((projectId) => readStoredProject(projectId)))
  ).filter((project): project is ProspectusProject => project !== null);

  const storedIdSet = new Set(stored.map((project) => project.id));
  const seeds = seedProjects.filter((project) => !storedIdSet.has(project.id));
  return [...stored, ...structuredClone(seeds)];
}

async function readStoredProject(projectId: string): Promise<ProspectusProject | null> {
  try {
    const value = await readFile(currentPath(projectId), "utf8");
    return JSON.parse(value) as ProspectusProject;
  } catch {
    return null;
  }
}

async function persistProject(
  project: ProspectusProject,
  eventType: string,
  details: unknown = {},
): Promise<void> {
  const directory = projectDirectory(project.id);
  const versionsDirectory = path.join(directory, "versions");
  await mkdir(versionsDirectory, { recursive: true });

  const stable = `${JSON.stringify(project, null, 2)}\n`;
  const versionName = `${String(project.version).padStart(5, "0")}.json`;
  await Promise.all([
    writeFile(currentPath(project.id), stable, "utf8"),
    writeFile(path.join(versionsDirectory, versionName), stable, "utf8"),
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

function projectDirectory(projectId: string): string {
  return path.join(DATA_ROOT, safeId(projectId));
}

function currentPath(projectId: string): string {
  return path.join(projectDirectory(projectId), "current.json");
}

function safeId(value: string): string {
  if (!/^[a-z0-9-]+$/i.test(value)) throw new Error("INVALID_PROJECT_ID");
  return value;
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
