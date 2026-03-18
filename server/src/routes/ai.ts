import { Router, Response } from "express";
import { z } from "zod";
import { BookingStatus, Role, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdminOrFM, AuthRequest } from "../middleware/auth.js";
import { callAI, stripJsonFences } from "../lib/aiClient.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/smart-booking
// Natural language → structured booking intent
// Accessible to all authenticated users (employees can use it)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/smart-booking", authenticate, async (req: AuthRequest, res: Response) => {
  const bodySchema = z.object({ query: z.string().min(3).max(500) });
  const parse = bodySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "query is required (3-500 chars)" });
    return;
  }

  const { query } = parse.data;
  const now = new Date();

  // Fetch available spaces to help the AI suggest the best match
  const spaces = await prisma.space.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true, floor: true, building: true, capacity: true },
  });

  const spaceList = spaces
    .map(
      (s) =>
        `- id:${s.id} | ${s.name} | type:${s.type} | floor:${s.floor ?? "?"} | building:${s.building ?? "?"} | capacity:${s.capacity}`
    )
    .join("\n");

  const prompt = `You are SpaceFlow's smart booking assistant. Parse the user's natural language booking request and return a structured JSON response.

TODAY: ${now.toISOString()} (${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })})
DAY_OF_WEEK: ${now.toLocaleDateString("en-US", { weekday: "long" })}

USER REQUEST: "${query}"

AVAILABLE SPACES:
${spaceList}

INSTRUCTIONS:
1. Parse the date/time from the user's request relative to TODAY.
2. If the user says "tomorrow", calculate the actual date.
3. If the user says "morning" use 09:00, "afternoon" use 14:00, "evening" use 17:00 as defaults.
4. Match the space type from the request (e.g. "quiet room" → OFFICE or PHONE_BOOTH, "meeting room" → MEETING_ROOM, "desk" → DESK).
5. Match capacity requirement if mentioned.
6. Return up to 3 best matching space IDs from the list above.
7. If date/time is ambiguous, make a reasonable assumption and note it in explanation.

OUTPUT (JSON only, no markdown):
{
  "date": "YYYY-MM-DD",
  "startSlot": "HH:MM",
  "endSlot": "HH:MM",
  "spaceType": "MEETING_ROOM|DESK|PHONE_BOOTH|COLLABORATION_AREA|OFFICE|null",
  "minCapacity": 1,
  "suggestedSpaceIds": ["id1", "id2"],
  "explanation": "I understood you want... on [date] from [start] to [end].",
  "confidence": 85
}`;

  const aiResult = await callAI(prompt);

  if (!aiResult) {
    res.status(503).json({
      error: "AI service unavailable. Please select date and time manually.",
      fallback: true,
    });
    return;
  }

  try {
    const parsed = JSON.parse(stripJsonFences(aiResult.text));

    // Validate suggestedSpaceIds are real space IDs
    const validIds = new Set(spaces.map((s) => s.id));
    const suggestedSpaceIds = (parsed.suggestedSpaceIds as string[]).filter((id) => validIds.has(id));

    res.json({
      ...parsed,
      suggestedSpaceIds,
      provider: aiResult.provider,
      disclaimer: "AI-suggested times require your confirmation before booking.",
    });
  } catch {
    res.status(500).json({
      error: "AI returned unexpected format. Please select date and time manually.",
      fallback: true,
      rawResponse: aiResult.text.slice(0, 200),
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/cancellation-insights
// Analyzes cancellation reasons to surface patterns for FM/Admin
// ─────────────────────────────────────────────────────────────────────────────
router.get("/cancellation-insights", authenticate, requireAdminOrFM, async (req: AuthRequest, res: Response) => {
  const daysBack = Math.min(90, parseInt(String(req.query["days"] ?? "30")));
  const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const cancelled = await prisma.booking.findMany({
    where: {
      status: BookingStatus.CANCELLED,
      updatedAt: { gte: from },
    },
    select: {
      id: true,
      cancellationReason: true,
      startTime: true,
      space: { select: { name: true, type: true, floor: true, building: true } },
      user: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const withReasons = cancelled.filter((c) => c.cancellationReason);
  const total = cancelled.length;
  const withReasonsCount = withReasons.length;

  // Return basic stats even if AI is unavailable
  const basicStats = {
    totalCancellations: total,
    withReasonsCount,
    reasonCoveragePercent: total > 0 ? Math.round((withReasonsCount / total) * 100) : 0,
    period: `${daysBack}d`,
    generatedAt: new Date().toISOString(),
  };

  if (withReasons.length === 0) {
    res.json({
      ...basicStats,
      insights: [],
      themes: [],
      provider: "none",
      disclaimer: "No cancellation reasons recorded yet. As employees submit reasons, AI will surface patterns here.",
    });
    return;
  }

  const reasonsList = withReasons
    .slice(0, 80) // cap to avoid token limits
    .map((c) => `- "${c.cancellationReason}" (space: ${c.space.name}, type: ${c.space.type})`)
    .join("\n");

  const prompt = `You are an analyst for SpaceFlow, a smart workplace platform. Analyze these booking cancellation reasons and identify patterns.

CANCELLATION REASONS (last ${daysBack} days, ${withReasons.length} with reasons out of ${total} total):
${reasonsList}

TASK:
1. Identify 2-4 recurring themes or root causes.
2. For each theme, estimate what percentage of reasons fall into it.
3. Suggest one actionable step to reduce that category of cancellations.
4. Flag any concerning patterns (e.g., "rooms too far", "overbooking", "technical issues").

OUTPUT (JSON only, no markdown):
{
  "summary": "One paragraph summarising the key finding.",
  "themes": [
    {
      "label": "Theme name",
      "percent": 35,
      "description": "What these cancellations have in common",
      "action": "Suggested fix for facilities manager"
    }
  ],
  "topConcern": "The single most urgent finding",
  "confidence": 80
}`;

  const aiResult = await callAI(prompt);

  if (!aiResult) {
    res.json({
      ...basicStats,
      insights: withReasons.slice(0, 20).map((c) => ({
        reason: c.cancellationReason,
        space: c.space.name,
        type: c.space.type,
      })),
      themes: [],
      provider: "none",
      disclaimer: "AI unavailable. Raw reasons shown. Add GEMINI_API_KEY or OPENAI_API_KEY to enable analysis.",
    });
    return;
  }

  try {
    const parsed = JSON.parse(stripJsonFences(aiResult.text));
    res.json({
      ...basicStats,
      ...parsed,
      provider: aiResult.provider,
      disclaimer: "AI analysis is advisory only. Patterns are based on employee-submitted reasons.",
      responsibleAI: {
        dataUsed: "Aggregate cancellation reasons only. No individual user is identified in the analysis.",
        humanInLoop: true,
      },
    });
  } catch {
    res.json({
      ...basicStats,
      themes: [],
      provider: aiResult.provider,
      rawSummary: aiResult.text.slice(0, 500),
      error: "AI returned unexpected format.",
    });
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

/** Detect booking intent purely from keywords (fallback when AI unavailable) */
function detectBookingKeywords(msg: string): boolean {
  const lower = msg.toLowerCase();
  const bookWords = ["book", "reserve", "schedule", "need a room", "find me a", "get me a", "grab a", "want a"];
  const hasBook = bookWords.some((w) => lower.includes(w));
  const hasSpace = ["room", "desk", "space", "office", "booth", "area"].some((w) => lower.includes(w));
  return hasBook && hasSpace;
}

/** Parse time string like "2pm", "14:00", "2:30pm" → "14:30" */
function parseTimeStr(raw: string): string | null {
  const m = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = m[2] ? parseInt(m[2]) : 0;
  const meridiem = (m[3] || "").toLowerCase();
  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Parse "today", "tomorrow", "monday" etc → YYYY-MM-DD */
function parseDateStr(msg: string, now: Date): string | null {
  const lower = msg.toLowerCase();
  const d = new Date(now);
  if (lower.includes("today")) {
    return d.toISOString().slice(0, 10);
  }
  if (lower.includes("tomorrow")) {
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const diff = (i - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

/** Map keywords to SpaceType */
function inferSpaceType(msg: string): string | null {
  const lower = msg.toLowerCase();
  if (lower.includes("meeting room") || lower.includes("conference")) return "MEETING_ROOM";
  if (lower.includes("hot desk") || lower.includes("desk")) return "DESK";
  if (lower.includes("phone booth") || lower.includes("booth")) return "PHONE_BOOTH";
  if (lower.includes("collaboration") || lower.includes("collab") || lower.includes("lounge")) return "COLLABORATION_AREA";
  if (lower.includes("quiet") || lower.includes("office") || lower.includes("private")) return "OFFICE";
  return null;
}

interface ParsedBooking {
  date: string;
  startTime: string;
  endTime: string;
  spaceType: string | null;
  minCapacity: number;
  purpose: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/chat
// Conversational AI — detects booking intent, executes bookings, returns confirmation
// ─────────────────────────────────────────────────────────────────────────────
router.post("/chat", authenticate, async (req: AuthRequest, res: Response) => {
  const bodySchema = z.object({
    message: z.string().min(1).max(2000),
    history: z
      .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
      .max(20)
      .default([]),
  });

  const parse = bodySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { message, history } = parse.data;
  const userRole = req.user!.role;
  const userId = req.user!.userId;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── Fetch live context ─────────────────────────────────────────────────
  let contextSnippet = "";
  const spaces = await prisma.space.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true, floor: true, building: true, capacity: true },
  });

  try {
    if (userRole === Role.ADMIN) {
      const [userCount, bookingCount, recentAudit] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.booking.count({ where: { status: BookingStatus.ACTIVE } }),
        prisma.apiAuditLog.count({ where: { timestamp: { gte: weekAgo } } }),
      ]);
      contextSnippet = `LIVE PLATFORM DATA: active users: ${userCount}, active bookings: ${bookingCount}, active spaces: ${spaces.length}, API calls this week: ${recentAudit}.`;
    } else if (userRole === Role.FACILITIES_MANAGER) {
      const [bookingCount, cancelCount, noShowCount, topSpaceRaw] = await Promise.all([
        prisma.booking.count({ where: { startTime: { gte: weekAgo }, status: BookingStatus.ACTIVE } }),
        prisma.booking.count({ where: { status: BookingStatus.CANCELLED, updatedAt: { gte: weekAgo } } }),
        prisma.booking.count({
          where: {
            status: BookingStatus.ACTIVE,
            endTime: { lt: now },
            occupancyRecords: { none: {} },
          },
        }),
        prisma.booking.groupBy({
          by: ["spaceId"],
          where: { startTime: { gte: weekAgo } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 1,
        }),
      ]);
      let topSpaceName = "N/A";
      if (topSpaceRaw.length > 0) {
        const sp = await prisma.space.findUnique({ where: { id: topSpaceRaw[0].spaceId }, select: { name: true } });
        topSpaceName = sp?.name ?? "N/A";
      }
      contextSnippet = `LIVE FACILITIES DATA: bookings this week: ${bookingCount}, cancellations this week: ${cancelCount}, no-shows (past bookings without check-in): ${noShowCount}, most-booked space this week: ${topSpaceName}, active spaces: ${spaces.length}. You have access to utilization analytics, booking patterns, space segments, and AI recommendations pages.`;
    } else {
      const upcoming = await prisma.booking.count({
        where: { userId, status: BookingStatus.ACTIVE, startTime: { gte: now } },
      });
      contextSnippet = `USER DATA: your upcoming bookings: ${upcoming}, available spaces: ${spaces.length}.`;
    }
  } catch { /* continue without context */ }

  // ── Build AI prompt — asks for structured JSON ─────────────────────────
  const spaceList = spaces
    .map((s) => `id:${s.id}|${s.name}|${s.type}|floor:${s.floor ?? "?"}|cap:${s.capacity}`)
    .join("\n");

  const historyText = history
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n");

  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const fmSystemNote = userRole === Role.FACILITIES_MANAGER
    ? `\nYou are acting as a FACILITIES MANAGER assistant. Your primary role is to help with:
- Space utilization analysis and reporting
- Identifying no-show and cancellation patterns
- Managing and adding new facilities/spaces
- Reviewing booking usage across all spaces and users
- Providing actionable recommendations for space optimisation
When the FM asks about analytics, utilization, patterns or space performance, give a detailed answer using the live data provided. Only handle booking creation if explicitly requested.`
    : userRole === Role.ADMIN
    ? `\nYou are acting as an ADMIN assistant with full platform visibility.`
    : "";

  const fullPrompt = `You are SpaceFlow's AI assistant. TODAY is ${todayStr} (ISO: ${now.toISOString()}).
Role of current user: ${userRole}. ${contextSnippet}${fmSystemNote}

AVAILABLE SPACES:
${spaceList}

${historyText ? `CONVERSATION SO FAR:\n${historyText}\n` : ""}
User: ${message}

Analyze the user's message. If it is a request to BOOK a space, extract the booking details.
A booking request uses words like: book, reserve, schedule, find me a room, I need a desk, grab a space, etc.

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "intent": "BOOK" or "QUERY",
  "response": "Your friendly natural-language reply to the user",
  "followUps": ["short follow-up 1", "short follow-up 2", "short follow-up 3"],
  "bookingParams": {
    "date": "YYYY-MM-DD (calculated from today)",
    "startTime": "HH:MM (24h format)",
    "endTime": "HH:MM (24h format, at least 30 min after startTime)",
    "spaceType": "MEETING_ROOM|DESK|PHONE_BOOTH|COLLABORATION_AREA|OFFICE or null",
    "minCapacity": 1,
    "purpose": "purpose if mentioned or null",
    "preferredSpaceId": "best matching space id from the list above or null"
  }
}

If intent is QUERY (not a booking request), set bookingParams to null.
For BOOK intent: calculate the exact date relative to TODAY. If user says "tomorrow" add 1 day. Weekday names refer to the next occurrence.
Default duration is 1 hour if not specified. Morning = 09:00, afternoon = 14:00, evening = 17:00.`;

  // ── Call AI ────────────────────────────────────────────────────────────
  const callStart = Date.now();
  const aiResult = await callAI(fullPrompt);
  const callLatencyMs = Date.now() - callStart;

  let intent: "BOOK" | "QUERY" = "QUERY";
  let responseText = "";
  let followUpPrompts: string[] = [];
  let bookingParams: ParsedBooking | null = null;
  let provider: string | undefined;
  let tokenUsage: { promptTokens?: number; responseTokens?: number; totalTokens?: number; model?: string } = {};

  if (aiResult) {
    provider = aiResult.provider;
    tokenUsage = {
      promptTokens: aiResult.promptTokens,
      responseTokens: aiResult.responseTokens,
      totalTokens: aiResult.totalTokens,
      model: aiResult.model,
    };
    try {
      const parsed = JSON.parse(stripJsonFences(aiResult.text));
      intent = parsed.intent === "BOOK" ? "BOOK" : "QUERY";
      responseText = parsed.response ?? "";
      followUpPrompts = Array.isArray(parsed.followUps) ? parsed.followUps.slice(0, 3) : [];
      if (intent === "BOOK" && parsed.bookingParams) {
        bookingParams = parsed.bookingParams as ParsedBooking;
      }
    } catch {
      // AI returned non-JSON — treat as plain text query response
      const followUpMatch = aiResult.text.match(/FOLLOW_UPS:\s*(.+)$/m);
      responseText = aiResult.text.replace(/\nFOLLOW_UPS:.+$/m, "").trim();
      followUpPrompts = followUpMatch
        ? followUpMatch[1].split("|").map((s) => s.trim()).filter(Boolean).slice(0, 3)
        : [];
    }
  } else {
    // No AI — keyword fallback
    if (detectBookingKeywords(message)) {
      intent = "BOOK";
      const date = parseDateStr(message, now) ?? now.toISOString().slice(0, 10);
      const timeMatches = message.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi) ?? [];
      const startTime = timeMatches[0] ? (parseTimeStr(timeMatches[0]) ?? "09:00") : "09:00";
      const endHour = parseInt(startTime.split(":")[0]) + 1;
      const endTime = `${String(endHour).padStart(2, "0")}:${startTime.split(":")[1]}`;
      const spaceType = inferSpaceType(message);
      bookingParams = { date, startTime, endTime, spaceType, minCapacity: 1, purpose: null };
      responseText = "I'll try to book that for you right away!";
      followUpPrompts = ["Show my upcoming bookings", "Can I change the time?", "What other spaces are available?"];
    } else if (userRole === Role.FACILITIES_MANAGER) {
      responseText = "I'm your Facilities Manager assistant. I can help you analyse space utilization, identify no-show patterns, review cancellation trends, and manage spaces. What would you like to know?";
      followUpPrompts = ["What is our utilization this week?", "Which spaces have the most no-shows?", "Summarise recent cancellation patterns"];
    } else if (userRole === Role.ADMIN) {
      responseText = "I'm here to help with platform oversight. I can summarise platform health, user activity, space performance, and API usage. What do you need?";
      followUpPrompts = ["Give me a platform health overview", "Which spaces are performing worst?", "Any unusual activity this week?"];
    } else {
      responseText = "I'm here to help! I can book spaces for you, answer questions about availability, or help you navigate SpaceFlow. What do you need?";
      followUpPrompts = ["Book me a meeting room for today", "What spaces are available?", "How do I check in?"];
    }
  }

  // ── Execute booking if intent is BOOK ──────────────────────────────────
  if (intent === "BOOK" && bookingParams) {
    try {
      const { date, startTime, endTime, spaceType, minCapacity, purpose, preferredSpaceId } = bookingParams as ParsedBooking & { preferredSpaceId?: string };

      // Validate and build date objects
      const startISO = `${date}T${startTime}:00`;
      const endISO = `${date}T${endTime}:00`;
      const start = new Date(startISO);
      const end = new Date(endISO);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        res.json({
          response: responseText + "\n\nI had trouble parsing the time details. Could you clarify the date and time?",
          followUpPrompts: ["Book meeting room today at 2pm", "Book a desk for tomorrow morning"],
          provider,
        });
        return;
      }

      if (start < now) {
        res.json({
          response: "That time has already passed! Please choose a future date and time.",
          followUpPrompts: ["Book something for tomorrow", "Book a room for this afternoon"],
          provider,
        });
        return;
      }

      // Find an available space
      const bookedSpaceIds = (
        await prisma.booking.findMany({
          where: {
            status: BookingStatus.ACTIVE,
            AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
          },
          select: { spaceId: true },
        })
      ).map((b) => b.spaceId);

      let candidateSpaces = spaces.filter((s) => !bookedSpaceIds.includes(s.id));
      if (spaceType) candidateSpaces = candidateSpaces.filter((s) => s.type === spaceType);
      if (minCapacity && minCapacity > 1) candidateSpaces = candidateSpaces.filter((s) => s.capacity >= minCapacity);

      // Prefer the AI-suggested space if it's free
      let chosenSpace = preferredSpaceId
        ? candidateSpaces.find((s) => s.id === preferredSpaceId) ?? candidateSpaces[0]
        : candidateSpaces[0];

      if (!chosenSpace) {
        // No matching space — suggest alternatives
        const anyFree = spaces.filter((s) => !bookedSpaceIds.includes(s.id));
        const altNames = anyFree.slice(0, 3).map((s) => s.name).join(", ");
        res.json({
          response: `Sorry, no ${spaceType ? spaceType.replace(/_/g, " ").toLowerCase() : "matching"} space is available at that time. ${anyFree.length > 0 ? `Available alternatives: ${altNames}.` : "All spaces are booked for that slot."}`,
          followUpPrompts: ["Try a different time", "Show available spaces", "Book any available space"],
          provider,
        });
        return;
      }

      // ── Atomic conflict-check + insert ─────────────────────────────
      // Serializable isolation prevents two simultaneous AI requests
      // from double-booking the same space.
      let booking: Awaited<ReturnType<typeof prisma.booking.create>>;
      try {
        booking = await prisma.$transaction(
          async (tx) => {
            const conflict = await tx.booking.findFirst({
              where: {
                spaceId: chosenSpace.id,
                status: BookingStatus.ACTIVE,
                AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
              },
              select: { id: true },
            });
            if (conflict) throw new Error("BOOKING_CONFLICT");

            return tx.booking.create({
              data: {
                spaceId: chosenSpace.id,
                userId,
                startTime: start,
                endTime: end,
                purpose: purpose ?? undefined,
                status: BookingStatus.ACTIVE,
              },
              include: {
                space: { select: { id: true, name: true, type: true, floor: true, building: true } },
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (txErr: unknown) {
        // Our own conflict check, or PostgreSQL serialization failure (P2034)
        const isConflict =
          (txErr instanceof Error && txErr.message === "BOOKING_CONFLICT") ||
          (txErr instanceof Prisma.PrismaClientKnownRequestError && txErr.code === "P2034");

        if (isConflict) {
          res.json({
            response: `Sorry, **${chosenSpace.name}** was just taken by someone else! Try asking for a different space or time.`,
            followUpPrompts: ["Book any available meeting room", "Try a different time slot", "Show available spaces"],
            provider,
          });
          return;
        }
        throw txErr;
      }

      const fmt = (dt: Date) =>
        dt.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

      // Log successful booking-via-AI call
      try {
        const storedProvider = (provider && (provider === "gemini" || provider === "openai")) ? provider : null;
        await prisma.aiRecommendationLog.create({
          data: {
            userId,
            scope: "chat-booking",
            provider: storedProvider,
            promptTokens: tokenUsage.promptTokens ?? null,
            responseTokens: tokenUsage.responseTokens ?? null,
            latencyMs: callLatencyMs,
            success: true,
          },
        });
      } catch { /* non-critical */ }

      res.json({
        response: `✅ Done! I've booked **${chosenSpace.name}** for you from **${fmt(start)}** to **${fmt(end)}**. Check "My Bookings" to see it or manage it.`,
        followUpPrompts: ["Show my upcoming bookings", "Cancel a booking", "Book another space"],
        bookingConfirmation: {
          id: booking.id,
          spaceName: chosenSpace.name,
          spaceType: chosenSpace.type,
          floor: chosenSpace.floor,
          building: chosenSpace.building,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
        provider,
        tokenUsage,
      });
      return;
    } catch (bookErr) {
      console.error("[AI Chat] Booking execution failed:", bookErr);
      res.json({
        response: responseText + "\n\nI detected a booking request but hit an error creating it. Please try again or use the Book Space page.",
        followUpPrompts: ["Try again", "Go to Book Space page"],
        provider,
      });
      return;
    }
  }

  // ── Log AI call to AiRecommendationLog ────────────────────────────────
  try {
    const storedProvider = (provider && (provider === "gemini" || provider === "openai")) ? provider : null;
    await prisma.aiRecommendationLog.create({
      data: {
        userId,
        scope: "chat",
        provider: storedProvider,
        promptTokens: tokenUsage.promptTokens ?? null,
        responseTokens: tokenUsage.responseTokens ?? null,
        latencyMs: callLatencyMs,
        success: true,
      },
    });
  } catch { /* non-critical */ }

  // ── Regular query response ─────────────────────────────────────────────
  res.json({ response: responseText, followUpPrompts, provider, tokenUsage });
});

export default router;
