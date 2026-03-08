import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Home page tests — require an authenticated session.
 *
 * Setup: set TEST_SESSION_STORAGE env var to a path to a Playwright
 * storageState JSON (saved after a successful login).
 *
 * Generate it once with:
 *   node -e "require('playwright').chromium.launch().then(async b => {
 *     const ctx = await b.newContext();
 *     const page = await ctx.newPage();
 *     await page.goto('http://localhost:3000/sign-in');
 *     // ... fill credentials and login ...
 *     await ctx.storageState({ path: 'tests/.auth/session.json' });
 *     await b.close();
 *   })"
 *
 * Or run: npx playwright codegen http://localhost:3000/sign-in
 */

const SESSION_PATH = "tests/.auth/session.json";
const hasSession = fs.existsSync(path.resolve(SESSION_PATH));

test.describe("Home screen", () => {
  test.skip(!hasSession, "No auth session found — run auth setup first");

  test.use({ storageState: SESSION_PATH });

  test("home page loads within 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    // Wait for the MacroRing SVG to appear (LCP element)
    await page.waitForSelector('[role="img"]', { timeout: 3000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });

  test("bottom navigation is visible with 4 tabs", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Train" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Fuel" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Advisor" })).toBeVisible();
  });

  test("macro ring SVG is accessible", async ({ page }) => {
    await page.goto("/");
    const svg = page.locator('svg[role="img"]').first();
    await expect(svg).toBeVisible();
    const label = await svg.getAttribute("aria-label");
    expect(label).toContain("calories");
  });

  test("greeting text is shown", async ({ page }) => {
    await page.goto("/");
    const greetings = ["Good morning", "Good afternoon", "Good evening"];
    let found = false;
    for (const g of greetings) {
      const el = page.getByText(new RegExp(g, "i"));
      if (await el.count() > 0) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  test("Train tab navigates to /workout", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Train" }).click();
    await page.waitForURL("**/workout");
    expect(page.url()).toContain("/workout");
  });

  test("Fuel tab navigates to /nutrition", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Fuel" }).click();
    await page.waitForURL("**/nutrition");
    expect(page.url()).toContain("/nutrition");
  });

  test("Advisor tab navigates to /advisor", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Advisor" }).click();
    await page.waitForURL("**/advisor");
    expect(page.url()).toContain("/advisor");
  });
});
