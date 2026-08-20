import { getRuntimeEvidenceScanBatchWorker } from "@/server/evidence/evidence-scan-runtime-batch";

const maxItems = integerEnvironment("REGULATORY_EVIDENCE_SCAN_BATCH_SIZE", 25, 1, 100);
const leaseSeconds = integerEnvironment("REGULATORY_EVIDENCE_SCAN_LEASE_SECONDS", 120, 10, 3600);
const maxAttempts = integerEnvironment("REGULATORY_EVIDENCE_SCAN_MAX_ATTEMPTS", 5, 1, 20);

const result = await getRuntimeEvidenceScanBatchWorker().runBatch({
  maxItems,
  leaseSeconds,
  maxAttempts,
});
process.stdout.write(`${JSON.stringify({
  status: result.failed === 0 ? "PASS" : "PARTIAL",
  claimed: result.claimed,
  succeeded: result.succeeded,
  failed: result.failed,
  exhausted: result.exhausted,
  retryBudgetConfigured: true,
  readyForSubmission: false,
})}\n`);

if (result.failed > 0) process.exitCode = 2;

function integerEnvironment(name: string, fallback: number, minimum: number, maximum: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`RUNTIME_CONFIGURATION_INVALID:${name}`);
  }
  return value;
}
