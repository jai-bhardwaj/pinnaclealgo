import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create a dummy user
  const hashedPassword = await bcrypt.hash("password123", 12);

  const dummyUser = await prisma.user.upsert({
    where: { email: "demo@trading.com" },
    update: {},
    create: {
      email: "demo@trading.com",
      username: "demo_trader",
      hashedPassword: hashedPassword,
      firstName: "Demo",
      lastName: "Trader",
      role: "USER",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  console.log("✅ Created dummy user:", {
    id: dummyUser.id,
    email: dummyUser.email,
    username: dummyUser.username,
    role: dummyUser.role,
  });

  console.log("🔑 Login credentials:");
  console.log("   Email: demo@trading.com");
  console.log("   Password: password123");
  console.log(
    "📌 All trading data comes from your FastAPI backend at http://localhost:8000"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
