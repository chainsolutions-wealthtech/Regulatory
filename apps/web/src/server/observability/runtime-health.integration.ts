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

const productionS3Env = {
  DATABASE_URL: "postgresql://redacted",
  OIDC_ISSUER: "https://issuer.example.test",
  OIDC_AUDIENCE: "regulatory",
  OIDC_JWKS_URI: "https://issuer.example.test/.well-known/jwks.json",
  REGULATORY_EVIDENCE_DRIVER: "s3-private",
  REGULATORY_EVIDENCE_S3_BUCKET: "private-evidence",
  REGULATORY_EVIDENCE_S3_REGION: "eu-west-3",
  REGULATORY_EVIDENCE_S3_KMS_KEY_ID: "kms-key-redacted",
  REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE: "kms-reference-redacted",
};

const scannerEnv = {
  REGULATORY_EVIDENCE_SCANNER_DRIVER: "http-attestation",
  REGULATORY_EVIDENCE_SCANNER_URL: "https://scanner.example.test/v1/scan",
  REGULATORY_EVIDENCE_SCANNER_TOKEN: "scanner-token-redacted",
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
assert.equal(development.dependencies.scanner, "NOT_CONFIGURED");
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
assert(productionFilesystem.blockers.includes("PRODUCTION_SCANNER_REQUIRED"));

const productionS3WithoutScanner = await evaluateRuntimeReadiness({
  storageDriver: "postgresql",
  nodeEnv: "production",
  environment: productionS3Env,
  databaseProbe: async () => undefined,
});
assert.equal(productionS3WithoutScanner.ready, false);
assert.equal(productionS3WithoutScanner.productionReady, false);
assert.equal(productionS3WithoutScanner.dependencies.evidence, "CONFIGURED");
assert.equal(productionS3WithoutScanner.dependencies.scanner, "NOT_CONFIGURED");
assert(productionS3WithoutScanner.blockers.includes("PRODUCTION_SCANNER_REQUIRED"));

const scannerWithoutServiceIdentity = await evaluateRuntimeReadiness({
  storageDriver: "postgresql",
  nodeEnv: "production",
  environment: { ...productionS3Env, ...scannerEnv },
  databaseProbe: async () => undefined,
});
assert.equal(scannerWithoutServiceIdentity.ready, false);
assert.equal(scannerWithoutServiceIdentity.productionReady, false);
assert(scannerWithoutServiceIdentity.missingConfiguration.includes("REGULATORY_EVIDENCE_SCANNER_SERVICE_BEARER_TOKEN"));

const fullyConfiguredProduction = await evaluateRuntimeReadiness({
  storageDriver: "postgresql",
  nodeEnv: "production",
  environment: {
    ...productionS3Env,
    ...scannerEnv,
    REGULATORY_EVIDENCE_SCANNER_SERVICE_BEARER_TOKEN: "service-oidc-token-redacted",
  },
  databaseProbe: async () => undefined,
});
assert.equal(fullyConfiguredProduction.ready, false, "Configuration alone must never attest production readiness.");
assert.equal(fullyConfiguredProduction.productionReady, false);
assert.equal(fullyConfiguredProduction.dependencies.evidence, "CONFIGURED");
assert.equal(fullyConfiguredProduction.dependencies.scanner, "CONFIGURED");
assert(fullyConfiguredProduction.blockers.includes("PRODUCTION_ACCEPTANCE_REQUIRED"));
assert.equal(JSON.stringify(fullyConfiguredProduction).includes("scanner-token-redacted"), false);
assert.equal(JSON.stringify(fullyConfiguredProduction).includes("service-oidc-token-redacted"), false);
assert.equal(JSON.stringify(fullyConfiguredProduction).includes("kms-key-redacted"), false);

const insecureScanner = await evaluateRuntimeReadiness({
  storageDriver: "postgresql",
  nodeEnv: "production",
  environment: {
    ...productionS3Env,
    ...scannerEnv,
    REGULATORY_EVIDENCE_SCANNER_URL: "http://scanner.internal/v1/scan",
    REGULATORY_EVIDENCE_SCANNER_SERVICE_BEARER_TOKEN: "redacted",
  },
  databaseProbe: async () => undefined,
});
assert.equal(insecureScanner.ready, false);
assert(insecureScanner.blockers.includes("SCANNER_HTTPS_REQUIRED_IN_PRODUCTION"));
assert(insecureScanner.blockers.includes("PRODUCTION_ACCEPTANCE_REQUIRED"));

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
