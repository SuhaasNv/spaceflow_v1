import { Router, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth.js";

const router = Router();

// All routes require admin
router.use(authenticate, requireAdmin);

const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(Role),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().max(255).toLowerCase().trim().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/users
router.get("/users", async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users });
});

// GET /api/admin/users/:id
router.get("/users/:id", async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: String(req.params["id"]) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

// POST /api/admin/users
router.post("/users", async (req: AuthRequest, res: Response) => {
  const body = createUserSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  res.status(201).json({ user });
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params["id"]);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Prevent admin from deactivating themselves
  if (id === req.user!.userId && req.body.isActive === false) {
    res.status(400).json({ error: "Cannot deactivate your own account" });
    return;
  }

  const body = updateUserSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id },
    data: body,
    select: { id: true, name: true, email: true, role: true, isActive: true, updatedAt: true },
  });

  res.json({ user: updated });
});

// DELETE /api/admin/users/:id (hard delete with cascade)
router.delete("/users/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params["id"]);
  if (id === req.user!.userId) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Preserve audit logs but nullify the user link
    await tx.apiAuditLog.updateMany({ where: { userId: id }, data: { userId: null } });
    // Remove AI usage logs
    await tx.aiRecommendationLog.deleteMany({ where: { userId: id } });
    // Get user's booking IDs for cascade
    const bookingIds = (
      await tx.booking.findMany({ where: { userId: id }, select: { id: true } })
    ).map((b) => b.id);
    // Delete occupancy records tied to user or their bookings
    await tx.occupancyRecord.deleteMany({
      where: { OR: [{ userId: id }, { bookingId: { in: bookingIds } }] },
    });
    // Delete user's bookings
    await tx.booking.deleteMany({ where: { userId: id } });
    // Delete refresh tokens (already CASCADE but explicit is safer)
    await tx.refreshToken.deleteMany({ where: { userId: id } });
    // Finally delete the user
    await tx.user.delete({ where: { id } });
  });

  res.json({ ok: true });
});

// GET /api/admin/audit
router.get("/audit", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    userId: z.string().uuid().optional(),
    method: z.string().optional(),
    path: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  });

  const query = schema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  const [logs, total] = await Promise.all([
    prisma.apiAuditLog.findMany({
      where: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.method ? { method: query.method.toUpperCase() } : {}),
        ...(query.path ? { path: { contains: query.path } } : {}),
        ...(query.from || query.to
          ? {
              timestamp: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { timestamp: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.apiAuditLog.count({
      where: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.method ? { method: query.method.toUpperCase() } : {}),
      },
    }),
  ]);

  res.json({
    logs,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  });
});

// GET /api/admin/config
router.get("/config", async (_req: AuthRequest, res: Response) => {
  const configs = await prisma.platformConfig.findMany({
    orderBy: { key: "asc" },
  });
  const config = Object.fromEntries(configs.map((c) => [c.key, c.value]));
  res.json({ config });
});

// PATCH /api/admin/config
router.patch("/config", async (req: AuthRequest, res: Response) => {
  const body = z.record(z.unknown()).parse(req.body);

  for (const [key, value] of Object.entries(body)) {
    await prisma.platformConfig.upsert({
      where: { key },
      update: { value: value as Parameters<typeof prisma.platformConfig.upsert>[0]["update"]["value"], updatedBy: req.user!.userId },
      create: { key, value: value as Parameters<typeof prisma.platformConfig.create>[0]["data"]["value"], updatedBy: req.user!.userId },
    });
  }

  res.json({ ok: true });
});

// GET /api/admin/stats
router.get("/stats", async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const [
    totalUsers,
    activeUsers,
    totalBookingsThisWeek,
    totalSpaces,
    aiCallsThisWeek,
    newUsersThisMonth,
    adminCount,
    fmCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.booking.count({ where: { startTime: { gte: weekAgo } } }),
    prisma.space.count({ where: { isActive: true } }),
    prisma.aiRecommendationLog.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "FACILITIES_MANAGER" } }),
  ]);

  res.json({
    totalUsers,
    activeUsers,
    totalBookingsThisWeek,
    totalSpaces,
    aiCallsThisWeek,
    newUsersThisMonth,
    adminCount,
    fmCount,
    employeeCount: totalUsers - adminCount - fmCount,
  });
});

