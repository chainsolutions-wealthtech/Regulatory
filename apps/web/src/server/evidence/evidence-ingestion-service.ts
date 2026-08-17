import "server-only";

import { assertAuthorized, type ProspectusRole } from "@/domain/authorization";
import type { EvidenceObjectStore } from "@/server/evidence/evidence-object-store";
import { assertVerifiedIdentity, type VerifiedIdentityProvider } from "@/server/security/verified-identity";

export function createEvidenceIngestionService(input: {
  evidenceStore: EvidenceObjectStore;
  identityProvider: VerifiedIdentityProvider;
  encryptionKeyReference: string;
}) {
  if (!input.encryptionKeyReference.trim()) {
    throw new Error("EVIDENCE_ENCRYPTION_KEY_REFERENCE_REQUIRED");
  }

  return {
    async stageEvidence(command: {
      projectVersionId: string;
      originalFilename: string;
      declaredMediaType?: string;
      content: Uint8Array;
    }) {
      const identity = assertVerifiedIdentity(await input.identityProvider.getVerifiedIdentity());
      assertAuthorized(
        {
          userId: identity.userId,
          organizationId: identity.organizationId,
          roles: identity.roles as ProspectusRole[],
        },
        "EVIDENCE_WRITE",
        { organizationId: identity.organizationId },
      );

      const descriptor = await input.evidenceStore.stage({
        organizationId: identity.organizationId,
        projectVersionId: command.projectVersionId,
        originalFilename: command.originalFilename,
        ...(command.declaredMediaType ? { declaredMediaType: command.declaredMediaType } : {}),
        content: command.content,
        uploadedBy: identity.userId,
        encryptionKeyReference: input.encryptionKeyReference,
      });

      if (descriptor.state !== "QUARANTINED" || descriptor.scanStatus !== "PENDING") {
        throw new Error("EVIDENCE_INGESTION_MUST_REMAIN_QUARANTINED");
      }
      return descriptor;
    },
  };
}
