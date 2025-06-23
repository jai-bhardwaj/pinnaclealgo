import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@trading.com" },
    update: {},
    create: {
      email: "demo@trading.com",
      firstName: "Demo",
      lastName: "User",
      username: "demo_user",
      hashedPassword: hashedPassword,
      role: "USER",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  console.log("✅ Created demo user:", demoUser.email);
  console.log("✅ You can now log in with:");
  console.log("   Email: demo@trading.com");
  console.log("   Password: demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
