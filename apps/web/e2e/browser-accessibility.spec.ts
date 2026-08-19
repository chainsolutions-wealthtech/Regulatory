import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const validationPath = path.resolve(
  process.cwd(),
  "../../regulatory/validation/WEB_BROWSER_ACCESSIBILITY_VALIDATION.json",
);

const routes = [
  { path: "/", label: "dashboard" },
  { path: "/projects/united-capital-diamond", label: "project workspace" },
  { path: "/regulatory-library", label: "regulatory library" },
] as const;

test("browser navigation is stable and WCAG A/AA automated checks stay clean", async ({ page, request }) => {
  for (const route of routes) {
    const response = await page.goto(route.path);
    expect(response?.ok(), `${route.label} must load successfully`).toBe(true);
    await expect(page.locator("body")).toBeVisible();

    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(scan.violations, `${route.label} accessibility violations`).toEqual([]);
  }

  const evidenceResponse = await page.goto("/projects/united-capital-diamond/evidence");
  expect(evidenceResponse?.ok()).toBe(true);
  await expect(page.getByText("Runtime de preuves indisponible")).toBeVisible();
  await expect(page.getByText("Soumission verrouillée")).toBeVisible();
  await expect(page.getByRole("button", { name: /scan|clean|antivirus/i })).toHaveCount(0);

  const forbiddenScanRoute = await request.post(
    "/api/evidence/50000000-0000-0000-0000-000000000001/scan",
    {
      data: {
        status: "CLEAN",
        expectedSha256: "a".repeat(64),
        detectedMediaType: "application/pdf",
      },
    },
  );
  expect(forbiddenScanRoute.status()).toBe(404);

  const evidenceScan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(evidenceScan.violations, "evidence workspace accessibility violations").toEqual([]);

  const validation = {
    validationId: "WEB_BROWSER_ACCESSIBILITY_VALIDATION_V1",
    status: "PASS",
    browser: "chromium",
    checks: {
      dashboardRendered: true,
      projectWorkspaceRendered: true,
      regulatoryLibraryRendered: true,
      evidenceRuntimeFailsClosedWithoutProductionDependencies: true,
      browserCannotSubmitScanVerdict: true,
      automatedWcagAAndAaNoViolations: true,
      readyForSubmissionRemainsFalse: true,
    },
    caveat:
      "Les contrôles axe automatisés couvrent uniquement les violations détectables automatiquement. Une revue manuelle d’accessibilité et des tests utilisateurs inclusifs restent nécessaires pour une assurance WCAG complète.",
  };
  await mkdir(path.dirname(validationPath), { recursive: true });
  await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
});
