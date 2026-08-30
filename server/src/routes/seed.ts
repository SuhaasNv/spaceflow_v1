import { Router, Request, Response } from "express";
import { execSync } from "child_process";
import path from "path";
import { timingSafeEqual } from "crypto";
import rateLimit from "express-rate-limit";

const router = Router();

const seedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many seed attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Constant-time string compare — avoids leaking token length/content via response timing. */
function safeTokenEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

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
  if (!token || !safeTokenEquals(token, expected)) {
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

router.get("/", seedLimiter, handleSeed);
router.post("/", seedLimiter, handleSeed);

export default router;
