import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";
const response = await fetch(`${baseUrl}/`, { redirect: "manual", cache: "no-store" });
if (response.status !== 200) throw new Error(`SECURITY_HEADERS_ROOT_STATUS:${response.status}`);

const expected = new Map([
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "no-referrer"],
  ["cross-origin-opener-policy", "same-origin"],
]);
for (const [name, value] of expected) {
  if (response.headers.get(name) !== value) {
    throw new Error(`SECURITY_HEADER_INVALID:${name}:${response.headers.get(name)}`);
  }
}

const permissions = response.headers.get("permissions-policy") ?? "";
for (const directive of ["camera=()", "microphone=()", "geolocation=()", "payment=()", "usb=()"] ) {
  if (!permissions.includes(directive)) throw new Error(`PERMISSIONS_POLICY_MISSING:${directive}`);
}

const csp = response.headers.get("content-security-policy") ?? "";
for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"]) {
  if (!csp.includes(directive)) throw new Error(`CSP_DIRECTIVE_MISSING:${directive}`);
}
if (csp.includes("default-src *")) throw new Error("CSP_WILDCARD_DEFAULT_FORBIDDEN");

if (!response.headers.get("strict-transport-security")?.includes("max-age=")) {
  throw new Error("HSTS_MISSING_IN_PRODUCTION_SERVER");
}
if (response.headers.has("x-powered-by")) throw new Error("X_POWERED_BY_MUST_BE_DISABLED");

const validation = {
  validationId: "WEB_SECURITY_HEADERS_VALIDATION_V1",
  status: "PASS",
  checks: {
    nosniff: true,
    clickjackingDenied: true,
    restrictiveReferrerPolicy: true,
    permissionsPolicy: true,
    contentSecurityPolicyBaseline: true,
    hstsOnProductionServer: true,
    poweredByDisabled: true,
  },
  caveat:
    "Baseline d'en-têtes de sécurité compatible avec le rendu Next.js actuel. La CSP utilise encore unsafe-inline pour scripts/styles et devra évoluer vers nonce/SRI lors du durcissement production.",
};
const validationPath = path.resolve("regulatory/validation/WEB_SECURITY_HEADERS_VALIDATION.json");
await mkdir(path.dirname(validationPath), { recursive: true });
await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
console.log(JSON.stringify(validation, null, 2));
