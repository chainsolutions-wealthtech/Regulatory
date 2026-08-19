import "server-only";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  EvidenceBinaryLocation,
  EvidenceBinaryObjectKey,
  EvidenceBinaryStore,
  StageEvidenceBinaryInput,
} from "@/server/evidence/evidence-binary-store";

type S3CommandClient = {
  send(command: object): Promise<unknown>;
};

export type S3EvidenceBinaryStoreConfiguration = {
  bucket: string;
  region: string;
  kmsKeyId: string;
  keyPrefix?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  client?: S3CommandClient;
};

/**
 * Binary-only private S3/S3-compatible store.
 * PostgreSQL remains the sole source of truth for regulatory metadata,
 * scan status, release state, legal hold and audit data.
 */
export function createS3EvidenceBinaryStore(
  configuration: S3EvidenceBinaryStoreConfiguration,
): EvidenceBinaryStore {
  const bucket = required(configuration.bucket, "EVIDENCE_S3_BUCKET_REQUIRED");
  const region = required(configuration.region, "EVIDENCE_S3_REGION_REQUIRED");
  const kmsKeyId = required(configuration.kmsKeyId, "EVIDENCE_S3_KMS_KEY_REQUIRED");
  const keyPrefix = normalizePrefix(configuration.keyPrefix ?? "regulatory");
  const client: S3CommandClient = configuration.client ?? new S3Client({
    region,
    ...(configuration.endpoint ? { endpoint: configuration.endpoint } : {}),
    ...(configuration.forcePathStyle !== undefined
      ? { forcePathStyle: configuration.forcePathStyle }
      : {}),
  });

  return {
    provider: "S3_PRIVATE_KMS",
    productionReady: true,

    async stage(input: StageEvidenceBinaryInput) {
      assertBinaryKey(input);
      if (input.content.byteLength < 1) throw new Error("EVIDENCE_BINARY_EMPTY_CONTENT");
      const key = objectKey(keyPrefix, "quarantine", input);
      const cleanKey = objectKey(keyPrefix, "clean", input);
      if (await objectExists(client, bucket, key) || await objectExists(client, bucket, cleanKey)) {
        throw new Error("EVIDENCE_BINARY_OBJECT_ALREADY_EXISTS");
      }
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: input.content,
        ServerSideEncryption: "aws:kms",
        SSEKMSKeyId: kmsKeyId,
      }));
      return location(bucket, key, "S3_PRIVATE_KMS");
    },

    async readQuarantined(input: EvidenceBinaryObjectKey) {
      assertBinaryKey(input);
      const key = objectKey(keyPrefix, "quarantine", input);
      try {
        return await getObjectBytes(client, bucket, key);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        if (await objectExists(client, bucket, objectKey(keyPrefix, "clean", input))) {
          throw new Error("EVIDENCE_BINARY_QUARANTINE_OBJECT_NOT_FOUND");
        }
        throw new Error("EVIDENCE_BINARY_OBJECT_NOT_FOUND");
      }
    },

    async promoteToClean(input: EvidenceBinaryObjectKey) {
      assertBinaryKey(input);
      const quarantineKey = objectKey(keyPrefix, "quarantine", input);
      const cleanKey = objectKey(keyPrefix, "clean", input);
      if (await objectExists(client, bucket, cleanKey)) return location(bucket, cleanKey, "S3_PRIVATE_KMS");
      if (!(await objectExists(client, bucket, quarantineKey))) {
        throw new Error("EVIDENCE_BINARY_OBJECT_NOT_FOUND");
      }
      await client.send(new CopyObjectCommand({
        Bucket: bucket,
        Key: cleanKey,
        CopySource: encodeCopySource(bucket, quarantineKey),
        ServerSideEncryption: "aws:kms",
        SSEKMSKeyId: kmsKeyId,
      }));
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: quarantineKey }));
      return location(bucket, cleanKey, "S3_PRIVATE_KMS");
    },

    async readClean(input: EvidenceBinaryObjectKey) {
      assertBinaryKey(input);
      const key = objectKey(keyPrefix, "clean", input);
      try {
        return await getObjectBytes(client, bucket, key);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        if (await objectExists(client, bucket, objectKey(keyPrefix, "quarantine", input))) {
          throw new Error("EVIDENCE_BINARY_CLEAN_OBJECT_NOT_FOUND");
        }
        throw new Error("EVIDENCE_BINARY_OBJECT_NOT_FOUND");
      }
    },

    async delete(input: EvidenceBinaryObjectKey) {
      assertBinaryKey(input);
      await Promise.all([
        client.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: objectKey(keyPrefix, "quarantine", input),
        })),
        client.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: objectKey(keyPrefix, "clean", input),
        })),
      ]);
    },
  };
}

function location(bucket: string, key: string, provider: string): EvidenceBinaryLocation {
  return {
    storageProvider: provider,
    storageObjectKey: key,
    storageReference: `s3-private:${bucket}:${key}`,
    encryptionAlgorithm: "AWS_S3_SSE_KMS",
  };
}

function objectKey(
  prefix: string,
  zone: "quarantine" | "clean",
  input: EvidenceBinaryObjectKey,
): string {
  return `${prefix}/${zone}/${input.organizationId}/${input.objectId}`;
}

async function objectExists(client: S3CommandClient, bucket: string, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}

async function getObjectBytes(
  client: S3CommandClient,
  bucket: string,
  key: string,
): Promise<Uint8Array> {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key })) as {
    Body?: { transformToByteArray?: () => Promise<Uint8Array> };
  };
  if (!response.Body?.transformToByteArray) throw new Error("EVIDENCE_S3_RESPONSE_BODY_UNAVAILABLE");
  return Uint8Array.from(await response.Body.transformToByteArray());
}

function encodeCopySource(bucket: string, key: string): string {
  return [bucket, ...key.split("/")].map(encodeURIComponent).join("/");
}

function normalizePrefix(value: string): string {
  const prefix = value.trim().replace(/^\/+|\/+$/gu, "");
  if (!prefix || prefix.includes("..")) throw new Error("EVIDENCE_S3_KEY_PREFIX_INVALID");
  return prefix;
}

function assertBinaryKey(input: EvidenceBinaryObjectKey): void {
  if (!/^[0-9a-f-]{36}$/u.test(input.objectId)) throw new Error("EVIDENCE_BINARY_OBJECT_ID_INVALID");
  if (!/^[0-9a-f-]{36}$/u.test(input.organizationId)) throw new Error("EVIDENCE_BINARY_ORGANIZATION_ID_INVALID");
}

function required(value: string, errorCode: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(errorCode);
  return trimmed;
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: unknown; $metadata?: { httpStatusCode?: unknown } };
  return candidate.name === "NoSuchKey" ||
    candidate.name === "NotFound" ||
    candidate.$metadata?.httpStatusCode === 404;
}
