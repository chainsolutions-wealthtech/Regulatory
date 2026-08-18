import assert from "node:assert/strict";
import type { EvidenceObjectDescriptor, EvidenceObjectStore } from "@/server/evidence/evidence-object-store";
import { createEvidenceDescriptorService } from "@/server/evidence/evidence-descriptor-service";
import { createFixedTestIdentityProvider } from "@/server/security/verified-identity";

const organizationId = "10000000-0000-0000-0000-000000000001";
const objectId = "50000000-0000-0000-0000-000000000001";
const descriptor: EvidenceObjectDescriptor = {
  objectId,
  organizationId,
  projectVersionId: "40000000-0000-0000-0000-000000000001",
  storageProvider: "private-object-store",
  storageObjectKey: "quarantine/object-1",
  storageReference: "opaque:object-1",
  originalFilename: "prospectus.pdf",
  safeFilename: "prospectus.pdf",
  declaredMediaType: "application/pdf",
  sha256: "a".repeat(64),
  byteSize: 1234,
  encryptionAlgorithm: "AES-256-GCM",
  encryptionKeyReference: "kms:key/1",
  state: "QUARANTINED",
  scanStatus: "CLEAN",
  scanProvider: "clamav",
  scanEngineVersion: "1.4",
  scanSignatureVersion: "2026-08-18",
  scanCompletedAt: "2026-08-18T18:00:00.000Z",
  uploadedBy: "20000000-0000-0000-0000-000000000001",
  retentionUntil: "2036-08-18T00:00:00.000Z",
  legalHold: false,
};

let metadataReads = 0;
const store = {
  provider: "test",
  productionReady: false,
  async readDescriptor(input: { objectId: string; organizationId: string; requestedBy: string; authorizationDecisionId: string }) {
    metadataReads += 1;
    assert.equal(input.objectId, objectId);
    assert.equal(input.organizationId, organizationId);
    assert.ok(input.requestedBy);
    assert.ok(input.authorizationDecisionId);
    return descriptor;
  },
} as EvidenceObjectStore;

const reader = createEvidenceDescriptorService({
  evidenceStore: store,
  identityProvider: createFixedTestIdentityProvider({
    subject: "subject-reader",
    userId: "20000000-0000-0000-0000-000000000002",
    organizationId,
    roles: ["READER"],
    verifiedAt: "2026-08-18T18:01:00.000Z",
    provider: "test",
  }),
});
const loaded = await reader.readMetadata(objectId);
assert.equal(loaded.objectId, objectId);
assert.equal(metadataReads, 1);

const verifier = createEvidenceDescriptorService({
  evidenceStore: store,
  identityProvider: createFixedTestIdentityProvider({
    subject: "subject-compliance",
    userId: "20000000-0000-0000-0000-000000000003",
    organizationId,
    roles: ["COMPLIANCE"],
    verifiedAt: "2026-08-18T18:01:00.000Z",
    provider: "test",
  }),
});
const forVerification = await verifier.readForVerification(objectId);
assert.equal(forVerification.scanStatus, "CLEAN");
assert.equal(metadataReads, 2);

const product = createEvidenceDescriptorService({
  evidenceStore: store,
  identityProvider: createFixedTestIdentityProvider({
    subject: "subject-product",
    userId: "20000000-0000-0000-0000-000000000004",
    organizationId,
    roles: ["PRODUCT"],
    verifiedAt: "2026-08-18T18:01:00.000Z",
    provider: "test",
  }),
});
const readsBeforeDenied = metadataReads;
await assert.rejects(() => product.readForVerification(objectId), /AUTHORIZATION_DENIED:EVIDENCE_VERIFY/);
assert.equal(metadataReads, readsBeforeDenied);

console.log("EVIDENCE_DESCRIPTOR_SERVICE_PASS");
