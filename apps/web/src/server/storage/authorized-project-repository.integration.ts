import assert from "node:assert/strict";
import type { ProspectusProject, ProjectSummary } from "@/domain/types";
import { createFixedTestIdentityProvider, type VerifiedIdentityContext } from "@/server/security/verified-identity";
import { createAuthorizedProjectRepository } from "@/server/storage/authorized-project-repository";
import type {
  CreateProjectInput,
  PersistGenerationInput,
  ProjectRepository,
  SaveAnswerInput,
} from "@/server/storage/project-repository";

const productIdentity: VerifiedIdentityContext = {
  organizationId: "81000000-0000-0000-0000-000000000001",
  userId: "82000000-0000-0000-0000-000000000001",
  subject: "authorized-project-product",
  roles: ["PRODUCT"],
  provider: "CI_FIXED_TEST_IDENTITY",
  verifiedAt: "2026-08-17T20:50:00.000Z",
};
const complianceIdentity: VerifiedIdentityContext = {
  ...productIdentity,
  userId: "82000000-0000-0000-0000-000000000002",
  subject: "authorized-project-compliance",
  roles: ["COMPLIANCE"],
};

const productCalls: string[] = [];
const complianceCalls: string[] = [];
const productRepository = createAuthorizedProjectRepository({
  delegate: fakeRepository(productCalls),
  identityProvider: createFixedTestIdentityProvider(productIdentity),
});
const complianceRepository = createAuthorizedProjectRepository({
  delegate: fakeRepository(complianceCalls),
  identityProvider: createFixedTestIdentityProvider(complianceIdentity),
});

await productRepository.listProjects();
await productRepository.getProject("project-1");
await productRepository.createProject({
  name: "Authorized Product Fund",
  category: "BOND",
  countryCode: "CI",
  operation: "CREATE",
  managementCompanyName: "Authorized Management",
});
await productRepository.saveAnswer({
  projectId: "project-1",
  questionId: "Q_FUND_CONSTITUTION_DATE",
  value: "2026-08-17",
  expectedVersion: 1,
});
await productRepository.persistGenerationArtifacts({} as PersistGenerationInput);
assert.deepEqual(productCalls, ["PROJECT_LIST", "PROJECT_READ", "PROJECT_CREATE", "ANSWER_WRITE", "GENERATION_RUN"]);

await complianceRepository.listProjects();
await complianceRepository.getProject("project-1");
await assertDenied(
  () => complianceRepository.createProject({
    name: "Denied Fund",
    category: "BOND",
    countryCode: "CI",
    operation: "CREATE",
    managementCompanyName: "Denied Management",
  }),
  "AUTHORIZATION_DENIED:PROJECT_CREATE",
);
await assertDenied(
  () => complianceRepository.saveAnswer({
    projectId: "project-1",
    questionId: "Q_FUND_CONSTITUTION_DATE",
    value: "2026-08-17",
    expectedVersion: 1,
  }),
  "AUTHORIZATION_DENIED:ANSWER_WRITE",
);
await assertDenied(
  () => complianceRepository.persistGenerationArtifacts({} as PersistGenerationInput),
  "AUTHORIZATION_DENIED:GENERATION_RUN",
);
assert.deepEqual(
  complianceCalls,
  ["PROJECT_LIST", "PROJECT_READ"],
  "Denied operations must never reach the persistence delegate.",
);

console.log(JSON.stringify({
  validationId: "AUTHORIZED_PROJECT_REPOSITORY_VALIDATION_V1",
  status: "PASS",
  checks: {
    listRequiresProjectList: true,
    readRequiresProjectRead: true,
    createRequiresProjectCreate: true,
    answerRequiresAnswerWrite: true,
    generationRequiresGenerationRun: true,
    deniedOperationsDoNotReachDelegate: true,
  },
}, null, 2));

function fakeRepository(calls: string[]): ProjectRepository {
  const project = { id: "project-1", version: 1 } as ProspectusProject;
  return {
    driver: "postgresql",
    async listProjects(): Promise<ProjectSummary[]> {
      calls.push("PROJECT_LIST");
      return [];
    },
    async getProject(): Promise<ProspectusProject | null> {
      calls.push("PROJECT_READ");
      return project;
    },
    async createProject(_input: CreateProjectInput): Promise<ProspectusProject> {
      calls.push("PROJECT_CREATE");
      return project;
    },
    async saveAnswer(_input: SaveAnswerInput): Promise<ProspectusProject> {
      calls.push("ANSWER_WRITE");
      return project;
    },
    async persistGenerationArtifacts(_input: PersistGenerationInput): Promise<ProspectusProject> {
      calls.push("GENERATION_RUN");
      return project;
    },
  };
}

async function assertDenied(action: () => Promise<unknown>, expected: string): Promise<void> {
  await assert.rejects(action, (error: unknown) => String(error).includes(expected));
}
