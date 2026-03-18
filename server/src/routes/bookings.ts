import { Router, Response } from "express";
import { z } from "zod";
import { BookingStatus, Role, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

const createBookingSchema = z.object({
  spaceId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  purpose: z.string().max(500).optional(),
  attendeeCount: z.number().int().min(1).max(10000).optional(),
});

const updateBookingSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  purpose: z.string().max(500).optional(),
  attendeeCount: z.number().int().min(1).optional(),
});

// GET /api/bookings
// ?mine=true forces filtering to the requesting user's bookings regardless of role
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const { status, spaceId, from, to } = req.query;
  const mine = req.query["mine"] === "true";
  const isAdmin = !mine && (req.user!.role === Role.ADMIN || req.user!.role === Role.FACILITIES_MANAGER);

  const bookings = await prisma.booking.findMany({
    where: {
      ...(isAdmin ? {} : { userId: req.user!.userId }),
      ...(status ? { status: status as BookingStatus } : {}),
      ...(spaceId ? { spaceId: String(spaceId) } : {}),
      ...(from || to
        ? {
            startTime: {
              ...(from ? { gte: new Date(String(from)) } : {}),
              ...(to ? { lte: new Date(String(to)) } : {}),
            },
          }
        : {}),
    },
    include: {
      space: { select: { id: true, name: true, type: true, floor: true, building: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: "desc" },
    take: 200,
  });

  res.json({ bookings });
});

// GET /api/bookings/occupied-spaces?start=ISO&end=ISO
// Returns IDs of spaces that have an active booking overlapping the given window.
// Accessible to all authenticated users so BookSpace can grey out taken rooms.
router.get("/occupied-spaces", authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  });

  const result = schema.safeParse({
    start: String(req.query["start"] ?? ""),
    end: String(req.query["end"] ?? ""),
  });

  if (!result.success) {
    res.status(400).json({ error: "start and end (ISO datetime) are required" });
    return;
  }

  const { start, end } = result.data;

  const bookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.ACTIVE,
      AND: [{ startTime: { lt: new Date(end) } }, { endTime: { gt: new Date(start) } }],
    },
    select: { spaceId: true },
  });

  const occupiedSpaceIds = [...new Set(bookings.map((b) => b.spaceId))];
  res.json({ occupiedSpaceIds });
});

// GET /api/bookings/availability
router.get("/availability", authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    spaceId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    excludeBookingId: z.string().uuid().optional(),
  });

  const query = schema.parse({
    spaceId: String(req.query["spaceId"] ?? ""),
    startTime: String(req.query["startTime"] ?? ""),
    endTime: String(req.query["endTime"] ?? ""),
    excludeBookingId: req.query["excludeBookingId"] ? String(req.query["excludeBookingId"]) : undefined,
  });

  const start = new Date(query.startTime);
  const end = new Date(query.endTime);

  if (start >= end) {
    res.status(400).json({ error: "startTime must be before endTime" });
    return;
  }

  const conflicts = await prisma.booking.findMany({
    where: {
      spaceId: query.spaceId,
      status: BookingStatus.ACTIVE,
      ...(query.excludeBookingId ? { id: { not: query.excludeBookingId } } : {}),
      AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  res.json({ available: conflicts.length === 0, conflictingBookings: conflicts });
});

// GET /api/bookings/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const booking = await prisma.booking.findUnique({
    where: { id: String(req.params["id"]) },
    include: {
      space: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const isOwner = booking.userId === req.user!.userId;
  const isAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.FACILITIES_MANAGER;

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json({ booking: booking as typeof booking });
});

// POST /api/bookings
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const body = createBookingSchema.parse(req.body);
  const start = new Date(body.startTime);
  const end = new Date(body.endTime);

  if (start >= end) {
    res.status(400).json({ error: "startTime must be before endTime" });
    return;
  }

  if (start < new Date()) {
    res.status(400).json({ error: "Cannot book in the past" });
    return;
  }

  // Check space exists (outside transaction — read-only, no race risk)
  const space = await prisma.space.findUnique({ where: { id: body.spaceId } });
  if (!space || !space.isActive) {
    res.status(404).json({ error: "Space not found or unavailable" });
    return;
  }

  // ── Atomic conflict-check + insert ─────────────────────────────────────
  // Serializable isolation ensures two concurrent requests cannot both
  // pass the conflict check and create a double-booking.
  // If PostgreSQL detects a write conflict it aborts one transaction with
  // error code P2034 which we surface as a clean 409.
  try {
    const booking = await prisma.$transaction(
      async (tx) => {
        const conflicts = await tx.booking.findMany({
          where: {
            spaceId: body.spaceId,
            status: BookingStatus.ACTIVE,
            AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
          },
          select: { id: true, startTime: true, endTime: true },
        });

        if (conflicts.length > 0) {
          const err = Object.assign(new Error("BOOKING_CONFLICT"), { conflicts });
          throw err;
        }

        return tx.booking.create({
          data: {
            spaceId: body.spaceId,
            userId: req.user!.userId,
            startTime: start,
            endTime: end,
            purpose: body.purpose,
            attendeeCount: body.attendeeCount,
            status: BookingStatus.ACTIVE,
          },
          include: {
            space: { select: { id: true, name: true, type: true, floor: true, building: true } },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    res.status(201).json({ booking });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "BOOKING_CONFLICT") {
      res.status(409).json({
        error: "Space is already booked for this time slot",
        conflicts: (err as Error & { conflicts: unknown[] }).conflicts,
      });
      return;
    }
    // PostgreSQL serialization failure — two requests raced and one lost
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
      res.status(409).json({
        error: "This space was just booked by someone else. Please refresh and try again.",
      });
      return;
    }
    throw err;
  }
});

// PATCH /api/bookings/:id
router.patch("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const id = String(req.params["id"]);
  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const isOwner = booking.userId === req.user!.userId;
  const isAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.FACILITIES_MANAGER;

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const body = updateBookingSchema.parse(req.body);
  const updated = await prisma.booking.update({
    where: { id },
    data: body,
    include: {
      space: { select: { id: true, name: true, type: true, floor: true, building: true } },
    },
  });

  res.json({ booking: updated });
});

// DELETE /api/bookings/:id (cancel)
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const id = String(req.params["id"]);
  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const isOwner = booking.userId === req.user!.userId;
  const isAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.FACILITIES_MANAGER;

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  if (booking.status === BookingStatus.CANCELLED) {
    res.status(400).json({ error: "Booking is already cancelled" });
    return;
  }

  const bodySchema = z.object({ reason: z.string().min(1).max(500).optional() });
  const { reason } = bodySchema.parse(req.body ?? {});

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: BookingStatus.CANCELLED,
      cancellationReason: reason ?? null,
    },
    include: {
      space: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({ booking: updated });
});

export default router;
