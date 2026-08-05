import "server-only";

export type VerifiedIdentityContext = {
  subject: string;
  userId: string;
  organizationId: string;
  roles: string[];
  verifiedAt: string;
  provider: string;
};

export interface VerifiedIdentityProvider {
  getVerifiedIdentity(): Promise<VerifiedIdentityContext>;
}

export function assertVerifiedIdentity(
  value: VerifiedIdentityContext,
): VerifiedIdentityContext {
  if (!value.subject.trim()) throw new Error("IDENTITY_SUBJECT_REQUIRED");
  if (!isUuid(value.userId)) throw new Error("IDENTITY_USER_ID_INVALID");
  if (!isUuid(value.organizationId)) throw new Error("IDENTITY_ORGANIZATION_ID_INVALID");
  if (!Array.isArray(value.roles) || value.roles.length === 0) {
    throw new Error("IDENTITY_ROLE_REQUIRED");
  }
  if (!value.provider.trim()) throw new Error("IDENTITY_PROVIDER_REQUIRED");
  const verifiedAt = Date.parse(value.verifiedAt);
  if (!Number.isFinite(verifiedAt)) throw new Error("IDENTITY_VERIFIED_AT_INVALID");
  return value;
}

export const unconfiguredIdentityProvider: VerifiedIdentityProvider = {
  async getVerifiedIdentity(): Promise<VerifiedIdentityContext> {
    throw new Error(
      "IDENTITY_PROVIDER_NOT_CONFIGURED: a PostgreSQL repository requires a server-verified identity and tenant context.",
    );
  },
};

export function createFixedTestIdentityProvider(
  identity: VerifiedIdentityContext,
): VerifiedIdentityProvider {
  const verified = assertVerifiedIdentity(identity);
  if (process.env.NODE_ENV === "production") {
    throw new Error("FIXED_TEST_IDENTITY_FORBIDDEN_IN_PRODUCTION");
  }
  return {
    async getVerifiedIdentity() {
      return verified;
    },
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  ) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
