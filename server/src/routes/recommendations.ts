import { Router, Response } from "express";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdminOrFM, AuthRequest } from "../middleware/auth.js";
import { callAI, stripJsonFences } from "../lib/aiClient.js";

const router = Router();

const querySchema = z.object({
  scope: z.enum(["all", "building", "floor"]).default("all"),
  building: z.string().optional(),
  floor: z.string().optional(),
  timeRange: z.enum(["7d", "14d", "30d", "90d"]).default("30d"),
  focus: z.enum(["utilization", "comfort", "cost", "sustainability"]).default("utilization"),
});

interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  confidenceLabel: "High" | "Medium" | "Low";
  category: string;
  dataSources: string[];
  explanation: string;
  impact: string;
  action: string;
}

async function generateRecommendations(
  params: z.infer<typeof querySchema>,
  userId: string
): Promise<Recommendation[]> {
  const now = new Date();
  const days = parseInt(params.timeRange);
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [spaces, bookings, occupancy] = await Promise.all([
    prisma.space.findMany({
      where: {
        isActive: true,
        ...(params.building ? { building: params.building } : {}),
        ...(params.floor ? { floor: params.floor } : {}),
      },
    }),
    prisma.booking.findMany({
      where: {
        startTime: { gte: from, lte: now },
        status: { not: BookingStatus.CANCELLED },
        ...(params.building ? { space: { building: params.building } } : {}),
      },
      include: { space: { select: { type: true, floor: true, building: true } } },
    }),
    prisma.occupancyRecord.findMany({
      where: {
        checkIn: { gte: from, lte: now },
        checkOut: { not: null },
      },
      select: { spaceId: true, checkIn: true, checkOut: true, bookingId: true },
    }),
  ]);

  const occupiedBookingIds = new Set(
    occupancy.filter((o: { bookingId: string | null }) => o.bookingId).map((o: { bookingId: string | null }) => o.bookingId!)
  );
  const noShows = bookings.filter(
    (b: { id: string; endTime: Date }) => !occupiedBookingIds.has(b.id) && new Date(b.endTime) < now
  );
  const noShowRate = bookings.length > 0 ? noShows.length / bookings.length : 0;

  const bookingsBySpace = new Map<string, number>();
  for (const b of bookings as Array<{ spaceId: string }>) {
    bookingsBySpace.set(b.spaceId, (bookingsBySpace.get(b.spaceId) ?? 0) + 1);
  }
  const underutilizedSpaces = spaces.filter((s) => (bookingsBySpace.get(s.id) ?? 0) < 2);
  const totalAvailableMinutes = days * 9 * 60;
  const avgOccupancyMinutes =
    occupancy.reduce((sum: number, o: { checkOut: Date | null; checkIn: Date }) => {
      if (!o.checkOut) return sum;
      return sum + (o.checkOut.getTime() - o.checkIn.getTime()) / 60000;
    }, 0) / Math.max(1, spaces.length);
  const avgUtilization = Math.min(100, (avgOccupancyMinutes / totalAvailableMinutes) * 100);

  const recommendations: Recommendation[] = [];

  if (noShowRate > 0.15) {
    recommendations.push({
      id: "rec-no-show",
      title: "Reduce Ghost Bookings",
      description: `${Math.round(noShowRate * 100)}% of bookings in the last ${days} days had no check-in. Consider implementing automatic release for unchecked bookings after 15 minutes.`,
      confidence: noShowRate > 0.3 ? 88 : 72,
      confidenceLabel: noShowRate > 0.3 ? "High" : "Medium",
      category: "Utilization",
      dataSources: [`${bookings.length} bookings`, `${noShows.length} no-shows`, `${days}-day window`],
      explanation: `We detected ${noShows.length} bookings with no check-in recorded out of ${bookings.length} total. This ${Math.round(noShowRate * 100)}% no-show rate suggests spaces are being blocked unnecessarily, preventing others from using them.`,
      impact: `Freeing ghost bookings could recover up to ${Math.round(noShowRate * bookings.length)} booking slots per month for actual use.`,
      action: "Enable auto-release: automatically cancel bookings 15 minutes after start time if no check-in is recorded.",
    });
  }

  if (underutilizedSpaces.length > 0 && params.focus === "utilization") {
    const names = underutilizedSpaces.slice(0, 3).map((s) => s.name).join(", ");
    recommendations.push({
      id: "rec-underutilized",
      title: "Consolidate Underutilized Spaces",
      description: `${underutilizedSpaces.length} space(s) have fewer than 2 bookings in ${days} days. Consider repurposing or temporarily closing: ${names}${underutilizedSpaces.length > 3 ? "..." : ""}.`,
      confidence: underutilizedSpaces.length > 3 ? 81 : 65,
      confidenceLabel: underutilizedSpaces.length > 3 ? "High" : "Medium",
      category: "Space Optimization",
      dataSources: [`${spaces.length} active spaces`, `${bookings.length} bookings`, `${days}-day window`],
      explanation: `${underutilizedSpaces.length} spaces had fewer than 2 bookings over the past ${days} days while other spaces may be at capacity. This indicates imbalanced space utilization.`,
      impact: "Consolidating low-demand spaces reduces maintenance costs and can redirect resources to higher-demand areas.",
      action: "Review listed spaces for potential repurposing as storage, quiet zones, or flexible areas.",
    });
  }

  if (avgUtilization < 40 && spaces.length > 0) {
    recommendations.push({
      id: "rec-low-overall",
      title: "Space Utilization Below Optimal",
      description: `Overall space utilization is ${Math.round(avgUtilization)}% — below the recommended 60-80% range. Consider space marketing or flexible access policies.`,
      confidence: 75,
      confidenceLabel: "Medium",
      category: "Utilization",
      dataSources: [`${spaces.length} spaces`, `${Math.round(avgOccupancyMinutes)} avg occupancy minutes`, `${days}-day window`],
      explanation: `Average utilization across all spaces is ${Math.round(avgUtilization)}%, meaning spaces are idle for most of the working day. Optimal utilization is 60-80% to balance availability and efficiency.`,
      impact: "Increasing utilization by 20% could justify current space costs and delay expansion needs.",
      action: "Consider marketing available spaces to employees, offering flexible booking policies, or hosting team events in underused areas.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "rec-good-shape",
      title: "Spaces Are Well Utilized",
      description: `Your workspace utilization looks healthy for the past ${days} days. Continue monitoring for emerging patterns.`,
      confidence: 70,
      confidenceLabel: "Medium",
      category: "General",
      dataSources: [`${spaces.length} spaces`, `${bookings.length} bookings`, `${days}-day window`],
      explanation: "Based on booking patterns, no-show rates, and occupancy data, your spaces appear to be operating within normal parameters.",
      impact: "Maintaining current patterns will keep operational costs optimized.",
      action: "Continue regular monitoring. Review after next 30-day period for any emerging trends.",
    });
  }

  // Log to DB
  await prisma.aiRecommendationLog.create({
    data: {
      userId,
      scope: params.scope,
      timeRange: params.timeRange,
      focus: params.focus,
      success: true,
    },
  }).catch(() => {});

  return recommendations;
}

