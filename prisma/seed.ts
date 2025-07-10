import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Database schema is ready!");
  console.log("✅ Using existing admin users for authentication");
  console.log("📌 All trading data comes from your FastAPI backend at http://localhost:8000");
  console.log("🔑 Login with your existing admin credentials");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
