import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, SpaceType, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();

/** Random integer between min and max (inclusive) */
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random element from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Return a Date that is `daysAgo` days in the past, at the given hour */
function pastDate(daysAgo: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ─────────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@spaceflow.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@SpaceFlow1!";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { name: "Admin", email: adminEmail, passwordHash, role: "ADMIN" },
    });
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  }

  const sampleUsers = [
    { name: "Alice Johnson", email: "alice@spaceflow.local", role: "FACILITIES_MANAGER" as const },
    { name: "Bob Smith",     email: "bob@spaceflow.local",   role: "EMPLOYEE" as const },
    { name: "Carol Williams",email: "carol@spaceflow.local", role: "EMPLOYEE" as const },
    { name: "David Lee",     email: "david@spaceflow.local", role: "EMPLOYEE" as const },
    { name: "Eva Martinez",  email: "eva@spaceflow.local",   role: "EMPLOYEE" as const },
  ];

  for (const u of sampleUsers) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await prisma.user.create({
        data: { ...u, passwordHash: await bcrypt.hash("Password@123", 12) },
      });
      console.log(`✅ User created: ${u.email}`);
    }
  }

  // ── Spaces ────────────────────────────────────────────────────────────────
  const spaceDefinitions = [
    { name: "Meeting Room A",    type: SpaceType.MEETING_ROOM,       floor: "1st", building: "Main",  capacity: 8  },
    { name: "Meeting Room B",    type: SpaceType.MEETING_ROOM,       floor: "1st", building: "Main",  capacity: 6  },
    { name: "Conference Hall",   type: SpaceType.MEETING_ROOM,       floor: "3rd", building: "Main",  capacity: 50 },
    { name: "Phone Booth #1",    type: SpaceType.PHONE_BOOTH,        floor: "1st", building: "Main",  capacity: 1  },
    { name: "Phone Booth #2",    type: SpaceType.PHONE_BOOTH,        floor: "2nd", building: "Main",  capacity: 1  },
    { name: "Hot Desk #1",       type: SpaceType.DESK,               floor: "2nd", building: "Main",  capacity: 1  },
    { name: "Hot Desk #2",       type: SpaceType.DESK,               floor: "2nd", building: "Main",  capacity: 1  },
    { name: "Hot Desk #3",       type: SpaceType.DESK,               floor: "2nd", building: "Main",  capacity: 1  },
    { name: "Collaboration Zone",type: SpaceType.COLLABORATION_AREA, floor: "3rd", building: "Main",  capacity: 20 },
    { name: "Executive Office A",type: SpaceType.OFFICE,             floor: "4th", building: "Main",  capacity: 4  },
    { name: "Lounge Area",       type: SpaceType.COLLABORATION_AREA, floor: "1st", building: "Annex", capacity: 15 },
    { name: "Quiet Room 1",      type: SpaceType.OFFICE,             floor: "2nd", building: "Annex", capacity: 2  },
  ];

  for (const s of spaceDefinitions) {
    const exists = await prisma.space.findFirst({ where: { name: s.name } });
    if (!exists) {
      await prisma.space.create({ data: s });
      console.log(`✅ Space created: ${s.name}`);
    }
  }

  // ── Platform config ───────────────────────────────────────────────────────
  const defaultConfigs = [
    { key: "booking.maxDurationHours",    value: 8  },
    { key: "booking.advanceBookingDays",  value: 14 },
    { key: "booking.autoReleaseMinutes",  value: 15 },
    { key: "workday.startHour",           value: 8  },
    { key: "workday.endHour",             value: 18 },
    { key: "workday.timezone",            value: "UTC" },
  ];
  for (const c of defaultConfigs) {
    await prisma.platformConfig.upsert({
      where:  { key: c.key },
      update: {},
      create: { key: c.key, value: c.value },
    });
  }
  console.log("✅ Platform config seeded");

  // ── Sample bookings (skip only if there are already substantial booking data) ──
  const existingCount = await prisma.booking.count();
  if (existingCount >= 50) {
    console.log(`ℹ️  ${existingCount} bookings already exist — skipping booking seed`);
  } else {
    console.log("🗓  Seeding sample bookings and occupancy records...");

    // Fetch all users and spaces for reference
    const users  = await prisma.user.findMany({ where: { isActive: true } });
    const spaces = await prisma.space.findMany({ where: { isActive: true } });

    if (users.length === 0 || spaces.length === 0) {
      console.warn("⚠️  No users or spaces found — skipping booking seed");
    } else {
      const cancellationReasons = [
        "Meeting rescheduled to next week",
        "Team decided to work from home",
        "Project was cancelled",
        "Found a different room closer to the team",
        "Client call moved to video call, no room needed",
        "Urgent travel came up",
        "Not enough attendees confirmed",
        "Room was too far from the rest of the team",
        "Technical issues with the AV equipment in this room",
        "Manager requested we postpone",
      ];

      // Work-hour slots: pairs of [startHour, durationHours]
      const timeSlots: [number, number][] = [
        [8, 1], [9, 1], [9, 2], [10, 1], [10, 2],
        [11, 1], [12, 1], [13, 1], [14, 1], [14, 2],
        [15, 1], [15, 2], [16, 1], [16, 2],
      ];

      // Purposes per space type
      const purposes: Record<string, string[]> = {
        MEETING_ROOM:       ["Team standup", "Sprint planning", "Client presentation", "Design review", "1:1 catch-up", "Project kickoff"],
        DESK:               ["Focus work", "Deep work session", "Remote collaboration", "Documentation"],
        PHONE_BOOTH:        ["Client call", "Interview", "Personal call", "Quiet focus"],
        COLLABORATION_AREA: ["Brainstorming session", "Workshop", "Team offsite", "Ideation session"],
        OFFICE:             ["Focused work", "Confidential meeting", "Executive briefing"],
      };

      // Generate ~160 bookings spread over the past 90 days
      // We use a deterministic-ish spread to avoid conflicts
      let created = 0;
      let occupancyCreated = 0;

      for (let daysAgo = 90; daysAgo >= 1; daysAgo--) {
        // Skip weekends (day=0 Sun, day=6 Sat)
        const sampleDate = new Date();
        sampleDate.setDate(sampleDate.getDate() - daysAgo);
        const dow = sampleDate.getDay();
        if (dow === 0 || dow === 6) continue;

        // 2-3 bookings per workday
        const bookingsThisDay = randInt(1, 3);
        const usedSlots = new Map<string, boolean>(); // "spaceId-startHour" → taken

        for (let i = 0; i < bookingsThisDay; i++) {
          const space  = pick(spaces);
          const [startHour, duration] = pick(timeSlots);
          const slotKey = `${space.id}-${startHour}`;
          if (usedSlots.has(slotKey)) continue;
          usedSlots.set(slotKey, true);

          const startTime = pastDate(daysAgo, startHour);
          const endTime   = pastDate(daysAgo, startHour + duration);
          const user      = pick(users);

          // 20% chance of cancellation
          const isCancelled = Math.random() < 0.2;
          const status = isCancelled ? BookingStatus.CANCELLED : BookingStatus.COMPLETED;
          const purposeList = purposes[space.type] ?? ["General use"];
          const purpose = pick(purposeList);

          const booking = await prisma.booking.create({
            data: {
              spaceId:    space.id,
              userId:     user.id,
              startTime,
              endTime,
              status,
              purpose,
              attendeeCount: space.type === "DESK" || space.type === "PHONE_BOOTH" ? 1 : randInt(2, Math.min(space.capacity, 8)),
              cancellationReason: isCancelled ? pick(cancellationReasons) : null,
            },
          });
          created++;

          // For non-cancelled bookings, 65% chance of a matching OccupancyRecord
          if (!isCancelled && Math.random() < 0.65) {
            // Actual check-in slightly after start; check-out slightly before end
            const checkIn  = new Date(startTime.getTime() + randInt(0, 10) * 60_000);
            const checkOut = new Date(endTime.getTime() - randInt(0, 15) * 60_000);
            if (checkOut > checkIn) {
              await prisma.occupancyRecord.create({
                data: {
                  spaceId:   space.id,
                  userId:    user.id,
                  bookingId: booking.id,
                  checkIn,
                  checkOut,
                  source:    "MANUAL",
                },
              });
              occupancyCreated++;
            }
          }
        }
      }

      console.log(`✅ Created ${created} sample bookings and ${occupancyCreated} occupancy records`);
    }
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