// GET /api/recommendations
router.get("/", authenticate, requireAdminOrFM, async (req: AuthRequest, res: Response) => {
  try {
    const params = querySchema.parse({
      scope: req.query["scope"],
      building: req.query["building"],
      floor: req.query["floor"],
      timeRange: req.query["timeRange"],
      focus: req.query["focus"],
    });
    const start = Date.now();

    let recommendations: Recommendation[];
    let source: "ai" | "rule-based" = "rule-based";

    const now2 = new Date();
    const days2 = parseInt(params.timeRange);
    const from2 = new Date(now2.getTime() - days2 * 24 * 60 * 60 * 1000);

    const [spaces2, bookings2, occupancy2] = await Promise.all([
      prisma.space.findMany({ where: { isActive: true } }),
      prisma.booking.findMany({
        where: { startTime: { gte: from2, lte: now2 }, status: { not: BookingStatus.CANCELLED } },
        include: { space: { select: { type: true } } },
      }),
      prisma.occupancyRecord.findMany({
        where: { checkIn: { gte: from2, lte: now2 }, checkOut: { not: null } },
      }),
    ]);

    const occupiedIds2 = new Set(
      occupancy2
        .filter((o: { bookingId: string | null }) => o.bookingId)
        .map((o: { bookingId: string | null }) => o.bookingId!)
    );
    const noShowCount2 = bookings2.filter(
      (b: { id: string; endTime: Date }) => !occupiedIds2.has(b.id) && new Date(b.endTime) < now2
    ).length;

    const aiPrompt = `You are SpaceFlow's AI advisor for a smart workplace platform. Analyze the following workspace data and provide actionable recommendations.

DATA SUMMARY:
- Analysis period: Last ${days2} days
- Scope: ${params.scope}${params.building ? ` (building: ${params.building})` : ""}
- Focus: ${params.focus}
- Total active spaces: ${spaces2.length}
- Total bookings: ${bookings2.length}
- Occupancy records: ${occupancy2.length}
- No-shows (booked but not checked-in): ${noShowCount2}
- No-show rate: ${bookings2.length > 0 ? Math.round((noShowCount2 / bookings2.length) * 100) : 0}%

RESPONSIBLE AI CONSTRAINTS:
1. Provide ADVISORY recommendations only. Never suggest automatic changes to bookings.
2. Be transparent about data sources and confidence levels.
3. Acknowledge data limitations (e.g., manual check-in may undercount actual occupancy).
4. Focus on patterns, not individual user behavior.

OUTPUT FORMAT (JSON array, max 4 recommendations):
[
  {
    "title": "Short actionable title",
    "description": "1-2 sentence summary with specific numbers",
    "confidence": 75,
    "confidenceLabel": "Medium",
    "category": "Utilization|Space Optimization|Cost|Comfort",
    "explanation": "Detailed explanation of why this recommendation was made, citing the specific data points",
    "dataSources": ["list of data points used"],
    "impact": "Expected business impact if recommendation is followed",
    "action": "Specific, human-approved action to take"
  }
]

Return ONLY valid JSON array. No markdown, no extra text.`;

    const aiResult = await callAI(aiPrompt);
    if (aiResult) {
      try {
        const aiRecs = JSON.parse(stripJsonFences(aiResult.text)) as Omit<Recommendation, "id">[];
        recommendations = aiRecs.map((r, i) => ({ ...r, id: `ai-rec-${i}` }));
        source = "ai";
        // Log AI recommendation call
        await prisma.aiRecommendationLog.create({
          data: {
            userId: req.user!.userId,
            scope: "recommendation",
            provider: aiResult.provider,
            promptTokens: aiResult.promptTokens ?? null,
            responseTokens: aiResult.responseTokens ?? null,
            latencyMs: Date.now() - start,
            success: true,
          },
        }).catch(() => {});
      } catch {
        console.warn(`[AI] ${aiResult.provider} returned unparseable JSON, falling back to rule-based`);
        recommendations = await generateRecommendations(params, req.user!.userId);
      }
    } else {
      recommendations = await generateRecommendations(params, req.user!.userId);
    }

    const latencyMs = Date.now() - start;

    res.json({
      recommendations,
      metadata: {
        source,
        generatedAt: new Date().toISOString(),
        latencyMs,
        params,
        disclaimer:
          "These are advisory recommendations only. All actions require human review and approval. No automatic changes have been made.",
        responsibleAI: {
          humanInLoop: true,
          noAutoWrites: true,
          dataPrivacy: "Recommendations use aggregate data only. No individual user data is included.",
          transparency: "All data sources are listed with each recommendation.",
        },
      },
    });
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

export default router;
