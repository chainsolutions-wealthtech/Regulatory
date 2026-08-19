import assert from "node:assert/strict";
import { evaluateRuntimeReadiness } from "@/server/observability/runtime-health";

const baseEnv = {
  DATABASE_URL: "postgresql://redacted",
  OIDC_ISSUER: "https://issuer.example.test",
  OIDC_AUDIENCE: "regulatory",
  OIDC_JWKS_URI: "https://issuer.example.test/.well-known/jwks.json",
  REGULATORY_EVIDENCE_DRIVER: "filesystem-development",
  REGULATORY_EVIDENCE_ROOT: "/tmp/evidence",
  REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE: "test-key-reference",
};

const local = await evaluateRuntimeReadiness({
  storageDriver: "local-json",
  nodeEnv: "development",
  environment: {},
  databaseProbe: async () => undefined,
});
assert.equal(local.ready, false);
assert.equal(local.productionReady, false);
assert.deepEqual(local.blockers, ["POSTGRESQL_DRIVER_REQUIRED"]);
assert.equal(JSON.stringify(local).includes("postgresql://"), false);

let probeCalls = 0;
const development = await evaluateRuntimeReadiness({
  storageDriver: "postgresql",
  nodeEnv: "development",
  environment: baseEnv,
  databaseProbe: async () => {
    probeCalls += 1;
  },
});
assert.equal(development.ready, true);
assert.equal(development.productionReady, false);
assert.equal(development.dependencies.postgresql, "READY");
assert.equal(development.dependencies.oidc, "CONFIGURED");
assert.equal(development.dependencies.evidence, "DEVELOPMENT_ONLY");
assert.equal(probeCalls, 1);

const productionFilesystem = await evaluateRuntimeReadiness({
  storageDriver: "postgresql",
  nodeEnv: "production",
  environment: baseEnv,
  databaseProbe: async () => undefined,
});
assert.equal(productionFilesystem.ready, false);
assert.equal(productionFilesystem.productionReady, false);
assert(productionFilesystem.blockers.includes("PRODUCTION_EVIDENCE_DRIVER_REQUIRED"));

const missingOidc = await evaluateRuntimeReadiness({
  storageDriver: "postgresql",
  nodeEnv: "development",
  environment: { ...baseEnv, OIDC_JWKS_URI: "" },
  databaseProbe: async () => undefined,
});
assert.equal(missingOidc.ready, false);
assert(missingOidc.missingConfiguration.includes("OIDC_JWKS_URI"));
assert.equal(JSON.stringify(missingOidc).includes("test-key-reference"), false);

const databaseDown = await evaluateRuntimeReadiness({
  storageDriver: "postgresql",
  nodeEnv: "development",
  environment: baseEnv,
  databaseProbe: async () => {
    throw new Error("sensitive database detail must not leak");
  },
});
assert.equal(databaseDown.ready, false);
assert.equal(databaseDown.dependencies.postgresql, "UNAVAILABLE");
assert.equal(JSON.stringify(databaseDown).includes("sensitive database detail"), false);

console.log("RUNTIME_HEALTH_READINESS_PASS");
