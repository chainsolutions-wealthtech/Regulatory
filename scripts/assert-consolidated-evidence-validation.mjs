import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidence = JSON.parse(await readFile(
  path.join(repoRoot, "regulatory/validation/POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION.json"),
  "utf8",
));

if (evidence.status !== "PASS" || evidence.validationId !== "POSTGRESQL_EVIDENCE_OBJECT_STORE_VALIDATION_V1") {
  throw new Error("CONSOLIDATED_EVIDENCE_VALIDATION_INVALID");
}

for (const check of [
  "binaryAndMetadataTrackedTogether",
  "binaryStoreContainsNoRegulatoryDescriptor",
  "cleanScanDoesNotAutoRelease",
  "releaseRecoversAfterBinaryCommitGap",
  "releaseRetryIdempotent",
  "productionReadinessNotClaimed",
  "serverScanQueueSecurityRoleRequired",
  "serverScanQueueLeased",
  "serverScanQueueActiveClaimNotDuplicated",
  "serverScanQueueExpiredLeaseRecoverable",
  "serverScanQueueTenantIsolation",
  "serverScanQueueBrowserVerdictForbidden",
  "serverScanQueueReadyForSubmissionFalse",
]) {
  if (evidence.checks?.[check] !== true) throw new Error(`CONSOLIDATED_EVIDENCE_CHECK_FAILED:${check}`);
}

if (evidence.relatedValidations?.evidenceScanQueue !== "POSTGRESQL_EVIDENCE_SCAN_QUEUE_VALIDATION_V1") {
  throw new Error("CONSOLIDATED_EVIDENCE_QUEUE_LINK_MISSING");
}

console.log(JSON.stringify({
  validationId: "CONSOLIDATED_EVIDENCE_VALIDATION_GATE_V1",
  status: "PASS",
  readyForSubmission: false,
}, null, 2));
