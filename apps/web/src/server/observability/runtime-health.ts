import "server-only";

export type RuntimeDependencyState =
  | "READY"
  | "CONFIGURED"
  | "DEVELOPMENT_ONLY"
  | "NOT_CONFIGURED"
  | "UNAVAILABLE"
  | "UNSUPPORTED";

export type RuntimeReadiness = {
  ready: boolean;
  productionReady: boolean;
  dependencies: {
    postgresql: RuntimeDependencyState;
    oidc: RuntimeDependencyState;
    evidence: RuntimeDependencyState;
    scanner: RuntimeDependencyState;
  };
  missingConfiguration: string[];
  blockers: string[];
  readyForSubmission: false;
};

export async function evaluateRuntimeReadiness(input: {
  storageDriver: "local-json" | "postgresql";
  nodeEnv: string | undefined;
  environment: Record<string, string | undefined>;
  databaseProbe: () => Promise<void>;
}): Promise<RuntimeReadiness> {
  const missingConfiguration: string[] = [];
  const blockers: string[] = [];
  const dependencies: RuntimeReadiness["dependencies"] = {
    postgresql: "NOT_CONFIGURED",
    oidc: "NOT_CONFIGURED",
    evidence: "NOT_CONFIGURED",
    scanner: "NOT_CONFIGURED",
  };

  if (input.storageDriver !== "postgresql") {
    blockers.push("POSTGRESQL_DRIVER_REQUIRED");
    return result(false, false, dependencies, missingConfiguration, blockers);
  }

  for (const name of ["DATABASE_URL", "OIDC_ISSUER", "OIDC_AUDIENCE", "OIDC_JWKS_URI"] as const) {
    if (!input.environment[name]?.trim()) missingConfiguration.push(name);
  }
  dependencies.oidc = missingConfiguration.some((name) => name.startsWith("OIDC_"))
    ? "NOT_CONFIGURED"
    : "CONFIGURED";

  configureEvidence(input, dependencies, missingConfiguration, blockers);
  configureScanner(input, dependencies, missingConfiguration, blockers);

  if (!missingConfiguration.includes("DATABASE_URL")) {
    try {
      await input.databaseProbe();
      dependencies.postgresql = "READY";
    } catch {
      dependencies.postgresql = "UNAVAILABLE";
      blockers.push("POSTGRESQL_UNAVAILABLE");
    }
  }

  if (missingConfiguration.length > 0) blockers.push("CONFIGURATION_MISSING");

  const isProduction = input.nodeEnv === "production";
  const evidenceOperational = isProduction
    ? dependencies.evidence === "CONFIGURED"
    : dependencies.evidence === "DEVELOPMENT_ONLY" || dependencies.evidence === "CONFIGURED";
  const scannerOperational = isProduction
    ? dependencies.scanner === "CONFIGURED"
    : dependencies.scanner === "NOT_CONFIGURED" || dependencies.scanner === "CONFIGURED";

  const ready =
    blockers.length === 0 &&
    missingConfiguration.length === 0 &&
    dependencies.postgresql === "READY" &&
    dependencies.oidc === "CONFIGURED" &&
    evidenceOperational &&
    scannerOperational;

  const productionReady =
    ready &&
    isProduction &&
    dependencies.evidence === "CONFIGURED" &&
    dependencies.scanner === "CONFIGURED";

  return result(ready, productionReady, dependencies, missingConfiguration, blockers);
}

function configureEvidence(
  input: {
    nodeEnv: string | undefined;
    environment: Record<string, string | undefined>;
  },
  dependencies: RuntimeReadiness["dependencies"],
  missingConfiguration: string[],
  blockers: string[],
): void {
  const evidenceDriver = input.environment.REGULATORY_EVIDENCE_DRIVER?.trim();
  if (!evidenceDriver) {
    missingConfiguration.push("REGULATORY_EVIDENCE_DRIVER");
    dependencies.evidence = "NOT_CONFIGURED";
    return;
  }

  if (evidenceDriver === "filesystem-development") {
    dependencies.evidence = "DEVELOPMENT_ONLY";
    for (const name of [
      "REGULATORY_EVIDENCE_ROOT",
      "REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE",
    ] as const) {
      if (!input.environment[name]?.trim()) missingConfiguration.push(name);
    }
    if (input.nodeEnv === "production") blockers.push("PRODUCTION_EVIDENCE_DRIVER_REQUIRED");
    return;
  }

  if (evidenceDriver === "s3-private") {
    const requiredNames = [
      "REGULATORY_EVIDENCE_S3_BUCKET",
      "REGULATORY_EVIDENCE_S3_REGION",
      "REGULATORY_EVIDENCE_S3_KMS_KEY_ID",
      "REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE",
    ] as const;
    for (const name of requiredNames) {
      if (!input.environment[name]?.trim()) missingConfiguration.push(name);
    }
    dependencies.evidence = requiredNames.some((name) => !input.environment[name]?.trim())
      ? "NOT_CONFIGURED"
      : "CONFIGURED";
    return;
  }

  dependencies.evidence = "UNSUPPORTED";
  blockers.push("EVIDENCE_DRIVER_UNSUPPORTED");
}

function configureScanner(
  input: {
    nodeEnv: string | undefined;
    environment: Record<string, string | undefined>;
  },
  dependencies: RuntimeReadiness["dependencies"],
  missingConfiguration: string[],
  blockers: string[],
): void {
  const scannerDriver = input.environment.REGULATORY_EVIDENCE_SCANNER_DRIVER?.trim();
  if (!scannerDriver) {
    dependencies.scanner = "NOT_CONFIGURED";
    if (input.nodeEnv === "production") blockers.push("PRODUCTION_SCANNER_REQUIRED");
    return;
  }

  if (scannerDriver !== "http-attestation") {
    dependencies.scanner = "UNSUPPORTED";
    blockers.push("SCANNER_DRIVER_UNSUPPORTED");
    return;
  }

  const url = input.environment.REGULATORY_EVIDENCE_SCANNER_URL?.trim();
  const token = input.environment.REGULATORY_EVIDENCE_SCANNER_TOKEN?.trim();
  if (!url) missingConfiguration.push("REGULATORY_EVIDENCE_SCANNER_URL");
  if (!token) missingConfiguration.push("REGULATORY_EVIDENCE_SCANNER_TOKEN");
  dependencies.scanner = url && token ? "CONFIGURED" : "NOT_CONFIGURED";

  if (input.nodeEnv === "production" && url && !url.startsWith("https://")) {
    blockers.push("SCANNER_HTTPS_REQUIRED_IN_PRODUCTION");
  }
}

function result(
  ready: boolean,
  productionReady: boolean,
  dependencies: RuntimeReadiness["dependencies"],
  missingConfiguration: string[],
  blockers: string[],
): RuntimeReadiness {
  return {
    ready,
    productionReady,
    dependencies,
    missingConfiguration: [...new Set(missingConfiguration)].sort(),
    blockers: [...new Set(blockers)].sort(),
    readyForSubmission: false,
  };
}
