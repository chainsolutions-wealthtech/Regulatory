import "server-only";

import type { EvidenceObjectStore } from "@/server/evidence/evidence-object-store";
import { createEvidenceDescriptorService } from "@/server/evidence/evidence-descriptor-service";
import { createEvidenceServerScanOrchestrator } from "@/server/evidence/evidence-server-scan-orchestrator";
import {
  createTrustedEvidenceScanService,
  type TrustedEvidenceScanner,
} from "@/server/evidence/evidence-scan-release-service";
import type { VerifiedIdentityProvider } from "@/server/security/verified-identity";

export function createEvidenceScanWorker(input: {
  evidenceStore: EvidenceObjectStore;
  scanner: TrustedEvidenceScanner;
  identityProvider: VerifiedIdentityProvider;
}) {
  const descriptorService = createEvidenceDescriptorService({
    evidenceStore: input.evidenceStore,
    identityProvider: input.identityProvider,
  });
  const scanService = createTrustedEvidenceScanService({
    evidenceStore: input.evidenceStore,
    scanner: input.scanner,
  });
  return createEvidenceServerScanOrchestrator({ descriptorService, scanService });
}
