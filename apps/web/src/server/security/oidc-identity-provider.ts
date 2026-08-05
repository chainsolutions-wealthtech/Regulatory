import "server-only";

import { headers } from "next/headers";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import {
  assertVerifiedIdentity,
  type VerifiedIdentityContext,
  type VerifiedIdentityProvider,
} from "@/server/security/verified-identity";
import type { ProspectusRole } from "@/domain/authorization";

let cachedJwks:
  | { uri: string; keySet: ReturnType<typeof createRemoteJWKSet> }
  | undefined;

export function createNextOidcIdentityProvider(): VerifiedIdentityProvider {
  return {
    async getVerifiedIdentity(): Promise<VerifiedIdentityContext> {
      const config = oidcConfiguration();
      const requestHeaders = await headers();
      const authorization = requestHeaders.get("authorization");
      if (!authorization?.startsWith("Bearer ")) {
        throw new Error("OIDC_BEARER_TOKEN_REQUIRED");
      }
      const token = authorization.slice("Bearer ".length).trim();
      if (!token) throw new Error("OIDC_BEARER_TOKEN_REQUIRED");

      const keySet = remoteKeySet(config.jwksUri);
      const result = await jwtVerify(token, keySet, {
        issuer: config.issuer,
        audience: config.audience,
        algorithms: config.algorithms,
        clockTolerance: config.clockToleranceSeconds,
      });
      return mapOidcClaimsToIdentity(result.payload, {
        provider: config.providerLabel,
        organizationClaim: config.organizationClaim,
        rolesClaim: config.rolesClaim,
        userIdClaim: config.userIdClaim,
      });
    },
  };
}

export function mapOidcClaimsToIdentity(
  payload: JWTPayload,
  options: {
    provider: string;
    organizationClaim: string;
    rolesClaim: string;
    userIdClaim: string;
  },
): VerifiedIdentityContext {
  const subject = String(payload.sub ?? "").trim();
  const organizationId = String(payload[options.organizationClaim] ?? "").trim();
  const userId = String(payload[options.userIdClaim] ?? "").trim();
  const rawRoles = payload[options.rolesClaim];
  const roles = normalizeRoles(rawRoles);
  const verifiedAt = new Date().toISOString();
  return assertVerifiedIdentity({
    subject,
    organizationId,
    userId,
    roles,
    verifiedAt,
    provider: options.provider,
  });
}

function oidcConfiguration() {
  const issuer = requiredEnvironment("OIDC_ISSUER");
  const audience = requiredEnvironment("OIDC_AUDIENCE");
  const jwksUri = requiredEnvironment("OIDC_JWKS_URI");
  if (!jwksUri.startsWith("https://") && process.env.NODE_ENV === "production") {
    throw new Error("OIDC_JWKS_URI_MUST_USE_HTTPS_IN_PRODUCTION");
  }
  return {
    issuer,
    audience,
    jwksUri,
    providerLabel: process.env.OIDC_PROVIDER_LABEL ?? issuer,
    organizationClaim: process.env.OIDC_ORGANIZATION_CLAIM ?? "organization_id",
    userIdClaim: process.env.OIDC_USER_ID_CLAIM ?? "user_id",
    rolesClaim: process.env.OIDC_ROLES_CLAIM ?? "roles",
    algorithms: (process.env.OIDC_ALLOWED_ALGORITHMS ?? "RS256,ES256")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    clockToleranceSeconds: Number(process.env.OIDC_CLOCK_TOLERANCE_SECONDS ?? "10"),
  };
}

function remoteKeySet(uri: string) {
  if (!cachedJwks || cachedJwks.uri !== uri) {
    cachedJwks = {
      uri,
      keySet: createRemoteJWKSet(new URL(uri), {
        timeoutDuration: 5_000,
        cooldownDuration: 30_000,
        cacheMaxAge: 600_000,
      }),
    };
  }
  return cachedJwks.keySet;
}

function normalizeRoles(value: unknown): ProspectusRole[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[ ,]+/)
      : [];
  const allowed = new Set<ProspectusRole>([
    "ADMIN",
    "PRODUCT",
    "RISK",
    "COMPLIANCE",
    "LEGAL",
    "TAX",
    "OPERATIONS",
    "SECURITY",
    "AUDIT",
    "READER",
  ]);
  const roles = values
    .map((item) => String(item).trim().toUpperCase() as ProspectusRole)
    .filter((role) => allowed.has(role));
  if (roles.length === 0) throw new Error("OIDC_VALID_ROLE_REQUIRED");
  return [...new Set(roles)];
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`OIDC_CONFIGURATION_MISSING:${name}`);
  return value;
}
