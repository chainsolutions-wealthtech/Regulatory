import "server-only";

import { assertAuthorized, type ProspectusAction, type ProspectusRole } from "@/domain/authorization";
import type { EvidenceObjectDescriptor, EvidenceObjectStore } from "@/server/evidence/evidence-object-store";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";

export function createEvidenceDescriptorService(input: {
  evidenceStore: EvidenceObjectStore;
  identityProvider: VerifiedIdentityProvider;
}) {
  async function readAuthorized(
    objectId: string,
    action: Extract<ProspectusAction, "EVIDENCE_READ" | "EVIDENCE_SCAN" | "EVIDENCE_VERIFY">,
  ): Promise<EvidenceObjectDescriptor> {
    if (!objectId.trim()) throw new Error("EVIDENCE_OBJECT_ID_REQUIRED");
    const identity = assertVerifiedIdentity(await input.identityProvider.getVerifiedIdentity());
    assertAuthorized(
      {
        userId: identity.userId,
        organizationId: identity.organizationId,
        roles: identity.roles as ProspectusRole[],
      },
      action,
      { organizationId: identity.organizationId },
    );
    if (!input.evidenceStore.readDescriptor) {
      throw new Error("EVIDENCE_DESCRIPTOR_READ_UNAVAILABLE");
    }
    const descriptor = await input.evidenceStore.readDescriptor({
      objectId,
      organizationId: identity.organizationId,
      requestedBy: identity.userId,
      authorizationDecisionId: `${action}:${identity.userId}:${objectId}`,
    });
    if (descriptor.organizationId !== identity.organizationId) {
      throw new Error("EVIDENCE_TENANT_MISMATCH");
    }
    return descriptor;
  }

  return {
    readMetadata(objectId: string) {
      return readAuthorized(objectId, "EVIDENCE_READ");
    },
    readForScanning(objectId: string) {
      return readAuthorized(objectId, "EVIDENCE_SCAN");
    },
    readForVerification(objectId: string) {
      return readAuthorized(objectId, "EVIDENCE_VERIFY");
    },
  };
}
