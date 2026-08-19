import "server-only";

import { assertAuthorized, type ProspectusRole } from "@/domain/authorization";
import type {
  EvidenceObjectDescriptor,
  EvidenceObjectStore,
  EvidenceScanStatus,
} from "@/server/evidence/evidence-object-store";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

export type TrustedEvidenceScanRequest = {
  objectId: string;
  storageProvider: string;
  storageObjectKey: string;
  storageReference: string;
  expectedSha256: string;
  byteSize: number;
  declaredMediaType?: string;
};

export type TrustedEvidenceScanAttestation = {
  expectedSha256: string;
  detectedMediaType: string;
  status: Exclude<EvidenceScanStatus, "PENDING">;
  scanProvider: string;
  scanEngineVersion: string;
  scanSignatureVersion: string;
  scanCompletedAt: string;
  details?: Record<string, unknown>;
};

export interface TrustedEvidenceScanner {
  readonly id: string;
  scan(input: TrustedEvidenceScanRequest): Promise<TrustedEvidenceScanAttestation>;
}

export function createTrustedEvidenceScanService(input: {
  evidenceStore: EvidenceObjectStore;
  scanner: TrustedEvidenceScanner;
}) {
  if (!input.scanner.id.trim()) throw new Error("EVIDENCE_SCANNER_ID_REQUIRED");

  return {
    async scanQuarantined(descriptor: EvidenceObjectDescriptor) {
      if (descriptor.state !== "QUARANTINED" || descriptor.scanStatus !== "PENDING") {
        throw new Error("EVIDENCE_SCAN_REQUIRES_PENDING_QUARANTINE");
      }
      const attestation = await input.scanner.scan({
        objectId: descriptor.objectId,
        storageProvider: descriptor.storageProvider,
        storageObjectKey: descriptor.storageObjectKey,
        storageReference: descriptor.storageReference,
        expectedSha256: descriptor.sha256,
        byteSize: descriptor.byteSize,
        ...(descriptor.declaredMediaType ? { declaredMediaType: descriptor.declaredMediaType } : {}),
      });
      if (attestation.expectedSha256 !== descriptor.sha256) {
        throw new Error("EVIDENCE_SCANNER_DIGEST_MISMATCH");
      }

      const scanned = await input.evidenceStore.recordScan({
        objectId: descriptor.objectId,
        expectedSha256: descriptor.sha256,
        detectedMediaType: attestation.detectedMediaType,
        status: attestation.status,
        scanProvider: attestation.scanProvider,
        scanEngineVersion: attestation.scanEngineVersion,
        scanSignatureVersion: attestation.scanSignatureVersion,
        scanCompletedAt: attestation.scanCompletedAt,
        trustedServerResult: true,
        ...(attestation.details ? { details: attestation.details } : {}),
      });

      if (attestation.status === "CLEAN" && scanned.state === "CLEAN") {
        throw new Error("EVIDENCE_SCAN_MUST_NOT_AUTO_RELEASE");
      }
      return scanned;
    },
  };
}

export function createEvidenceReleaseService(input: {
  evidenceStore: EvidenceObjectStore;
  identityProvider: VerifiedIdentityProvider;
}) {
  return {
    async releaseCleanScan(command: {
      descriptor: EvidenceObjectDescriptor;
      releasedAt: string;
    }) {
      const identity = assertVerifiedIdentity(await input.identityProvider.getVerifiedIdentity());
      if (command.descriptor.organizationId !== identity.organizationId) {
        throw new Error("EVIDENCE_RELEASE_ORGANIZATION_MISMATCH");
      }
      assertAuthorized(
        {
          userId: identity.userId,
          organizationId: identity.organizationId,
          roles: identity.roles as ProspectusRole[],
        },
        "EVIDENCE_VERIFY",
        { organizationId: identity.organizationId },
      );

      if (command.descriptor.state === "CLEAN" && command.descriptor.scanStatus === "CLEAN") {
        if (!command.descriptor.releasedBy || !command.descriptor.releasedAt) {
          throw new Error("EVIDENCE_RELEASE_AUDIT_METADATA_REQUIRED");
        }
        return command.descriptor;
      }
      if (command.descriptor.state !== "QUARANTINED" || command.descriptor.scanStatus !== "CLEAN") {
        throw new Error("EVIDENCE_RELEASE_REQUIRES_CLEAN_SCAN");
      }
      if (!command.releasedAt.trim() || Number.isNaN(Date.parse(command.releasedAt))) {
        throw new Error("EVIDENCE_RELEASE_TIMESTAMP_INVALID");
      }

      const released = await input.evidenceStore.release({
        objectId: command.descriptor.objectId,
        releasedBy: identity.userId,
        releasedAt: command.releasedAt,
      });
      if (released.state !== "CLEAN" || released.scanStatus !== "CLEAN") {
        throw new Error("EVIDENCE_RELEASE_DID_NOT_PRODUCE_CLEAN_OBJECT");
      }
      return released;
    },
  };
}
