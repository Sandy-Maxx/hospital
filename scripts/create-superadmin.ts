import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPERADMIN",
      },
    });

    if (existingSuperAdmin) {
      console.log("SuperAdmin user already exists:", existingSuperAdmin.email);
      return;
    }

    // Create superadmin user
    const superAdmin = await prisma.user.create({
      data: {
        name: "System Super Administrator",
        email: "superadmin@hospital.com",
        password: await bcrypt.hash("superadmin123", 10),
        role: "SUPERADMIN",
        isActive: true,
      },
    });

    console.log("SuperAdmin user created successfully:", superAdmin.email);
  } catch (error) {
    console.error("Error creating SuperAdmin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
