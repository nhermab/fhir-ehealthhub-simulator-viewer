import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("interhub-settings"))
      localStorage.setItem("interhub-settings", JSON.stringify({ mode: "demo" }));
  });
});

test("the workspace opens dark, cycles themes and remembers the choice", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /Colour theme/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  // The pre-paint script must settle the theme before the app boots.
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage["interhub-settings"]).theme,
    ),
  ).toBe("light");
  await page.getByRole("button", { name: /Colour theme/ }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage["interhub-settings"]).theme,
    ),
  ).toBe("system");
  await page.getByRole("button", { name: /Colour theme/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("JSON viewer: tree, path copy, filter and highlighted raw source", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  await page.getByRole("tab", { name: "JSON" }).click();
  const viewer = page.locator(".jsonview").first();
  await expect(viewer.locator("details.j-node").first()).toBeVisible();
  await expect(viewer.locator(".j-key").first()).toBeVisible();

  const openBefore = await viewer.locator("details.j-node[open]").count();
  await viewer.getByRole("button", { name: /Collapse/ }).click();
  expect(await viewer.locator("details.j-node[open]").count()).toBeLessThan(
    openBefore,
  );
  await viewer.getByRole("button", { name: /Expand/ }).click();
  expect(
    await viewer.locator("details.j-node[open]").count(),
  ).toBeGreaterThanOrEqual(openBefore);

  await viewer.getByLabel("Filter JSON").fill("masterIdentifier");
  await expect(viewer.locator('[data-path="masterIdentifier"]')).toBeVisible();
  await expect(viewer.locator('[data-path="status"]')).toBeHidden();
  await viewer.getByLabel("Filter JSON").fill("");
  await expect(viewer.locator('[data-path="status"]')).toBeVisible();

  await viewer.getByRole("button", { name: "Raw" }).click();
  await expect(viewer.locator(".code-gutter")).toBeVisible();
  await expect(viewer.locator(".tk-key").first()).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-json-viewer.png`,
    fullPage: true,
  });
});

test("command palette navigates, runs transactions and lists shortcuts", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  await page.keyboard.press("Control+k");
  await expect(page.locator(".palette")).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-palette.png`,
  });
  await page.getByLabel("Command palette search").fill("fhir console");
  await page.keyboard.press("Enter");
  await expect(page.locator(".request-builder")).toBeVisible();
  await expect(page.locator(".palette")).toHaveCount(0);

  await page.keyboard.press("Control+k");
  await page.getByLabel("Command palette search").fill("410");
  await page.keyboard.press("Enter");
  await expect(page.locator("#console-body")).toHaveValue(/retrieve|withdrawn/);

  await page.keyboard.press("Escape");
  await page.keyboard.press("?");
  await expect(page.locator(".shortcut-card")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".shortcut-card")).toHaveCount(0);
});

test("console: highlighted editor, decoded form, replay and code snippets", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  await page.locator('a[href="#console"]').click();
  await expect(page.locator(".editor-view .tk-key").first()).toBeVisible();
  await expect(page.locator(".decoded-form")).toContainText("patient.identifier");

  await page.getByRole("button", { name: /^Send/ }).click();
  await expect(page.locator(".response-summary")).toContainText("200");
  await expect(page.locator(".jsonview .j-key").first()).toBeVisible();

  await page.getByRole("button", { name: "Code snippet" }).click();
  await page.getByRole("button", { name: "Python", exact: true }).click();
  await expect(page.locator(".response-panel .code-block")).toContainText(
    "urllib.request",
  );
  await expect(page.locator(".response-panel .tk-kw").first()).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-console.png`,
    fullPage: true,
  });

  await page.getByRole("button", { name: "Headers" }).click();
  await expect(page.locator(".response-panel .data-table").first()).toContainText(
    "content-type",
  );

  await page.getByRole("button", { name: "Replay request" }).first().click();
  await expect(page.locator("#toast")).toContainText("request builder");
});

test("two documents can be pinned and diffed", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  const pins = page.locator(".doc-pin");
  await pins.nth(0).click();
  await pins.nth(1).click();
  await expect(page.locator(".compare-pins")).toContainText("2/2");
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.locator(".compare-head")).toBeVisible();
  await expect(page.locator(".diff-summary")).toContainText("difference");
  await expect(page.locator(".diff-row.add").first()).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-compare.png`,
    fullPage: true,
  });
});

test("the guide renders markdown with a table of contents and find-in-page", async ({
  page,
}, testInfo) => {
  await page.goto("/#guide");
  await expect(page.locator("#guide-body")).toContainText("Interhub");
  await expect(page.locator("#guide-body h2").first()).toBeVisible();
  await expect(page.locator(".md-toc a").first()).toBeVisible();
  await page.getByLabel("Find in guide source").fill("DocumentReference");
  await expect(page.locator("#guide-body mark").first()).toBeVisible();
  await expect(page.locator("#guide-hits")).toContainText("match");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-guide.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Source", exact: true }).click();
  await expect(page.locator("#guide-body .code-gutter")).toBeVisible();
});

test("keyboard shortcuts move the selection and jump between pages", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".doc-row")).toHaveCount(4);
  const first = await page.locator(".doc-row.selected .doc-title").innerText();
  await page.keyboard.press("j");
  const second = await page.locator(".doc-row.selected .doc-title").innerText();
  expect(second).not.toBe("");
  await page.keyboard.press("k");
  await expect(page.locator(".doc-row.selected .doc-title")).toHaveText(first);
  await page.keyboard.press("g");
  await page.keyboard.press("c");
  await expect(page.locator(".request-builder")).toBeVisible();
});
