const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function setupDatabase() {
  try {
    console.log("🔄 Setting up database...");

    // Generate Prisma client and push schema
    console.log("📦 Generating Prisma client...");
    execSync("npx prisma generate", { stdio: "inherit" });

    console.log("🗄️ Pushing database schema...");
    execSync("npx prisma db push --force-reset", { stdio: "inherit" });

    // Now seed the database
    console.log("🌱 Seeding database...");
    const prisma = new PrismaClient();

    await prisma.$connect();

    // Create default users
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await prisma.user.create({
      data: {
        email: "admin@hospital.com",
        name: "Admin User",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });

    const doctor = await prisma.user.create({
      data: {
        email: "doctor@hospital.com",
        name: "Dr. Smith",
        password: hashedPassword,
        role: "DOCTOR",
        department: "General Medicine",
        specialization: "General Practitioner",
        isActive: true,
      },
    });

    const receptionist = await prisma.user.create({
      data: {
        email: "reception@hospital.com",
        name: "Reception Staff",
        password: hashedPassword,
        role: "RECEPTIONIST",
        isActive: true,
      },
    });

    console.log("✅ Test users created:");
    console.log("- Admin: admin@hospital.com / admin123");
    console.log("- Doctor: doctor@hospital.com / doctor123");
    console.log("- Receptionist: reception@hospital.com / reception123");

    // Create hospital settings
    await prisma.hospitalSettings.create({
      data: {
        name: "MediCare Hospital",
        tagline: "Your Health, Our Priority",
        phone: "+91 98765 43210",
        email: "info@medicare.com",
        address: "123 Health Street, Medical City, India",
      },
    });

    console.log("✅ Hospital settings initialized");

    await prisma.$disconnect();
    console.log("🎉 Database setup complete!");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  }
}

setupDatabase();
