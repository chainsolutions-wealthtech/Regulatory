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
  };

  if (input.storageDriver !== "postgresql") {
    blockers.push("POSTGRESQL_DRIVER_REQUIRED");
    return {
      ready: false,
      productionReady: false,
      dependencies,
      missingConfiguration,
      blockers,
      readyForSubmission: false,
    };
  }

  for (const name of ["DATABASE_URL", "OIDC_ISSUER", "OIDC_AUDIENCE", "OIDC_JWKS_URI"] as const) {
    if (!input.environment[name]?.trim()) missingConfiguration.push(name);
  }
  dependencies.oidc = missingConfiguration.some((name) => name.startsWith("OIDC_"))
    ? "NOT_CONFIGURED"
    : "CONFIGURED";

  const evidenceDriver = input.environment.REGULATORY_EVIDENCE_DRIVER?.trim();
  if (!evidenceDriver) {
    missingConfiguration.push("REGULATORY_EVIDENCE_DRIVER");
    dependencies.evidence = "NOT_CONFIGURED";
  } else if (evidenceDriver === "filesystem-development") {
    dependencies.evidence = "DEVELOPMENT_ONLY";
    if (!input.environment.REGULATORY_EVIDENCE_ROOT?.trim()) {
      missingConfiguration.push("REGULATORY_EVIDENCE_ROOT");
    }
    if (!input.environment.REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE?.trim()) {
      missingConfiguration.push("REGULATORY_EVIDENCE_ENCRYPTION_KEY_REFERENCE");
    }
    if (input.nodeEnv === "production") blockers.push("PRODUCTION_EVIDENCE_DRIVER_REQUIRED");
  } else {
    dependencies.evidence = "UNSUPPORTED";
    blockers.push("EVIDENCE_DRIVER_UNSUPPORTED");
  }

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

  const ready =
    blockers.length === 0 &&
    missingConfiguration.length === 0 &&
    dependencies.postgresql === "READY" &&
    dependencies.oidc === "CONFIGURED" &&
    dependencies.evidence === "DEVELOPMENT_ONLY";

  return {
    ready,
    productionReady: false,
    dependencies,
    missingConfiguration: [...new Set(missingConfiguration)].sort(),
    blockers: [...new Set(blockers)].sort(),
    readyForSubmission: false,
  };
}
