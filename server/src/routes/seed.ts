import { Router, Request, Response } from "express";
import { execSync } from "child_process";
import path from "path";

const router = Router();

/**
 * GET/POST /api/seed?token=xxx
 * One-time setup: seeds admin, sample users, spaces, bookings.
 * Requires token matching SEED_TOKEN env var.
 */
const handleSeed = (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  const expected = process.env.SEED_TOKEN;

  if (!expected) {
    res.status(503).json({ error: "Seed not configured", hint: "Add SEED_TOKEN to Railway variables" });
    return;
  }
  if (!token || token !== expected) {
    res.status(403).json({ error: "Invalid or missing token", hint: "Use ?token=YOUR_SEED_TOKEN" });
    return;
  }

  try {
    const seedPath = path.join(__dirname, "../lib/seed.js");
    execSync(`node "${seedPath}"`, {
      stdio: "pipe",
      encoding: "utf-8",
      env: process.env,
    });
    res.json({ ok: true, message: "Database seeded successfully" });
  } catch (err) {
    const output = (err as { stdout?: string; stderr?: string }).stderr ?? (err as Error).message;
    console.error("Seed failed:", output);
    res.status(500).json({ error: "Seed failed", details: String(output) });
  }
};

router.get("/", handleSeed);
router.post("/", handleSeed);

export default router;
