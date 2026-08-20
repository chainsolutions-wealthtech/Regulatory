import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validationDirectory = path.join(repoRoot, "regulatory/validation");
const evidencePath = path.join(validationDirectory, "POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION.json");
const queuePath = path.join(validationDirectory, "POSTGRESQL_EVIDENCE_SCAN_QUEUE_VALIDATION.json");

const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
const queue = JSON.parse(await readFile(queuePath, "utf8"));

if (evidence.status !== "PASS" || evidence.validationId !== "POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION_V1") {
  throw new Error("EVIDENCE_STORE_VALIDATION_REQUIRED_BEFORE_QUEUE_MERGE");
}
if (queue.status !== "PASS" || queue.validationId !== "POSTGRESQL_EVIDENCE_SCAN_QUEUE_VALIDATION_V1") {
  throw new Error("EVIDENCE_SCAN_QUEUE_VALIDATION_REQUIRED_BEFORE_QUEUE_MERGE");
}

const requiredQueueChecks = [
  "securityRoleRequired",
  "pendingClaimTransitionsToScanning",
  "scanStartedRecorded",
  "leaseRecorded",
  "activeClaimNotDuplicated",
  "expiredLeaseRecoverable",
  "attemptCountIncremented",
  "tenantIsolationEnforced",
  "noBrowserScanVerdictIntroduced",
  "readyForSubmissionRemainsFalse",
];
for (const check of requiredQueueChecks) {
  if (queue.checks?.[check] !== true) throw new Error(`EVIDENCE_SCAN_QUEUE_CHECK_FAILED:${check}`);
}

evidence.checks = {
  ...evidence.checks,
  serverScanQueueSecurityRoleRequired: true,
  serverScanQueueLeased: true,
  serverScanQueueActiveClaimNotDuplicated: true,
  serverScanQueueExpiredLeaseRecoverable: true,
  serverScanQueueTenantIsolation: true,
  serverScanQueueBrowserVerdictForbidden: true,
  serverScanQueueReadyForSubmissionFalse: true,
};
evidence.relatedValidations = {
  ...(evidence.relatedValidations ?? {}),
  evidenceScanQueue: queue.validationId,
};
evidence.caveat = `${evidence.caveat ?? ""} La file scanner est validée en PostgreSQL CI avec lease récupérable; cela n'atteste pas un scanner ni un scheduler de production.`.trim();

await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  status: "PASS",
  consolidatedInto: "POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION.json",
  source: queue.validationId,
  readyForSubmission: false,
}, null, 2));
