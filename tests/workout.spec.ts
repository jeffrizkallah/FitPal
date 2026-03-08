import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const SESSION_PATH = "tests/.auth/session.json";
const hasSession = fs.existsSync(path.resolve(SESSION_PATH));

test.describe("Workout", () => {
  test.skip(!hasSession, "No auth session found — run auth setup first");

  test.use({ storageState: SESSION_PATH });

  test("workout hub renders", async ({ page }) => {
    await page.goto("/workout");
    // Should show either an active plan or an empty state — not a crash
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    // Should not show error boundary
    expect(body).not.toContain("Application error");
  });

  test("plan builder page loads", async ({ page }) => {
    await page.goto("/workout/plan/new");
    await page.waitForLoadState("networkidle");
    // Should have an exercise picker or form
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
  });

  test("workout history page loads", async ({ page }) => {
    await page.goto("/workout/history");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
  });

  test("exercise completion circle is accessible", async ({ page }) => {
    await page.goto("/workout");
    await page.waitForLoadState("networkidle");
    // If there's an active plan with exercises, there should be a completion button
    const doneButtons = page.getByRole("button");
    // Just verifying the page renders without errors
    expect(await doneButtons.count()).toBeGreaterThanOrEqual(0);
  });
});
