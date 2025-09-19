#!/usr/bin/env node

/**
 * Demo Users Setup Script
 * Sets consistent passwords for all demo users
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const demoUsers = [
  { email: 'admin@hospital.com', password: 'admin123', role: 'ADMIN' },
  { email: 'doctor@hospital.com', password: 'doctor123', role: 'DOCTOR' },
  { email: 'reception@hospital.com', password: 'reception123', role: 'RECEPTIONIST' },
  { email: 'nurse.mary@hospital.com', password: 'nurse123', role: 'NURSE' }
];

async function setupDemoUsers() {
  console.log('🔧 Setting up demo user passwords...\n');
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    for (const demoUser of demoUsers) {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: demoUser.email }
      });
      
      if (existingUser) {
        // Update existing user
        const hashedPassword = await bcrypt.hash(demoUser.password, 12);
        await prisma.user.update({
          where: { email: demoUser.email },
          data: { 
            password: hashedPassword,
            isActive: true
          }
        });
        console.log(`✅ Updated: ${demoUser.email} (${demoUser.role}) -> ${demoUser.password}`);
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(demoUser.password, 12);
        await prisma.user.create({
          data: {
            email: demoUser.email,
            name: `Demo ${demoUser.role.charAt(0) + demoUser.role.slice(1).toLowerCase()}`,
            password: hashedPassword,
            role: demoUser.role,
            isActive: true,
            department: demoUser.role === 'DOCTOR' ? 'General Medicine' : 
                       demoUser.role === 'ADMIN' ? 'Administration' :
                       demoUser.role === 'NURSE' ? 'Nursing' : 'Reception'
          }
        });
        console.log(`✨ Created: ${demoUser.email} (${demoUser.role}) -> ${demoUser.password}`);
      }
    }
    
    console.log('\n🎯 Demo users setup complete!');
    console.log('\n📋 Login Credentials:');
    demoUsers.forEach(user => {
      console.log(`   ${user.role}: ${user.email} / ${user.password}`);
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error setting up demo users:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  setupDemoUsers().catch(console.error);
}

module.exports = { setupDemoUsers };