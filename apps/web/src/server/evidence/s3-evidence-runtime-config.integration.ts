import assert from "node:assert/strict";
import { readS3EvidenceRuntimeConfiguration } from "@/server/evidence/s3-evidence-runtime-config";

const config = readS3EvidenceRuntimeConfiguration({
  environment: {
    REGULATORY_EVIDENCE_S3_BUCKET: " private-evidence ",
    REGULATORY_EVIDENCE_S3_REGION: "eu-west-3",
    REGULATORY_EVIDENCE_S3_KMS_KEY_ID: "kms-key",
    REGULATORY_EVIDENCE_S3_KEY_PREFIX: "tenant-regulatory",
    REGULATORY_EVIDENCE_S3_ENDPOINT: "https://s3.example.test",
    REGULATORY_EVIDENCE_S3_FORCE_PATH_STYLE: "true",
  },
  nodeEnv: "production",
});
assert.deepEqual(config, {
  bucket: "private-evidence",
  region: "eu-west-3",
  kmsKeyId: "kms-key",
  keyPrefix: "tenant-regulatory",
  endpoint: "https://s3.example.test",
  forcePathStyle: true,
});
assert.equal("credentials" in config, false);

const awsDefault = readS3EvidenceRuntimeConfiguration({
  environment: {
    REGULATORY_EVIDENCE_S3_BUCKET: "private-evidence",
    REGULATORY_EVIDENCE_S3_REGION: "eu-west-3",
    REGULATORY_EVIDENCE_S3_KMS_KEY_ID: "kms-key",
  },
  nodeEnv: "production",
});
assert.equal(awsDefault.endpoint, undefined);
assert.equal(awsDefault.forcePathStyle, undefined);

assert.throws(
  () => readS3EvidenceRuntimeConfiguration({
    environment: {
      REGULATORY_EVIDENCE_S3_BUCKET: "private-evidence",
      REGULATORY_EVIDENCE_S3_REGION: "eu-west-3",
      REGULATORY_EVIDENCE_S3_KMS_KEY_ID: "kms-key",
      REGULATORY_EVIDENCE_S3_ENDPOINT: "http://s3.internal",
    },
    nodeEnv: "production",
  }),
  /EVIDENCE_S3_ENDPOINT_HTTPS_REQUIRED_IN_PRODUCTION/,
);
assert.throws(
  () => readS3EvidenceRuntimeConfiguration({
    environment: {
      REGULATORY_EVIDENCE_S3_BUCKET: "private-evidence",
      REGULATORY_EVIDENCE_S3_REGION: "eu-west-3",
      REGULATORY_EVIDENCE_S3_KMS_KEY_ID: "kms-key",
      REGULATORY_EVIDENCE_S3_FORCE_PATH_STYLE: "maybe",
    },
    nodeEnv: "development",
  }),
  /EVIDENCE_S3_FORCE_PATH_STYLE_INVALID/,
);

console.log("S3_EVIDENCE_RUNTIME_CONFIG_PASS");
