import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

const baseUrl = process.env.REGULATORY_WEB_BASE_URL ?? "http://127.0.0.1:3100";

await fetch(`${baseUrl}/api/health/live`, { cache: "no-store" });
await fetch(`${baseUrl}/`, { cache: "no-store" });

const health = await sample("/api/health/live", 12);
const dashboard = await sample("/", 8);

if (health.failures !== 0) throw new Error(`PERFORMANCE_HEALTH_FAILURES:${health.failures}`);
if (dashboard.failures !== 0) throw new Error(`PERFORMANCE_DASHBOARD_FAILURES:${dashboard.failures}`);
if (health.p95Ms > 1000) throw new Error(`PERFORMANCE_HEALTH_P95_EXCEEDED:${health.p95Ms}`);
if (dashboard.p95Ms > 3000) throw new Error(`PERFORMANCE_DASHBOARD_P95_EXCEEDED:${dashboard.p95Ms}`);

const validation = {
  validationId: "WEB_PERFORMANCE_SMOKE_VALIDATION_V1",
  status: "PASS",
  checks: {
    healthRequestsSuccessful: true,
    dashboardRequestsSuccessful: true,
    healthP95WithinCiSmokeBudget: true,
    dashboardP95WithinCiSmokeBudget: true,
  },
  metrics: {
    health,
    dashboard,
  },
  budgetsMs: {
    healthP95: 1000,
    dashboardP95: 3000,
  },
  caveat:
    "Smoke de performance sur un serveur Next.js local de CI en mode local-json. Ce test détecte les régressions grossières mais ne constitue ni un test de charge, ni une mesure de capacité, ni un SLO de production.",
};

const validationPath = path.resolve("regulatory/validation/WEB_PERFORMANCE_SMOKE_VALIDATION.json");
await mkdir(path.dirname(validationPath), { recursive: true });
await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
console.log(JSON.stringify(validation, null, 2));

async function sample(route, count) {
  const durations = [];
  let failures = 0;
  for (let index = 0; index < count; index += 1) {
    const startedAt = performance.now();
    const response = await fetch(`${baseUrl}${route}`, { cache: "no-store" }).catch(() => null);
    durations.push(performance.now() - startedAt);
    if (!response?.ok) failures += 1;
  }
  durations.sort((left, right) => left - right);
  const percentileIndex = Math.max(0, Math.ceil(durations.length * 0.95) - 1);
  return {
    requests: count,
    failures,
    minMs: round(durations[0] ?? 0),
    medianMs: round(durations[Math.floor(durations.length / 2)] ?? 0),
    p95Ms: round(durations[percentileIndex] ?? 0),
    maxMs: round(durations.at(-1) ?? 0),
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}
