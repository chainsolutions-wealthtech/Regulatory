import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const validationPath = path.resolve(
  process.cwd(),
  "../../regulatory/validation/WEB_BROWSER_ACCESSIBILITY_VALIDATION.json",
);
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.setTimeout(120_000);
const routes = [
  { path: "/", label: "dashboard" },
  { path: "/operations", label: "operations cockpit" },
  { path: "/reviews", label: "review center" },
  { path: "/projects/united-capital-diamond", label: "project workspace" },
  { path: "/projects/united-capital-diamond/canonical-data", label: "canonical data" },
  { path: "/projects/united-capital-diamond/concordance", label: "regulatory concordance" },
  { path: "/projects/united-capital-diamond/document-studio", label: "document studio" },
  { path: "/regulatory-library", label: "regulatory library" },
  { path: "/regulatory-library/sources", label: "regulatory source explorer" },
  { path: "/regulatory-library/requirements", label: "regulatory requirement explorer" },
  { path: "/regulatory-library/dependencies", label: "regulatory dependency graph" },
  { path: "/regulatory-library/clause-proposals", label: "clause studio" },
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

  const reviewCenterResponse = await page.goto("/reviews");
  expect(reviewCenterResponse?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "Centre de revues" })).toBeVisible();
  await expect(page.getByText("Lecture transverse uniquement")).toBeVisible();
  await expect(page.getByRole("button", { name: /approuver|rejeter|décider|transition/i })).toHaveCount(0);
  await assertAccessible(page, "review center is read-only");

  const filteredReviewCenter = await page.goto(
    "/reviews?role=COMPLIANCE&status=CHANGES_REQUESTED&q=diamond",
  );
  expect(filteredReviewCenter?.ok()).toBe(true);
  await expect(page.locator('select[name="role"]')).toHaveValue("COMPLIANCE");
  await expect(page.locator('select[name="status"]')).toHaveValue("CHANGES_REQUESTED");
  await expect(page.locator('input[name="q"]')).toHaveValue("diamond");
  await expect(page.getByRole("heading", { name: "Séparation des tâches" })).toBeVisible();
  await expect(page.getByText("PRODUCT_CANNOT_SELF_APPROVE_COMPLIANCE")).toBeVisible();
  await expect(page.getByRole("button", { name: /approuver|rejeter|décider|transition/i })).toHaveCount(0);
  await assertNoHorizontalOverflow(page, "review center contextual filters");
  await assertAccessible(page, "review center contextual filters stay read-only");

  const documentStudioResponse = await page.goto("/projects/united-capital-diamond/document-studio");
  expect(documentStudioResponse?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "Document Studio" })).toBeVisible();
  await expect(page.getByText("ready_for_submission=false", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /générer|soumettre|envoyer/i })).toHaveCount(0);
  await assertAccessible(page, "document studio remains read-only");

  const clauseStudioResponse = await page.goto("/regulatory-library/clause-proposals");
  expect(clauseStudioResponse?.ok()).toBe(true);
  await expect(page.getByRole("button", { name: /activer|activation globale/i })).toHaveCount(0);
  await expect(page.getByText("Activation globale interdite")).toBeVisible();
  await assertAccessible(page, "clause studio activation gate");

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
  for (const route of routes) {
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
      operationsCockpitRendered: true,
      reviewCenterRendered: true,
      reviewCenterReadOnly: true,
      reviewCenterContextFiltersReadOnly: true,
      reviewCenterSeparationOfDutiesVisible: true,
      projectWorkspaceRendered: true,
      canonicalDataRendered: true,
      regulatoryConcordanceRendered: true,
      documentStudioRendered: true,
      documentStudioReadOnly: true,
      regulatoryLibraryRendered: true,
      regulatorySourceExplorerRendered: true,
      regulatoryRequirementExplorerRendered: true,
      regulatoryDependencyGraphRendered: true,
      clauseStudioRendered: true,
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
