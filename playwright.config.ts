import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Expects the app already running locally:
 *   - frontend: `npm run dev` (http://localhost:8080)
 *   - backend:  `npm run dev` in server/ (http://localhost:4000)
 *   - postgres: `docker compose up -d postgres`, then `npm run db:push && npm run db:seed` in server/
 *
 * Does not manage a webServer itself — this repo's dev servers are long-running
 * and often already up during local development; auto-starting/stopping them
 * here would fight that instead of helping it.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
