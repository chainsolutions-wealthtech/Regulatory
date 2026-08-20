import assert from "node:assert/strict";
import { createEvidenceScanQueueWorker } from "@/server/evidence/evidence-scan-queue-worker";

const claims = [
  { objectId: "object-1", organizationId: "org-1", attempt: 1, leaseExpiresAt: "2026-08-20T18:00:00.000Z" },
  { objectId: "object-2", organizationId: "org-1", attempt: 1, leaseExpiresAt: "2026-08-20T18:00:00.000Z" },
  { objectId: "object-3", organizationId: "org-1", attempt: 2, leaseExpiresAt: "2026-08-20T18:00:00.000Z" },
];
let claimIndex = 0;
const claimCommands: Array<{ leaseSeconds: number; maxAttempts?: number }> = [];
const scanned: string[] = [];
const worker = createEvidenceScanQueueWorker({
  queue: {
    async claimNext(command) {
      claimCommands.push(command);
      return claims[claimIndex++] ?? null;
    },
  },
  scannerWorker: {
    async scan(objectId: string) {
      scanned.push(objectId);
      if (objectId === "object-2") throw new Error("SCANNER_TRANSIENT_FAILURE");
      return { objectId };
    },
  },
});

const result = await worker.runBatch({ maxItems: 10, leaseSeconds: 60, maxAttempts: 4 });
assert.deepEqual(scanned, ["object-1", "object-2", "object-3"]);
assert(claimCommands.every((command) => command.leaseSeconds === 60 && command.maxAttempts === 4));
assert.equal(result.claimed, 3);
assert.equal(result.succeeded, 2);
assert.equal(result.failed, 1);
assert.equal(result.exhausted, true);
assert.equal(result.readyForSubmission, false);
assert.equal(result.failures[0]?.objectId, "object-2");
assert.equal(result.failures[0]?.code, "EVIDENCE_SCAN_WORKER_ITEM_FAILED");
assert.equal(JSON.stringify(result).includes("SCANNER_TRANSIENT_FAILURE"), false, "Internal scanner errors must not leak from batch reports.");

await assert.rejects(
  () => worker.runBatch({ maxItems: 0, leaseSeconds: 60, maxAttempts: 4 }),
  /EVIDENCE_SCAN_BATCH_SIZE_INVALID/,
);
await assert.rejects(
  () => worker.runBatch({ maxItems: 101, leaseSeconds: 60, maxAttempts: 4 }),
  /EVIDENCE_SCAN_BATCH_SIZE_INVALID/,
);
await assert.rejects(
  () => worker.runBatch({ maxItems: 1, leaseSeconds: 60, maxAttempts: 0 }),
  /EVIDENCE_SCAN_MAX_ATTEMPTS_INVALID/,
);

console.log("EVIDENCE_SCAN_QUEUE_WORKER_PASS");
