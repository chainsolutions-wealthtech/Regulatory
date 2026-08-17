import "server-only";

import { assertAuthorized, type ProspectusRole } from "@/domain/authorization";
import type { EvidenceObjectStore } from "@/server/evidence/evidence-object-store";
import type { ImportStagingRepository } from "@/server/import/import-staging-repository";
import { createUnverifiedProspectusImport, type ProspectusExtractor } from "@/server/import/prospectus-import-service";
import { assertVerifiedIdentity, type VerifiedIdentityProvider } from "@/server/security/verified-identity";

export function createProspectusImportIngestionService(input: {
  evidenceStore: EvidenceObjectStore;
  stagingRepository: ImportStagingRepository;
  identityProvider: VerifiedIdentityProvider;
  extractor: ProspectusExtractor;
}) {
  return {
    async extractAndStage(command: {
      projectId: string;
      projectVersion: number;
      projectVersionId: string;
      evidenceObjectId: string;
    }) {
      if (!command.projectId.trim()) throw new Error("IMPORT_PROJECT_REQUIRED");
      if (!Number.isInteger(command.projectVersion) || command.projectVersion < 1) {
        throw new Error("IMPORT_PROJECT_VERSION_INVALID");
      }
      if (!command.projectVersionId.trim()) throw new Error("IMPORT_PROJECT_VERSION_ID_REQUIRED");
      if (!command.evidenceObjectId.trim()) throw new Error("IMPORT_EVIDENCE_OBJECT_ID_REQUIRED");

      const identity = assertVerifiedIdentity(await input.identityProvider.getVerifiedIdentity());
      assertAuthorized(
        {
          userId: identity.userId,
          organizationId: identity.organizationId,
          roles: identity.roles as ProspectusRole[],
        },
        "EVIDENCE_READ",
        { organizationId: identity.organizationId },
      );

      const evidence = await input.evidenceStore.readClean({
        objectId: command.evidenceObjectId,
        organizationId: identity.organizationId,
        requestedBy: identity.userId,
        authorizationDecisionId: "prospectus-import-extraction",
      });

      if (evidence.descriptor.organizationId !== identity.organizationId) {
        throw new Error("IMPORT_EVIDENCE_ORGANIZATION_MISMATCH");
      }
      if (evidence.descriptor.objectId !== command.evidenceObjectId) {
        throw new Error("IMPORT_EVIDENCE_OBJECT_MISMATCH");
      }
      if (evidence.descriptor.projectVersionId !== command.projectVersionId) {
        throw new Error("IMPORT_EVIDENCE_PROJECT_VERSION_MISMATCH");
      }

      const batch = await createUnverifiedProspectusImport({
        projectId: command.projectId,
        projectVersion: command.projectVersion,
        evidence,
        extractor: input.extractor,
      });
      const staged = await input.stagingRepository.createBatch({
        batch,
        projectVersionId: command.projectVersionId,
      });
      if (staged.canonicalWriteAllowed !== false || staged.readyForSubmission !== false) {
        throw new Error("IMPORT_STAGING_SAFETY_INVARIANT_VIOLATION");
      }
      return staged;
    },
  };
}
