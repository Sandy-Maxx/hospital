// Script to manually add a superadmin user to the database
// This should only be used in development environments

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function addSuperAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        email: "superadmin@hospital.com"
      }
    });
    
    if (existingSuperAdmin) {
      console.log("SuperAdmin user already exists with email: superadmin@hospital.com");
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash("superadmin123", 10);
    
    // Create the superadmin user
    const superAdmin = await prisma.user.create({
      data: {
        name: "System Super Administrator",
        email: "superadmin@hospital.com",
        password: hashedPassword,
        role: "SUPERADMIN",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log("SuperAdmin user created successfully!");
    console.log("Email: superadmin@hospital.com");
    console.log("Password: superadmin123 (hashed in database)");
    console.log("Role: SUPERADMIN");
  } catch (error) {
    console.error("Error creating SuperAdmin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addSuperAdminUser();