// GET /api/admin/ai-stats
router.get("/ai-stats", async (req: AuthRequest, res: Response) => {
  try {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  // Optional filter: ?provider=gemini|openai
  const providerFilter = req.query["provider"] === "gemini" || req.query["provider"] === "openai"
    ? (req.query["provider"] as "gemini" | "openai")
    : null;
  const baseWhere = providerFilter ? { provider: providerFilter } : {};

  const [
    totalCalls,
    callsThisWeek,
    callsThisMonth,
    successfulCalls,
    allTokenStats,
    weekTokenStats,
    latencyStats,
    recentCalls,
    callsByScope,
    geminiStats,
    openaiStats,
  ] = await Promise.all([
    prisma.aiRecommendationLog.count({ where: baseWhere }),
    prisma.aiRecommendationLog.count({ where: { ...baseWhere, createdAt: { gte: weekAgo } } }),
    prisma.aiRecommendationLog.count({ where: { ...baseWhere, createdAt: { gte: monthAgo } } }),
    prisma.aiRecommendationLog.count({ where: { ...baseWhere, success: true } }),
    prisma.aiRecommendationLog.aggregate({
      where: baseWhere,
      _sum: { promptTokens: true, responseTokens: true },
    }),
    prisma.aiRecommendationLog.aggregate({
      where: { ...baseWhere, createdAt: { gte: weekAgo } },
      _sum: { promptTokens: true, responseTokens: true },
    }),
    prisma.aiRecommendationLog.aggregate({
      where: { ...baseWhere, latencyMs: { not: null } },
      _avg: { latencyMs: true },
      _min: { latencyMs: true },
      _max: { latencyMs: true },
    }),
    prisma.aiRecommendationLog.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        scope: true,
        provider: true,
        promptTokens: true,
        responseTokens: true,
        latencyMs: true,
        success: true,
        errorMessage: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.aiRecommendationLog.groupBy({
      by: ["scope"],
      where: baseWhere,
      _count: { _all: true },
    }),
    // Per-provider stats: attribute legacy (provider=null or "") to whichever is primary
    prisma.aiRecommendationLog.aggregate({
      where: (() => {
        const hasGemini = !!process.env.GEMINI_API_KEY;
        const hasOpenai = !!process.env.OPENAI_API_KEY;
        if (hasGemini) return { OR: [{ provider: "gemini" }, { provider: null }, { provider: "" }] };
        if (hasOpenai) return { provider: "gemini" };
        return { OR: [{ provider: "gemini" }, { provider: null }, { provider: "" }] }; // neither set: legacy → Gemini
      })(),
      _count: { id: true },
      _sum: { promptTokens: true, responseTokens: true },
    }),
    prisma.aiRecommendationLog.aggregate({
      where: (() => {
        const hasGemini = !!process.env.GEMINI_API_KEY;
        const hasOpenai = !!process.env.OPENAI_API_KEY;
        if (hasOpenai && !hasGemini) return { OR: [{ provider: "openai" }, { provider: null }, { provider: "" }] };
        return { provider: "openai" };
      })(),
      _count: { id: true },
      _sum: { promptTokens: true, responseTokens: true },
    }),
  ]);

  const totalPromptTokens = allTokenStats._sum.promptTokens ?? 0;
  const totalResponseTokens = allTokenStats._sum.responseTokens ?? 0;

  // Ensure per-provider counts sum to total (orphan records → primary provider)
  const geminiCalls = geminiStats._count.id;
  const openaiCalls = openaiStats._count.id;
  const orphanCalls = Math.max(0, totalCalls - geminiCalls - openaiCalls);
  const primaryIsGemini = !!process.env.GEMINI_API_KEY || (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY);
  const finalGeminiCalls = geminiCalls + (orphanCalls > 0 && primaryIsGemini ? orphanCalls : 0);
  const finalOpenaiCalls = openaiCalls + (orphanCalls > 0 && !primaryIsGemini ? orphanCalls : 0);

  // Cost: Gemini 2.5 Flash $0.15/1M in, $0.60/1M out; GPT-4o $2.50/1M in, $10/1M out
  const geminiIn = (geminiStats._sum.promptTokens ?? 0) / 1_000_000 * 0.15;
  const geminiOut = (geminiStats._sum.responseTokens ?? 0) / 1_000_000 * 0.60;
  const openaiIn = (openaiStats._sum.promptTokens ?? 0) / 1_000_000 * 2.50;
  const openaiOut = (openaiStats._sum.responseTokens ?? 0) / 1_000_000 * 10.0;
  const estimatedCostUsd = geminiIn + geminiOut + openaiIn + openaiOut;

  res.json({
    totalCalls,
    callsThisWeek,
    callsThisMonth,
    successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 100,
    totalPromptTokens,
    totalResponseTokens,
    totalTokens: totalPromptTokens + totalResponseTokens,
    weekPromptTokens: weekTokenStats._sum.promptTokens ?? 0,
    weekResponseTokens: weekTokenStats._sum.responseTokens ?? 0,
    weekTotalTokens:
      (weekTokenStats._sum.promptTokens ?? 0) + (weekTokenStats._sum.responseTokens ?? 0),
    avgLatencyMs: Math.round(latencyStats._avg.latencyMs ?? 0),
    minLatencyMs: latencyStats._min.latencyMs ?? 0,
    maxLatencyMs: latencyStats._max.latencyMs ?? 0,
    estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
    configuredProvider: process.env.GEMINI_API_KEY
      ? "gemini"
      : process.env.OPENAI_API_KEY
      ? "openai"
      : "none",
    model: process.env.GEMINI_API_KEY
      ? (process.env.GEMINI_MODEL ?? "gemini-2.5-flash")
      : process.env.OPENAI_API_KEY
      ? (process.env.OPENAI_MODEL ?? "gpt-4o")
      : "none",
    recentCalls,
    callsByScope,
    byProvider: {
      gemini: {
        calls: finalGeminiCalls,
        promptTokens: geminiStats._sum.promptTokens ?? 0,
        responseTokens: geminiStats._sum.responseTokens ?? 0,
        totalTokens: (geminiStats._sum.promptTokens ?? 0) + (geminiStats._sum.responseTokens ?? 0),
        estimatedCostUsd: Math.round((geminiIn + geminiOut) * 100) / 100,
        model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      },
      openai: {
        calls: finalOpenaiCalls,
        promptTokens: openaiStats._sum.promptTokens ?? 0,
        responseTokens: openaiStats._sum.responseTokens ?? 0,
        totalTokens: (openaiStats._sum.promptTokens ?? 0) + (openaiStats._sum.responseTokens ?? 0),
        estimatedCostUsd: Math.round((openaiIn + openaiOut) * 100) / 100,
        model: process.env.OPENAI_MODEL ?? "gpt-4o",
      },
    },
  });
  } catch (err) {
    console.error("[admin/ai-stats] Error:", err);
    res.status(500).json({ error: "Failed to fetch AI stats", details: (err as Error).message });
  }
});

export default router;
