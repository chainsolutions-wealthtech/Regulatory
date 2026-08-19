import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const validationPath = path.resolve(
  process.cwd(),
  "../../regulatory/validation/WEB_BROWSER_ACCESSIBILITY_VALIDATION.json",
);
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const routes = [
  { path: "/", label: "dashboard" },
  { path: "/projects/united-capital-diamond", label: "project workspace" },
  { path: "/regulatory-library", label: "regulatory library" },
] as const;

async function assertAccessible(page: Page, label: string) {
  const scan = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  expect(scan.violations, `${label} accessibility violations`).toEqual([]);
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth, `${label} must not overflow horizontally`).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

test("browser navigation, responsive layout and WCAG A/AA automated checks stay clean", async ({ page, request }) => {
  for (const route of routes) {
    const response = await page.goto(route.path);
    expect(response?.ok(), `${route.label} must load successfully`).toBe(true);
    await expect(page.locator("body")).toBeVisible();
    await assertAccessible(page, route.label);
  }

  const evidenceResponse = await page.goto("/projects/united-capital-diamond/evidence");
  expect(evidenceResponse?.ok()).toBe(true);
  await expect(page.getByText("Runtime de preuves indisponible")).toBeVisible();
  await expect(page.getByText("Soumission verrouillée")).toBeVisible();
  await expect(page.getByRole("button", { name: /scan|clean|antivirus/i })).toHaveCount(0);
  await assertAccessible(page, "evidence workspace");

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

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [routes[0], routes[1]]) {
    const response = await page.goto(route.path);
    expect(response?.ok(), `${route.label} mobile must load successfully`).toBe(true);
    await assertNoHorizontalOverflow(page, `${route.label} mobile`);
    await assertAccessible(page, `${route.label} mobile`);
  }

  const mobileEvidence = await page.goto("/projects/united-capital-diamond/evidence");
  expect(mobileEvidence?.ok()).toBe(true);
  await expect(page.getByText("Runtime de preuves indisponible")).toBeVisible();
  await assertNoHorizontalOverflow(page, "evidence workspace mobile");
  await assertAccessible(page, "evidence workspace mobile");

  await page.keyboard.press("Tab");
  const focusIsVisible = await page.evaluate(() => document.activeElement !== document.body);
  expect(focusIsVisible, "Keyboard navigation must move focus away from the document body").toBe(true);

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
      desktopAutomatedWcagAAndAaNoViolations: true,
      mobileAutomatedWcagAAndAaNoViolations: true,
      mobileNoHorizontalOverflow: true,
      keyboardFocusNavigationAvailable: true,
      readyForSubmissionRemainsFalse: true,
    },
    caveat:
      "Les contrôles axe automatisés couvrent uniquement les violations détectables automatiquement. Une revue manuelle d’accessibilité et des tests utilisateurs inclusifs restent nécessaires pour une assurance WCAG complète.",
  };
  await mkdir(path.dirname(validationPath), { recursive: true });
  await writeFile(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
});
