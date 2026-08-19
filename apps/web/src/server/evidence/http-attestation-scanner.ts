import "server-only";

import type {
  TrustedEvidenceScanAttestation,
  TrustedEvidenceScanRequest,
  TrustedEvidenceScanner,
} from "@/server/evidence/evidence-scan-release-service";

type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export function createHttpAttestationEvidenceScanner(input: {
  url: string;
  token: string;
  nodeEnv: string | undefined;
  timeoutMs?: number;
  fetchImpl?: FetchImplementation;
}): TrustedEvidenceScanner {
  const url = required(input.url, "EVIDENCE_SCANNER_URL_REQUIRED");
  const token = required(input.token, "EVIDENCE_SCANNER_TOKEN_REQUIRED");
  const timeoutMs = input.timeoutMs ?? 20_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120_000) {
    throw new Error("EVIDENCE_SCANNER_TIMEOUT_INVALID");
  }
  if (input.nodeEnv === "production" && !url.startsWith("https://")) {
    throw new Error("EVIDENCE_SCANNER_HTTPS_REQUIRED_IN_PRODUCTION");
  }
  const fetchImpl = input.fetchImpl ?? fetch;

  return {
    id: "http-attestation-scanner",
    async scan(request: TrustedEvidenceScanRequest): Promise<TrustedEvidenceScanAttestation> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        let response: Response;
        try {
          response = await fetchImpl(url, {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
              accept: "application/json",
              "cache-control": "no-store",
            },
            body: JSON.stringify({
              objectId: request.objectId,
              storageProvider: request.storageProvider,
              storageObjectKey: request.storageObjectKey,
              storageReference: request.storageReference,
              expectedSha256: request.expectedSha256,
              byteSize: request.byteSize,
              ...(request.declaredMediaType ? { declaredMediaType: request.declaredMediaType } : {}),
            }),
            cache: "no-store",
            signal: controller.signal,
          });
        } catch (error) {
          if (controller.signal.aborted) throw new Error("EVIDENCE_SCANNER_TIMEOUT");
          throw new Error("EVIDENCE_SCANNER_NETWORK_FAILURE");
        }
        if (!response.ok) throw new Error(`EVIDENCE_SCANNER_HTTP_FAILURE:${response.status}`);

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new Error("EVIDENCE_SCANNER_RESPONSE_INVALID_JSON");
        }
        return parseAttestation(payload);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function parseAttestation(payload: unknown): TrustedEvidenceScanAttestation {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("EVIDENCE_SCANNER_ATTESTATION_INVALID");
  }
  const value = payload as Record<string, unknown>;
  const expectedSha256 = requiredString(value.expectedSha256, "EVIDENCE_SCANNER_ATTESTATION_DIGEST_REQUIRED");
  if (!/^[0-9a-f]{64}$/u.test(expectedSha256)) throw new Error("EVIDENCE_SCANNER_ATTESTATION_DIGEST_INVALID");
  const detectedMediaType = requiredString(value.detectedMediaType, "EVIDENCE_SCANNER_MEDIA_TYPE_REQUIRED");
  const status = requiredString(value.status, "EVIDENCE_SCANNER_STATUS_REQUIRED");
  if (!(["CLEAN", "INFECTED", "ERROR", "NOT_SUPPORTED"] as const).includes(status as never)) {
    throw new Error("EVIDENCE_SCANNER_STATUS_INVALID");
  }
  const scanProvider = requiredString(value.scanProvider, "EVIDENCE_SCANNER_PROVIDER_REQUIRED");
  const scanEngineVersion = requiredString(value.scanEngineVersion, "EVIDENCE_SCANNER_ENGINE_VERSION_REQUIRED");
  const scanSignatureVersion = requiredString(value.scanSignatureVersion, "EVIDENCE_SCANNER_SIGNATURE_VERSION_REQUIRED");
  const scanCompletedAt = requiredString(value.scanCompletedAt, "EVIDENCE_SCANNER_COMPLETED_AT_REQUIRED");
  if (Number.isNaN(Date.parse(scanCompletedAt))) throw new Error("EVIDENCE_SCANNER_COMPLETED_AT_INVALID");
  const details = value.details;
  if (details !== undefined && (!details || typeof details !== "object" || Array.isArray(details))) {
    throw new Error("EVIDENCE_SCANNER_DETAILS_INVALID");
  }

  return {
    expectedSha256,
    detectedMediaType,
    status: status as TrustedEvidenceScanAttestation["status"],
    scanProvider,
    scanEngineVersion,
    scanSignatureVersion,
    scanCompletedAt,
    ...(details ? { details: details as Record<string, unknown> } : {}),
  };
}

function required(value: string, errorCode: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(errorCode);
  return trimmed;
}

function requiredString(value: unknown, errorCode: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(errorCode);
  return value.trim();
}
