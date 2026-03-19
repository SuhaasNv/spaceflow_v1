const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const spaces = await prisma.space.count();
  const bookings = await prisma.booking.count();
  const configs = await prisma.platformConfig.count();
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });

  console.log("Database seed status:");
  console.log("  Users:", users);
  console.log("  Admins:", admins.map((a) => a.email).join(", ") || "(none)");
  console.log("  Spaces:", spaces);
  console.log("  Bookings:", bookings);
  console.log("  Platform configs:", configs);
  console.log("");
  console.log(users > 0 && spaces > 0 && configs > 0 ? "✅ Database appears seeded" : "❌ Database not seeded (run: npm run db:seed)");
}

main()
  .catch((e) => {
    console.error("Connection failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
