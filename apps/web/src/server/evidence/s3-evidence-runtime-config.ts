import "server-only";

import type { S3EvidenceBinaryStoreConfiguration } from "@/server/evidence/s3-evidence-binary-store";

export function readS3EvidenceRuntimeConfiguration(input: {
  environment: Record<string, string | undefined>;
  nodeEnv: string | undefined;
}): Omit<S3EvidenceBinaryStoreConfiguration, "client"> {
  const bucket = required(input.environment.REGULATORY_EVIDENCE_S3_BUCKET, "EVIDENCE_S3_BUCKET_REQUIRED");
  const region = required(input.environment.REGULATORY_EVIDENCE_S3_REGION, "EVIDENCE_S3_REGION_REQUIRED");
  const kmsKeyId = required(input.environment.REGULATORY_EVIDENCE_S3_KMS_KEY_ID, "EVIDENCE_S3_KMS_KEY_REQUIRED");
  const keyPrefix = optional(input.environment.REGULATORY_EVIDENCE_S3_KEY_PREFIX);
  const endpoint = optional(input.environment.REGULATORY_EVIDENCE_S3_ENDPOINT);
  const forcePathStyle = optionalBoolean(input.environment.REGULATORY_EVIDENCE_S3_FORCE_PATH_STYLE);

  if (input.nodeEnv === "production" && endpoint && !endpoint.startsWith("https://")) {
    throw new Error("EVIDENCE_S3_ENDPOINT_HTTPS_REQUIRED_IN_PRODUCTION");
  }

  return {
    bucket,
    region,
    kmsKeyId,
    ...(keyPrefix ? { keyPrefix } : {}),
    ...(endpoint ? { endpoint } : {}),
    ...(forcePathStyle !== undefined ? { forcePathStyle } : {}),
  };
}

function required(value: string | undefined, errorCode: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(errorCode);
  return trimmed;
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function optionalBoolean(value: string | undefined): boolean | undefined {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return undefined;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  throw new Error("EVIDENCE_S3_FORCE_PATH_STYLE_INVALID");
}
