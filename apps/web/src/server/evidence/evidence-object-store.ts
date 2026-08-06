import "server-only";

import evidencePolicy from "@/generated/security/SECURE_EVIDENCE_STORAGE_V1.json";

export type EvidenceObjectState =
  | "QUARANTINED"
  | "SCANNING"
  | "CLEAN"
  | "INFECTED"
  | "REJECTED"
  | "DELETION_PENDING"
  | "DELETED";

export type EvidenceScanStatus = "PENDING" | "CLEAN" | "INFECTED" | "ERROR" | "NOT_SUPPORTED";

export type EvidenceObjectDescriptor = {
  objectId: string;
  organizationId: string;
  projectVersionId: string;
  storageProvider: string;
  storageObjectKey: string;
  storageReference: string;
  originalFilename: string;
  safeFilename: string;
  declaredMediaType?: string;
  detectedMediaType?: string;
  sha256: string;
  byteSize: number;
  encryptionAlgorithm: string;
  encryptionKeyReference: string;
  state: EvidenceObjectState;
  scanStatus: EvidenceScanStatus;
  scanProvider?: string;
  scanEngineVersion?: string;
  scanSignatureVersion?: string;
  scanCompletedAt?: string;
  uploadedBy: string;
  releasedBy?: string;
  releasedAt?: string;
  retentionUntil: string;
  legalHold: boolean;
};

export type StageEvidenceInput = {
  organizationId: string;
  projectVersionId: string;
  originalFilename: string;
  declaredMediaType?: string;
  content: Uint8Array;
  uploadedBy: string;
  encryptionKeyReference: string;
};

export type RecordEvidenceScanInput = {
  objectId: string;
  expectedSha256: string;
  detectedMediaType: string;
  status: Exclude<EvidenceScanStatus, "PENDING">;
  scanProvider: string;
  scanEngineVersion: string;
  scanSignatureVersion: string;
  scanCompletedAt: string;
  trustedServerResult: true;
  details?: Record<string, unknown>;
};

export type ReleaseEvidenceInput = {
  objectId: string;
  releasedBy: string;
  releasedAt: string;
};

export type ReadEvidenceInput = {
  objectId: string;
  organizationId: string;
  requestedBy: string;
  authorizationDecisionId: string;
};

export type EvidenceReadResult = {
  descriptor: EvidenceObjectDescriptor;
  content: Uint8Array;
  headers: {
    "content-type": string;
    "content-disposition": string;
    "cache-control": "private, no-store";
  };
};

export interface EvidenceObjectStore {
  readonly provider: string;
  readonly productionReady: boolean;
  stage(input: StageEvidenceInput): Promise<EvidenceObjectDescriptor>;
  recordScan(input: RecordEvidenceScanInput): Promise<EvidenceObjectDescriptor>;
  release(input: ReleaseEvidenceInput): Promise<EvidenceObjectDescriptor>;
  readClean(input: ReadEvidenceInput): Promise<EvidenceReadResult>;
  setLegalHold(objectId: string, legalHold: boolean, actorId: string): Promise<EvidenceObjectDescriptor>;
  requestDeletion(objectId: string, actorId: string): Promise<EvidenceObjectDescriptor>;
}

export function assertEvidenceIngestionAllowed(input: StageEvidenceInput): void {
  if (!input.organizationId.trim()) throw new Error("EVIDENCE_ORGANIZATION_REQUIRED");
  if (!input.projectVersionId.trim()) throw new Error("EVIDENCE_PROJECT_VERSION_REQUIRED");
  if (!input.uploadedBy.trim()) throw new Error("EVIDENCE_UPLOADER_REQUIRED");
  if (!input.encryptionKeyReference.trim()) throw new Error("EVIDENCE_ENCRYPTION_KEY_REFERENCE_REQUIRED");
  if (input.content.byteLength < 1) throw new Error("EVIDENCE_EMPTY_FILE_REJECTED");
  if (input.content.byteLength > evidencePolicy.ingestion.maximumByteSize) {
    throw new Error("EVIDENCE_MAXIMUM_BYTE_SIZE_EXCEEDED");
  }
  if (!input.originalFilename.trim()) throw new Error("EVIDENCE_FILENAME_REQUIRED");
  if (/[\\/\0]/u.test(input.originalFilename)) throw new Error("EVIDENCE_FILENAME_PATH_REJECTED");
}

export function assertTrustedScanResult(input: RecordEvidenceScanInput): void {
  if (input.trustedServerResult !== true) throw new Error("EVIDENCE_BROWSER_SCAN_RESULT_REJECTED");
  if (!/^[0-9a-f]{64}$/u.test(input.expectedSha256)) throw new Error("EVIDENCE_SCAN_DIGEST_INVALID");
  if (!input.scanProvider.trim()) throw new Error("EVIDENCE_SCAN_PROVIDER_REQUIRED");
  if (!input.scanEngineVersion.trim()) throw new Error("EVIDENCE_SCAN_ENGINE_VERSION_REQUIRED");
  if (!input.scanSignatureVersion.trim()) throw new Error("EVIDENCE_SCAN_SIGNATURE_VERSION_REQUIRED");
  if (!input.scanCompletedAt.trim()) throw new Error("EVIDENCE_SCAN_COMPLETION_REQUIRED");
}

export function assertDetectedMediaTypeMayBeReleased(mediaType: string): void {
  const allowed = evidencePolicy.ingestion.allowedDetectedMediaTypes as readonly string[];
  const blocked = evidencePolicy.ingestion.blockedDetectedMediaTypes as readonly string[];
  if (blocked.includes(mediaType)) throw new Error(`EVIDENCE_MEDIA_TYPE_BLOCKED:${mediaType}`);
  if (!allowed.includes(mediaType)) throw new Error(`EVIDENCE_MEDIA_TYPE_NOT_ALLOWED:${mediaType}`);
}

export function safeEvidenceFilename(originalFilename: string): string {
  const normalized = originalFilename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^A-Za-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 128);
  return normalized || "evidence.bin";
}

export const secureEvidenceStoragePolicyVersion = evidencePolicy.schemaVersion;
