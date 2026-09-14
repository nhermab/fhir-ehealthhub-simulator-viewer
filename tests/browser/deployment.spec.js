import { test, expect } from "@playwright/test";

test("fresh installation sends searches directly to the hosted API", async ({ page }) => {
  let request;
  await page.route("https://dev-api.ehealthhub.be/DocumentReference/_search", async route => {
    request = route.request();
    await route.fulfill({
      contentType: "application/fhir+json",
      body: JSON.stringify({ resourceType: "Bundle", type: "searchset", total: 0, entry: [] }),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Find documents" }).click();
  await expect.poll(() => request?.method()).toBe("POST");
  expect(request.url()).toBe("https://dev-api.ehealthhub.be/DocumentReference/_search");
  expect(request.postData()).toContain("79080412345");
  await page.getByRole("link", { name: "Connections", exact: true }).click();
  await expect(page.getByLabel("FHIR base URL")).toHaveValue("https://dev-api.ehealthhub.be");
  await expect(page.getByLabel("HTTP transport")).toHaveValue("direct");
  await expect(page.locator('a[href="https://dev.ehealthhub.be/"]')).toBeVisible();
});
