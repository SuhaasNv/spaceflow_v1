import { Router, Response } from "express";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdminOrFM, AuthRequest } from "../middleware/auth.js";

const router = Router();

const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  spaceId: z.string().uuid().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
});

function parseRange(query: Record<string, unknown>) {
  const { from, to } = dateRangeSchema.parse(query);
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return {
    from: from ? new Date(from) : defaultFrom,
    to: to ? new Date(to) : now,
  };
}

// GET /api/analytics/utilization
router.get("/utilization", authenticate, requireAdminOrFM, async (req: AuthRequest, res: Response) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);
  const totalAvailableMinutesPerDay = 9 * 60; // 9-hour workday

  const spaces = await prisma.space.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true, floor: true, building: true },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { gte: from, lte: to },
      status: { not: BookingStatus.CANCELLED },
    },
    select: { spaceId: true, startTime: true, endTime: true },
  });

  const occupancy = await prisma.occupancyRecord.findMany({
    where: { checkIn: { gte: from, lte: to }, checkOut: { not: null } },
    select: { spaceId: true, checkIn: true, checkOut: true },
  });

  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
  const totalAvailableMinutes = days * totalAvailableMinutesPerDay;

  const utilization = spaces.map((space) => {
    const spaceBookings = bookings.filter((b) => b.spaceId === space.id);
    const spaceOccupancy = occupancy.filter((o) => o.spaceId === space.id);

    const bookedMinutes = spaceBookings.reduce((sum, b) => {
      return sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000;
    }, 0);

    const usedMinutes = spaceOccupancy.reduce((sum, o) => {
      if (!o.checkOut) return sum;
      return sum + (o.checkOut.getTime() - o.checkIn.getTime()) / 60000;
    }, 0);

    const plannedUtil = Math.min(100, (bookedMinutes / totalAvailableMinutes) * 100);
    const actualUtil = Math.min(100, (usedMinutes / totalAvailableMinutes) * 100);

    return {
      spaceId: space.id,
      name: space.name,
      type: space.type,
      floor: space.floor,
      building: space.building,
      plannedUtilization: Math.round(plannedUtil * 10) / 10,
      actualUtilization: Math.round(actualUtil * 10) / 10,
      bookedMinutes: Math.round(bookedMinutes),
      usedMinutes: Math.round(usedMinutes),
    };
  });

  res.json({ utilization, from, to });
});

// GET /api/analytics/booking-usage
router.get("/booking-usage", authenticate, requireAdminOrFM, async (req: AuthRequest, res: Response) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { gte: from, lte: to },
    },
    select: { id: true, spaceId: true, startTime: true, endTime: true, status: true },
  });

  const occupancy = await prisma.occupancyRecord.findMany({
    where: { checkIn: { gte: from, lte: to } },
    select: { bookingId: true, checkIn: true, checkOut: true },
  });

  const occupiedBookingIds = new Set(
    occupancy.filter((o) => o.bookingId).map((o) => o.bookingId!)
  );

  const total = bookings.length;
  const cancelled = bookings.filter((b) => b.status === BookingStatus.CANCELLED).length;
  const active = bookings.filter((b) => b.status === BookingStatus.ACTIVE);
  const used = active.filter((b) => occupiedBookingIds.has(b.id)).length;
  const noShows = active.filter(
    (b) => !occupiedBookingIds.has(b.id) && new Date(b.endTime) < new Date()
  ).length;

  // Daily breakdown
  const dailyMap = new Map<string, { date: string; booked: number; used: number; noShows: number }>();
  for (const b of bookings) {
    const date = b.startTime.toISOString().split("T")[0];
    if (!dailyMap.has(date)) dailyMap.set(date, { date, booked: 0, used: 0, noShows: 0 });
    const day = dailyMap.get(date)!;
    day.booked++;
    if (b.status === BookingStatus.ACTIVE) {
      if (occupiedBookingIds.has(b.id)) day.used++;
      else if (new Date(b.endTime) < new Date()) day.noShows++;
    }
  }

  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    summary: { total, cancelled, used, noShows, noShowRate: total ? Math.round((noShows / total) * 1000) / 10 : 0 },
    daily,
    from,
    to,
  });
});

// GET /api/analytics/patterns
router.get("/patterns", authenticate, requireAdminOrFM, async (req: AuthRequest, res: Response) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { gte: from, lte: to },
      status: { not: BookingStatus.CANCELLED },
    },
    include: {
      space: { select: { type: true } },
    },
  });

  // Bookings by hour of day (0-23)
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  // Bookings by day of week (0=Sun..6=Sat)
  const byDay = Array.from({ length: 7 }, (_, d) => ({
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d],
    count: 0,
  }));
  // Bookings by space type
  const byType: Record<string, number> = {};

  for (const b of bookings) {
    byHour[b.startTime.getHours()].count++;
    byDay[b.startTime.getDay()].count++;
    const type = (b as { space: { type: string } }).space?.type ?? "UNKNOWN";
    byType[type] = (byType[type] ?? 0) + 1;
  }

  const peakHour = byHour.reduce((max, h) => (h.count > max.count ? h : max), byHour[0]);
  const peakDay = byDay.reduce((max, d) => (d.count > max.count ? d : max), byDay[0]);

  res.json({
    byHour,
    byDay,
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    peakHour: peakHour.hour,
    peakDay: peakDay.day,
    from,
    to,
  });
});

