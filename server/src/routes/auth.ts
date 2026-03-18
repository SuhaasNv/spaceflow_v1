import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_EXPIRY_DATE,
} from "../lib/jwt.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();
const IS_PROD = process.env.NODE_ENV === "production";
const BCRYPT_ROUNDS = 12;

const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "qwerty123",
  "abc12345",
  "letmein1",
  "welcome1",
  "monkey123",
]);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many signup attempts. Try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(1).max(128),
});

function setCookies(res: Response, accessToken: string, refreshToken: string) {
  // Cross-origin (e.g. Vercel frontend + Railway backend) requires sameSite: "none"
  const sameSite = IS_PROD ? ("none" as const) : ("lax" as const);
  const cookieOpts = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite,
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOpts,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOpts,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function clearCookies(res: Response) {
  const clearOpts = IS_PROD ? { secure: true, sameSite: "none" as const } : {};
  res.clearCookie("accessToken", clearOpts);
  res.clearCookie("refreshToken", { path: "/api/auth", ...clearOpts });
}

// POST /api/auth/signup
router.post("/signup", signupLimiter, async (req: Request, res: Response) => {
  try {
    const body = signupSchema.parse(req.body);

    if (COMMON_PASSWORDS.has(body.password.toLowerCase())) {
      res.status(400).json({ error: "Password is too common. Choose a stronger password." });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: "EMPLOYEE",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: REFRESH_EXPIRY_DATE(),
      },
    });

    setCookies(res, accessToken, refreshToken);
    res.status(201).json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
      });
      return;
    }
    throw err;
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    const genericError = { error: "Invalid email or password." };

    if (!user || !user.isActive) {
      // constant-time comparison to prevent timing attacks
      await bcrypt.compare(body.password, "$2b$12$invalidhashinvalidhashinvalidha");
      res.status(401).json(genericError);
      return;
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json(genericError);
      return;
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: REFRESH_EXPIRY_DATE(),
      },
    });

    setCookies(res, accessToken, refreshToken);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
      });
      return;
    }
    throw err;
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user || !user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    const storedToken = await prisma.refreshToken.findFirst({
      where: { token, userId: payload.userId, revokedAt: null },
      include: { user: { select: { id: true, role: true, isActive: true } } },
    });

    if (!storedToken || storedToken.expiresAt < new Date() || !storedToken.user.isActive) {
      clearCookies(res);
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newAccessToken = signAccessToken({
      userId: storedToken.user.id,
      role: storedToken.user.role,
    });
    const newRefreshToken = signRefreshToken(storedToken.user.id);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: REFRESH_EXPIRY_DATE(),
      },
    });

    setCookies(res, newAccessToken, newRefreshToken);
    res.json({ ok: true });
  } catch {
    clearCookies(res);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// POST /api/auth/logout
router.post("/logout", authenticate, async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await prisma.refreshToken
      .updateMany({
        where: { token, userId: req.user!.userId },
        data: { revokedAt: new Date() },
      })
      .catch(() => {});
  }
  clearCookies(res);
  res.json({ ok: true });
});

export default router;
