const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";

const live = await fetch(`${baseUrl}/api/health/live`, { cache: "no-store" });
if (live.status !== 200) throw new Error(`HEALTH_LIVE_STATUS:${live.status}`);
const liveBody = await live.json();
if (liveBody.status !== "ALIVE" || liveBody.readyForSubmission !== false) {
  throw new Error("HEALTH_LIVE_CONTRACT_INVALID");
}
if (live.headers.get("cache-control") !== "no-store") {
  throw new Error("HEALTH_LIVE_CACHE_CONTROL_INVALID");
}

const ready = await fetch(`${baseUrl}/api/health/ready`, { cache: "no-store" });
if (ready.status !== 503) throw new Error(`HEALTH_READY_LOCAL_JSON_MUST_FAIL_CLOSED:${ready.status}`);
const readyBody = await ready.json();
if (readyBody.ready !== false || readyBody.productionReady !== false) {
  throw new Error("HEALTH_READY_LOCAL_JSON_CONTRACT_INVALID");
}
if (!Array.isArray(readyBody.blockers) || !readyBody.blockers.includes("POSTGRESQL_DRIVER_REQUIRED")) {
  throw new Error("HEALTH_READY_LOCAL_JSON_BLOCKER_MISSING");
}
if (readyBody.readyForSubmission !== false) throw new Error("HEALTH_READY_SUBMISSION_MUST_REMAIN_FALSE");
if (ready.headers.get("cache-control") !== "no-store") {
  throw new Error("HEALTH_READY_CACHE_CONTROL_INVALID");
}

const serialized = JSON.stringify(readyBody);
for (const forbidden of ["DATABASE_URL", "postgresql://", "REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE"]) {
  if (serialized.includes(forbidden)) throw new Error(`HEALTH_READY_SENSITIVE_DETAIL_EXPOSED:${forbidden}`);
}

console.log(JSON.stringify({
  validationId: "WEB_RUNTIME_HEALTH_API_VALIDATION_V1",
  status: "PASS",
  checks: {
    livenessReturns200: true,
    readinessFailsClosedInLocalJson: true,
    noStoreCaching: true,
    noSensitiveRuntimeValuesExposed: true,
    readyForSubmissionRemainsFalse: true,
  },
}, null, 2));
