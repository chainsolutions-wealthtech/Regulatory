import "server-only";

import type { EvidenceScanClaim } from "@/server/evidence/postgres-evidence-scan-queue";

export function createEvidenceScanQueueWorker(input: {
  queue: {
    claimNext(command: { leaseSeconds: number; maxAttempts?: number }): Promise<EvidenceScanClaim | null>;
  };
  scannerWorker: {
    scan(objectId: string): Promise<unknown>;
  };
}) {
  return {
    async runBatch(command: { maxItems: number; leaseSeconds: number; maxAttempts?: number }) {
      const maxItems = normalizeBatchSize(command.maxItems);
      const maxAttempts = normalizeMaxAttempts(command.maxAttempts ?? 5);
      const failures: Array<{ objectId: string; code: "EVIDENCE_SCAN_WORKER_ITEM_FAILED" }> = [];
      let claimed = 0;
      let succeeded = 0;
      let exhausted = false;

      for (let index = 0; index < maxItems; index += 1) {
        const claim = await input.queue.claimNext({
          leaseSeconds: command.leaseSeconds,
          maxAttempts,
        });
        if (!claim) {
          exhausted = true;
          break;
        }
        claimed += 1;
        try {
          await input.scannerWorker.scan(claim.objectId);
          succeeded += 1;
        } catch {
          failures.push({ objectId: claim.objectId, code: "EVIDENCE_SCAN_WORKER_ITEM_FAILED" });
        }
      }

      return {
        claimed,
        succeeded,
        failed: failures.length,
        exhausted,
        failures,
        readyForSubmission: false as const,
      };
    },
  };
}

function normalizeBatchSize(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new Error("EVIDENCE_SCAN_BATCH_SIZE_INVALID");
  }
  return value;
}

function normalizeMaxAttempts(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 20) {
    throw new Error("EVIDENCE_SCAN_MAX_ATTEMPTS_INVALID");
  }
  return value;
}
