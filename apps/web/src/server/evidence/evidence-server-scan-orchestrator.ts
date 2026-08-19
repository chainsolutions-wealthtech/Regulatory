import "server-only";

import type { EvidenceObjectDescriptor } from "@/server/evidence/evidence-object-store";

export function createEvidenceServerScanOrchestrator(input: {
  descriptorService: {
    readForScanning(objectId: string): Promise<EvidenceObjectDescriptor>;
  };
  scanService: {
    scanQuarantined(descriptor: EvidenceObjectDescriptor): Promise<EvidenceObjectDescriptor>;
  };
}) {
  return {
    async scan(objectId: string): Promise<EvidenceObjectDescriptor> {
      if (!objectId.trim()) throw new Error("EVIDENCE_OBJECT_ID_REQUIRED");
      const descriptor = await input.descriptorService.readForScanning(objectId);
      if (descriptor.state !== "QUARANTINED" || descriptor.scanStatus !== "PENDING") {
        throw new Error("EVIDENCE_SCAN_REQUIRES_PENDING_QUARANTINE");
      }
      const scanned = await input.scanService.scanQuarantined(descriptor);
      if (scanned.state === "CLEAN") throw new Error("EVIDENCE_SCAN_MUST_NOT_AUTO_RELEASE");
      return scanned;
    },
  };
}
