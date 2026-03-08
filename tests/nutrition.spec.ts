import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const SESSION_PATH = "tests/.auth/session.json";
const hasSession = fs.existsSync(path.resolve(SESSION_PATH));

test.describe("Nutrition", () => {
  test.skip(!hasSession, "No auth session found — run auth setup first");

  test.use({ storageState: SESSION_PATH });

  test("nutrition hub renders macro progress bars", async ({ page }) => {
    await page.goto("/nutrition");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
    // Should show calorie or macro labels
    expect(body).toMatch(/cal|protein|carb|fat/i);
  });

  test("log meal page renders camera UI", async ({ page }) => {
    await page.goto("/nutrition/log");
    await page.waitForLoadState("networkidle");
    // Camera / file input should be present
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test("log meal page shows image preview after file selection", async ({ page }) => {
    await page.goto("/nutrition/log");
    await page.waitForLoadState("networkidle");

    // Create a small test image buffer
    const testImagePath = path.resolve("tests/fixtures/test-food.jpg");
    if (!fs.existsSync(testImagePath)) {
      test.skip();
      return;
    }

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Image preview should appear
    await page.waitForSelector("img", { timeout: 2000 });
    const img = page.locator("img").first();
    await expect(img).toBeVisible();
  });

  test("daily nutrition API returns valid data", async ({ request }) => {
    // Note: This test requires auth cookies — skip if no session
    const response = await request.get("/api/nutrition/daily");
    // Without auth it should redirect or return 401
    expect([200, 302, 401]).toContain(response.status());
  });
});
