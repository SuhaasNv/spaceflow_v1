import { Router, Response } from "express";
import { z } from "zod";
import { OccupancySource, Role, BookingStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Must match isWithinCheckInWindow() in src/pages/CheckIn.tsx.
const CHECKIN_EARLY_MS = 15 * 60 * 1000;
const CHECKIN_LATE_MS = 60 * 60 * 1000;

const checkInSchema = z.object({
  spaceId: z.string().uuid(),
  bookingId: z.string().uuid(),
  source: z.nativeEnum(OccupancySource).default("MANUAL"),
});

const checkOutSchema = z.object({
  occupancyId: z.string().uuid(),
});

// GET /api/occupancy
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const { spaceId, from, to } = req.query;
  const isAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.FACILITIES_MANAGER;

  const records = await prisma.occupancyRecord.findMany({
    where: {
      ...(isAdmin ? {} : { userId: req.user!.userId }),
      ...(spaceId ? { spaceId: String(spaceId) } : {}),
      ...(from || to
        ? {
            checkIn: {
              ...(from ? { gte: new Date(String(from)) } : {}),
              ...(to ? { lte: new Date(String(to)) } : {}),
            },
          }
        : {}),
    },
    include: {
      space: { select: { id: true, name: true, type: true, floor: true, building: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { checkIn: "desc" },
    take: 500,
  });

  res.json({ records });
});

// POST /api/occupancy/checkin
router.post("/checkin", authenticate, async (req: AuthRequest, res: Response) => {
  const body = checkInSchema.parse(req.body);

  // Check space exists
  const space = await prisma.space.findUnique({ where: { id: body.spaceId } });
  if (!space || !space.isActive) {
    res.status(404).json({ error: "Space not found" });
    return;
  }

  // The frontend only ever offers check-in for the caller's own ACTIVE booking of this
  // space, within a 15-min-early/60-min-late window — but that's UI-only. Enforce the
  // same rules server-side so POSTing directly can't check in to an arbitrary space/time
  // or on someone else's booking.
  const isAdminOrFM = req.user!.role === Role.ADMIN || req.user!.role === Role.FACILITIES_MANAGER;
  const booking = await prisma.booking.findUnique({ where: { id: body.bookingId } });

  if (!booking || booking.spaceId !== body.spaceId) {
    res.status(404).json({ error: "Booking not found for this space" });
    return;
  }
  if (booking.userId !== req.user!.userId && !isAdminOrFM) {
    res.status(403).json({ error: "This booking belongs to a different account" });
    return;
  }
  if (booking.status !== BookingStatus.ACTIVE) {
    res.status(400).json({ error: "This booking is not active" });
    return;
  }
  const msUntilStart = new Date(booking.startTime).getTime() - Date.now();
  if (msUntilStart > CHECKIN_EARLY_MS || msUntilStart < -CHECKIN_LATE_MS) {
    res.status(400).json({ error: "Outside the check-in window for this booking" });
    return;
  }

  // Check if user already checked in (no checkout yet)
  const existing = await prisma.occupancyRecord.findFirst({
    where: {
      spaceId: body.spaceId,
      userId: req.user!.userId,
      checkOut: null,
    },
  });
  if (existing) {
    res.status(409).json({ error: "You are already checked in to this space" });
    return;
  }

  const record = await prisma.occupancyRecord.create({
    data: {
      spaceId: body.spaceId,
      userId: req.user!.userId,
      bookingId: body.bookingId ?? null,
      checkIn: new Date(),
      source: body.source,
    },
    include: {
      space: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ record });
});

// POST /api/occupancy/checkout
router.post("/checkout", authenticate, async (req: AuthRequest, res: Response) => {
  const body = checkOutSchema.parse(req.body);

  const record = await prisma.occupancyRecord.findUnique({
    where: { id: body.occupancyId },
  });

  if (!record) {
    res.status(404).json({ error: "Occupancy record not found" });
    return;
  }

  const isOwner = record.userId === req.user!.userId;
  const isAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.FACILITIES_MANAGER;

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  if (record.checkOut) {
    res.status(400).json({ error: "Already checked out" });
    return;
  }

  const updated = await prisma.occupancyRecord.update({
    where: { id: body.occupancyId },
    data: { checkOut: new Date() },
    include: {
      space: { select: { id: true, name: true } },
    },
  });

  res.json({ record: updated });
});

// GET /api/occupancy/active - Get user's active check-ins
router.get("/active", authenticate, async (req: AuthRequest, res: Response) => {
  const records = await prisma.occupancyRecord.findMany({
    where: {
      userId: req.user!.userId,
      checkOut: null,
    },
    include: {
      space: { select: { id: true, name: true, type: true, floor: true } },
    },
  });

  res.json({ records });
});

export default router;
