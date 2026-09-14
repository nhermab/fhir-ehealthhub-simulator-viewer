import { test, expect } from "@playwright/test";
test("document search, metadata, clinical retrieval, PDF and partial failure", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  await expect(page.locator(".patient-info h2")).toHaveText("Jan Peeters");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-workspace.png`,
    fullPage: true,
  });
  await page.locator('.doc-row[data-id="DocRefLabReportContainedExample"]').click();
  await page.getByRole("tab", { name: "Checks" }).click();
  await expect(page.locator(".check-row.fail")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Retrieve FHIR", exact: true })
    .click();
  await expect(page.locator(".clinical-header")).toContainText("document");
  await expect(page.locator(".observation")).toHaveCount(2);
  await page.getByRole("button", { name: "View PDF", exact: true }).click();
  await expect(page.locator(".pdf-preview")).toBeVisible();
  await page.locator('a[href="#settings"]').click();
  await page.getByLabel("Simulate partial failure").check();
  await page.getByRole("button", { name: "Save connection" }).click();
  await page.getByRole("link", { name: "Documents", exact: true }).click();
  await page.getByRole("button", { name: "Find documents" }).click();
  await expect(page.locator(".notice.warning")).toContainText(
    "Some sources could not be reached",
  );
  await expect(page.locator(".doc-row")).toHaveCount(4);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("console, error responses, authentication persistence and guide", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  await page.locator('a[href="#console"]').click();
  await page.getByRole("button", { name: "410 Gone", exact: true }).click();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".response-panel")).toContainText("410");
  await expect(page.locator(".response-panel .jsonview")).toContainText(
    "withdrawn",
  );
  await page.locator('a[href="#auth"]').click();
  await page.getByRole("button", { name: "Generate P-256 key" }).click();
  await expect(page.locator("#thumbprint")).not.toHaveText("Calculating…");
  await page.getByLabel("Bearer / DPoP access token").fill("test-token");
  await page.getByRole("button", { name: "Apply authentication" }).click();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "test-token",
  );
  await page.reload();
  await expect(page.getByLabel("Bearer / DPoP access token")).toHaveValue("");
  await page.locator('a[href="#guide"]').click();
  await expect(page.locator("#guide-body")).toContainText(
    "Interhub Transactions",
  );
  await expect(page.locator("#guide-body h2").first()).toBeVisible();
  await page.getByRole("button", { name: "FSH · Minimal", exact: true }).click();
  await expect(page.locator("#guide-body")).toContainText(
    "BeInterhubMinimalDocumentReference",
  );
  await expect(page.locator("#guide-body .tk-kw").first()).toBeVisible();
});
test("filters, empty state, pagination and mobile layout", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  await page.getByRole("button", { name: /^Telemonitoring/ }).click();
  await expect(page.locator(".doc-row")).toHaveCount(1);
  await page.getByLabel("Filter returned documents").fill("no match");
  await expect(page.locator("#document-rows")).toContainText("No documents");
  await page.getByLabel("Filter returned documents").fill("");
  await page.getByRole("button", { name: /^All documents/ }).click();
  await page.locator(".advanced summary").click();
  await page.getByLabel("Results per page").fill("1");
  await page.getByRole("button", { name: "Find documents" }).click();
  await expect(page.locator(".doc-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.locator(".doc-row")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("imported document renders safely and pages fit the viewport", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  const bundle = {
    resourceType: "Bundle",
    type: "document",
    identifier: { system: "urn:test", value: "1" },
    timestamp: "2026-01-01T00:00:00Z",
    entry: [
      {
        fullUrl: "urn:uuid:1",
        resource: {
          resourceType: "Composition",
          id: "imported",
          title: "Imported report",
          section: [
            {
              title: "Findings",
              text: {
                div: '<div>Safe narrative <img src=x onerror="window.injected=true"><script>window.injected=true</script></div>',
              },
            },
          ],
        },
      },
    ],
  };
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "bundle.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(bundle)),
    });
  await expect(page.locator(".clinical-header")).toContainText(
    "Imported report",
  );
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await expect(
    page.getByRole("button", { name: "Retrieve FHIR", exact: true }),
  ).toHaveCount(0);
  for (const name of [
    "Patient timeline",
    "FHIR console",
    "Authentication",
    "IG workbench",
    "Implementation guide",
    "Connections",
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByLabel("Appearance").selectOption("dark");
  await page.getByRole("button", { name: "Save connection" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("live Java search and retrieval through local proxy", async ({ page }) => {
  test.skip(
    !process.env.LIVE_TESTS,
    "Set LIVE_TESTS=1 with Java running on :8080",
  );
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  await page.getByRole("link", { name: "Connections", exact: true }).click();
  await page.getByRole("combobox", { name: "Environment", exact: true }).selectOption("live");
  await page.getByRole("button", { name: "Save connection" }).click();
  await page
    .getByRole("button", { name: "Test connection", exact: true })
    .click();
  await expect(page.locator("#toast")).toContainText("Responder reached");
  await page.getByRole("link", { name: "Documents", exact: true }).click();
  await page.getByRole("button", { name: "Find documents" }).click();
  await expect(page.locator(".doc-row").first()).toBeVisible();
  await page
    .locator('.doc-row[data-id="DocRefLabReportContainedExample"]')
    .first()
    .click();
  await page
    .getByRole("button", { name: "Retrieve FHIR", exact: true })
    .click();
  await expect(page.locator(".clinical-header")).toContainText("document");
  await page.getByRole("button", { name: "View PDF", exact: true }).click();
  await expect(page.locator(".pdf-preview")).toBeVisible();
});

test("Transaction 3: lab observation search, discrete values, and provenance", async ({
  page,
}) => {
  await page.goto("/#observations");
  await expect(page.locator(".doc-row")).toHaveCount(1);
  await expect(page.locator(".doc-title").first()).toContainText("Fasting glucose");
  await expect(page.locator(".doc-description").first()).toContainText("92 mg/dL");

  // Click Serum Creatinine preset
  await page.getByRole("button", { name: /Serum Creatinine/ }).click();
  await expect(page.locator(".doc-row")).toHaveCount(1);
  await expect(page.locator(".doc-title").first()).toContainText("Creatinine");

  // Click Both preset
  await page.getByRole("button", { name: "Glucose + Creatinine" }).click();
  await expect(page.locator(".doc-row")).toHaveCount(2);

  // Inspect detail tabs
  await page.getByRole("tab", { name: /Provenance/ }).click();
  await expect(page.locator(".tab-content")).toContainText("Source document uniqueId");

  await page.getByRole("tab", { name: /Structural checks/ }).click();
  await expect(page.locator(".checks-table")).toBeVisible();
  await expect(page.locator(".checks-table tr.fail")).toHaveCount(0);
});