// GET /api/analytics/segments
router.get("/segments", authenticate, requireAdminOrFM, async (req: AuthRequest, res: Response) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { gte: from, lte: to },
      status: { not: BookingStatus.CANCELLED },
    },
    include: {
      space: { select: { floor: true, building: true, type: true } },
    },
  });

  // Segment by floor
  const byFloor: Record<string, number> = {};
  const byBuilding: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const b of bookings) {
    const floor = b.space.floor ?? "Unknown";
    const building = b.space.building ?? "Unknown";
    const type = b.space.type;
    byFloor[floor] = (byFloor[floor] ?? 0) + 1;
    byBuilding[building] = (byBuilding[building] ?? 0) + 1;
    byType[type] = (byType[type] ?? 0) + 1;
  }

  res.json({
    byFloor: Object.entries(byFloor).map(([floor, count]) => ({ floor, count })).sort((a, b) => b.count - a.count),
    byBuilding: Object.entries(byBuilding).map(([building, count]) => ({ building, count })).sort((a, b) => b.count - a.count),
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    from,
    to,
  });
});

// GET /api/analytics/dashboard - summary for dashboard home
router.get("/dashboard", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const isFMOrAdmin = role === "ADMIN" || role === "FACILITIES_MANAGER";
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  // ── FM / Admin dashboard ────────────────────────────────────────────────
  if (isFMOrAdmin) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalSpaces,
      bookingsToday,
      totalBookingsThisWeek,
      cancellationsThisWeek,
      noShowsThisWeek,
    ] = await Promise.all([
      prisma.space.count({ where: { isActive: true } }),
      prisma.booking.count({
        where: { startTime: { gte: todayStart, lt: todayEnd }, status: { not: BookingStatus.CANCELLED } },
      }),
      prisma.booking.count({
        where: { startTime: { gte: weekAgo }, status: { not: BookingStatus.CANCELLED } },
      }),
      prisma.booking.count({
        where: { status: BookingStatus.CANCELLED, updatedAt: { gte: weekAgo } },
      }),
      prisma.booking.count({
        where: {
          status: BookingStatus.ACTIVE,
          endTime: { lt: now },
          startTime: { gte: weekAgo },
          occupancyRecords: { none: {} },
        },
      }),
    ]);

    const noShowRate = totalBookingsThisWeek > 0
      ? Math.round((noShowsThisWeek / totalBookingsThisWeek) * 1000) / 10
      : 0;

    // Today's full schedule (all bookings, sorted by time)
    const todayBookings = await prisma.booking.findMany({
      where: { startTime: { gte: todayStart, lt: todayEnd }, status: { not: BookingStatus.CANCELLED } },
      include: {
        space: { select: { id: true, name: true, type: true, floor: true, building: true } },
        user:  { select: { id: true, name: true } },
        occupancyRecords: { select: { id: true, checkIn: true, checkOut: true }, take: 1 },
      },
      orderBy: { startTime: "asc" },
      take: 15,
    });

    // Recent cancellations with reasons
    const recentCancellations = await prisma.booking.findMany({
      where: { status: BookingStatus.CANCELLED, updatedAt: { gte: weekAgo } },
      include: {
        space: { select: { name: true, type: true } },
        user:  { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });

    // Top 5 spaces by booking count this week
    const topSpaceGroups = await prisma.booking.groupBy({
      by: ["spaceId"],
      where: { startTime: { gte: weekAgo }, status: { not: BookingStatus.CANCELLED } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const topSpaceDetails = await prisma.space.findMany({
      where: { id: { in: topSpaceGroups.map((g) => g.spaceId) } },
      select: { id: true, name: true, type: true, capacity: true },
    });

    const topSpaces = topSpaceGroups.map((g) => ({
      ...topSpaceDetails.find((s) => s.id === g.spaceId),
      bookingCount: g._count.id,
    }));

    return res.json({
      role: "FM",
      stats: {
        totalSpaces,
        bookingsToday,
        totalBookingsThisWeek,
        cancellationsThisWeek,
        noShowsThisWeek,
        noShowRate,
      },
      todayBookings,
      recentCancellations,
      topSpaces,
    });
  }

  // ── Employee dashboard ───────────────────────────────────────────────────
  const [
    totalSpaces,
    myBookingsThisWeek,
    activeBookings,
    totalBookingsThisMonth,
  ] = await Promise.all([
    prisma.space.count({ where: { isActive: true } }),
    prisma.booking.count({
      where: { userId, startTime: { gte: weekAgo }, status: { not: BookingStatus.CANCELLED } },
    }),
    prisma.booking.count({
      where: { userId, status: BookingStatus.ACTIVE, startTime: { gte: now } },
    }),
    prisma.booking.count({
      where: { startTime: { gte: monthAgo }, status: { not: BookingStatus.CANCELLED } },
    }),
  ]);

  const recentBookings = await prisma.booking.findMany({
    where: { userId, status: BookingStatus.ACTIVE },
    include: {
      space: { select: { id: true, name: true, type: true, floor: true } },
    },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  res.json({
    role: "EMPLOYEE",
    stats: { totalSpaces, myBookingsThisWeek, activeBookings, totalBookingsThisMonth },
    recentBookings,
  });
});

export default router;
