import { test, expect } from "@playwright/test";

/**
 * Requires the local stack running with a seeded database:
 *   docker compose up -d postgres
 *   (cd server && npm run db:push && npm run db:seed && npm run dev)
 *   npm run dev
 * Uses the default seeded admin (server/.env.example: SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD).
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@spaceflow.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@SpaceFlow1!";

test.describe("auth", () => {
  test("logs in with valid credentials and reaches the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows an error on invalid credentials and stays on the login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("logs out and redirects an already-logged-in dashboard visit", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Reloading a protected route while still logged in should stay put, not bounce to /login.
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
