import type { EvidenceObjectDescriptor } from "@/server/evidence/evidence-object-store";

export function toPublicEvidenceMetadata(descriptor: EvidenceObjectDescriptor) {
  return {
    objectId: descriptor.objectId,
    projectVersionId: descriptor.projectVersionId,
    originalFilename: descriptor.originalFilename,
    safeFilename: descriptor.safeFilename,
    declaredMediaType: descriptor.declaredMediaType,
    detectedMediaType: descriptor.detectedMediaType,
    sha256: descriptor.sha256,
    byteSize: descriptor.byteSize,
    state: descriptor.state,
    scanStatus: descriptor.scanStatus,
    scanProvider: descriptor.scanProvider,
    scanEngineVersion: descriptor.scanEngineVersion,
    scanSignatureVersion: descriptor.scanSignatureVersion,
    scanCompletedAt: descriptor.scanCompletedAt,
    uploadedBy: descriptor.uploadedBy,
    releasedBy: descriptor.releasedBy,
    releasedAt: descriptor.releasedAt,
    retentionUntil: descriptor.retentionUntil,
    legalHold: descriptor.legalHold,
  };
}
