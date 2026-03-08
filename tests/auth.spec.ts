import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("sign-in page renders correctly", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test("sign-up page renders correctly", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: /sign up|create/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test("unauthenticated user is redirected from home to sign-in", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/sign-in**");
    expect(page.url()).toContain("sign-in");
  });

  test("unauthenticated user is redirected from workout to sign-in", async ({ page }) => {
    await page.goto("/workout");
    await page.waitForURL("**/sign-in**");
    expect(page.url()).toContain("sign-in");
  });

  test("sign-in with invalid credentials shows error", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByPlaceholder(/email/i).fill("notreal@example.com");
    await page.getByPlaceholder(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Should stay on sign-in page (not redirect to home)
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("sign-in");
  });
});
