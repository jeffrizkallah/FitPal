/**
 * Auth setup helper — saves a Playwright storageState after login.
 *
 * Run once before authenticated tests:
 *   npx playwright test tests/setup-auth.ts --project=chromium-mobile
 *
 * Set environment variables:
 *   TEST_EMAIL=your@email.com
 *   TEST_PASSWORD=yourpassword
 */

import { test as setup } from "@playwright/test";
import path from "path";

const SESSION_PATH = path.resolve("tests/.auth/session.json");

setup("authenticate and save session", async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set TEST_EMAIL and TEST_PASSWORD env vars before running auth setup.\n" +
        "Example: TEST_EMAIL=you@example.com TEST_PASSWORD=secret npx playwright test tests/setup-auth.ts"
    );
  }

  await page.goto("/sign-in");

  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to home or onboarding
  await page.waitForURL(/\/(onboarding|workout|$)/, { timeout: 10_000 });

  await page.context().storageState({ path: SESSION_PATH });
  console.log(`Session saved to ${SESSION_PATH}`);
});
