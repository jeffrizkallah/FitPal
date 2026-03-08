import { test, expect } from "@playwright/test";

test.describe("PWA", () => {
  test("manifest.json is served with correct content", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe("Forma");
    expect(manifest.short_name).toBe("Forma");
    expect(manifest.display).toBe("standalone");
    expect(manifest.background_color).toBe("#f0f0f0");
    expect(manifest.theme_color).toBe("#f0f0f0");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test("service worker file is served correctly", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("javascript");
  });

  test("PWA icons are served (192px)", async ({ request }) => {
    const response = await request.get("/icons/icon-192.png");
    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("image/png");
  });

  test("PWA icons are served (512px)", async ({ request }) => {
    const response = await request.get("/icons/icon-512.png");
    expect(response.status()).toBe(200);
  });

  test("app loads and meta viewport is set correctly", async ({ page }) => {
    await page.goto("/sign-in");
    const viewport = await page.$eval(
      'meta[name="viewport"]',
      (el) => el.getAttribute("content")
    );
    expect(viewport).toContain("width=device-width");
  });

  test("service worker header allows root scope", async ({ request }) => {
    const response = await request.get("/sw.js");
    const allowedHeader = response.headers()["service-worker-allowed"];
    expect(allowedHeader).toBe("/");
  });
});
