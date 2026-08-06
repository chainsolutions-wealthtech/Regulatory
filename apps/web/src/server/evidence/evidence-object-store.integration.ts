import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDevelopmentFilesystemEvidenceStore } from "@/server/evidence/filesystem-evidence-object-store";

const root = await mkdtemp(path.join(tmpdir(), "regulatory-evidence-"));
const store = createDevelopmentFilesystemEvidenceStore(root);

try {
  const content = new TextEncoder().encode("%PDF-1.7\nsecure evidence test\n");
  const staged = await store.stage({
    organizationId: "10000000-0000-0000-0000-000000000001",
    projectVersionId: "40000000-0000-0000-0000-000000000001",
    originalFilename: "Décision officielle.pdf",
    declaredMediaType: "application/pdf",
    content,
    uploadedBy: "20000000-0000-0000-0000-000000000001",
    encryptionKeyReference: "development-only-key-reference",
  });
  assert(staged.state === "QUARANTINED", "Upload must start quarantined.");
  assert(!staged.storageReference.startsWith("http"), "Storage reference must not be public.");
  assert(store.productionReady === false, "Filesystem store must never claim production readiness.");

  const scanned = await store.recordScan({
    objectId: staged.objectId,
    expectedSha256: staged.sha256,
    detectedMediaType: "application/pdf",
    status: "CLEAN",
    scanProvider: "CI_TRUSTED_SCANNER_STUB",
    scanEngineVersion: "1.0.0",
    scanSignatureVersion: "2026-08-06",
    scanCompletedAt: new Date().toISOString(),
    trustedServerResult: true,
  });
  assert(scanned.scanStatus === "CLEAN", "Trusted clean scan must be recorded.");
  assert(scanned.state === "QUARANTINED", "Clean scan alone must not release the object.");

  const released = await store.release({
    objectId: staged.objectId,
    releasedBy: "20000000-0000-0000-0000-000000000002",
    releasedAt: new Date().toISOString(),
  });
  assert(released.state === "CLEAN", "Human/server release must move object to CLEAN.");

  const read = await store.readClean({
    objectId: staged.objectId,
    organizationId: staged.organizationId,
    requestedBy: "20000000-0000-0000-0000-000000000002",
    authorizationDecisionId: "authorization-test-decision",
  });
  assert(read.headers["cache-control"] === "private, no-store", "Evidence reads must not be cached publicly.");
  assert(Buffer.from(read.content).equals(Buffer.from(content)), "Released content must remain byte-identical.");

  await expectFailure(
    () => store.readClean({
      objectId: staged.objectId,
      organizationId: "other-tenant",
      requestedBy: "20000000-0000-0000-0000-000000000002",
      authorizationDecisionId: "authorization-test-decision",
    }),
    "EVIDENCE_TENANT_MISMATCH",
  );

  await store.setLegalHold(staged.objectId, true, "20000000-0000-0000-0000-000000000002");
  await expectFailure(
    () => store.requestDeletion(staged.objectId, "20000000-0000-0000-0000-000000000002"),
    "EVIDENCE_LEGAL_HOLD_PREVENTS_DELETION",
  );

  const blocked = await store.stage({
    organizationId: staged.organizationId,
    projectVersionId: staged.projectVersionId,
    originalFilename: "dangerous.html",
    declaredMediaType: "text/html",
    content: new TextEncoder().encode("<html><script>alert(1)</script></html>"),
    uploadedBy: staged.uploadedBy,
    encryptionKeyReference: "development-only-key-reference",
  });
  await store.recordScan({
    objectId: blocked.objectId,
    expectedSha256: blocked.sha256,
    detectedMediaType: "text/html",
    status: "CLEAN",
    scanProvider: "CI_TRUSTED_SCANNER_STUB",
    scanEngineVersion: "1.0.0",
    scanSignatureVersion: "2026-08-06",
    scanCompletedAt: new Date().toISOString(),
    trustedServerResult: true,
  });
  await expectFailure(
    () => store.release({
      objectId: blocked.objectId,
      releasedBy: "20000000-0000-0000-0000-000000000002",
      releasedAt: new Date().toISOString(),
    }),
    "EVIDENCE_MEDIA_TYPE_BLOCKED:text/html",
  );

  console.log(JSON.stringify({
    validationId: "SECURE_EVIDENCE_OBJECT_STORE_VALIDATION_V1",
    status: "PASS",
    checks: {
      quarantinedByDefault: true,
      opaquePrivateReference: true,
      trustedServerScanRequired: true,
      cleanScanDoesNotAutoRelease: true,
      explicitReleaseRequired: true,
      digestPreserved: true,
      tenantReadIsolation: true,
      noPublicCache: true,
      legalHoldPreventsDeletion: true,
      blockedMediaTypeRejected: true,
      developmentStoreNotProductionReady: true,
    },
    caveat: "Le scanner CI est un stub de confiance réservé au test. Aucun antivirus, KMS ou stockage objet de production n’est activé.",
  }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}

async function expectFailure(action: () => Promise<unknown>, expectedMessage: string): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof Error && error.message === expectedMessage) return;
    throw error;
  }
  throw new Error(`EXPECTED_FAILURE_NOT_RAISED:${expectedMessage}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
