import assert from "node:assert/strict";
import { createBearerOidcIdentityProvider } from "@/server/security/oidc-identity-provider";
import type { VerifiedIdentityContext } from "@/server/security/verified-identity";

const expected: VerifiedIdentityContext = {
  subject: "scanner-service",
  userId: "20000000-0000-0000-0000-000000000008",
  organizationId: "10000000-0000-0000-0000-000000000001",
  roles: ["SECURITY"],
  verifiedAt: "2026-08-19T18:20:00.000Z",
  provider: "test-oidc",
};
let verifiedToken = "";
const provider = createBearerOidcIdentityProvider({
  token: " service-oidc-token ",
  verifyToken: async (token) => {
    verifiedToken = token;
    return expected;
  },
});
assert.deepEqual(await provider.getVerifiedIdentity(), expected);
assert.equal(verifiedToken, "service-oidc-token");

assert.throws(
  () => createBearerOidcIdentityProvider({ token: "", verifyToken: async () => expected }),
  /OIDC_BEARER_TOKEN_REQUIRED/,
);

console.log("BEARER_OIDC_IDENTITY_PROVIDER_PASS");
