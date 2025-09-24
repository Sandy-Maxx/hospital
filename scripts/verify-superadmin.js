// Script to verify the superadmin user was created properly
const { PrismaClient } = require('@prisma/client');

async function verifySuperAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Find the superadmin user
    const superAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPERADMIN"
      }
    });
    
    if (superAdmin) {
      console.log("SuperAdmin user found:");
      console.log("ID:", superAdmin.id);
      console.log("Email:", superAdmin.email);
      console.log("Name:", superAdmin.name);
      console.log("Role:", superAdmin.role);
      console.log("Active:", superAdmin.isActive);
    } else {
      console.log("No SuperAdmin user found in the database");
    }
  } catch (error) {
    console.error("Error verifying SuperAdmin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
verifySuperAdmin();
