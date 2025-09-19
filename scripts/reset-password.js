#!/usr/bin/env node

/**
 * Password Reset Script
 * This script helps reset user passwords for testing login
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function resetPassword(email, newPassword) {
  console.log(`🔧 Resetting password for ${email}...`);
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, role: true, isActive: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    if (!user.isActive) {
      console.log('❌ User account is inactive');
      return false;
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        isActive: true // Ensure user is active
      }
    });
    
    console.log('✅ Password reset successful!');
    console.log(`   User: ${user.name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   New Password: ${newPassword}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after logging in!');
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    return false;
  }
}

async function resetAdminPassword() {
  console.log('🔐 Hospital Management System - Password Reset\n');
  
  const adminEmails = [
    'admin@hospital.com',
    'admin@medicare-hospital.in'
  ];
  
  console.log('Available admin accounts:');
  adminEmails.forEach((email, index) => {
    console.log(`${index + 1}. ${email}`);
  });
  console.log('');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Select admin account (1-2): ', async (choice) => {
    const selectedEmail = adminEmails[parseInt(choice) - 1];
    
    if (!selectedEmail) {
      console.log('❌ Invalid selection');
      rl.close();
      return;
    }
    
    // Reset to a known password
    const newPassword = 'Admin123!';
    const success = await resetPassword(selectedEmail, newPassword);
    
    if (success) {
      console.log('\n🎯 You can now login with:');
      console.log(`   Email: ${selectedEmail}`);
      console.log(`   Password: ${newPassword}`);
      console.log('');
      console.log('🚀 Next steps:');
      console.log('   1. Try logging in locally first to test');
      console.log('   2. Make sure NEXTAUTH_URL is set correctly in Vercel:');
      console.log('      https://your-app.vercel.app (not localhost)');
      console.log('   3. Clear your browser cookies');
      console.log('   4. Try logging into production');
    }
    
    rl.close();
  });
}

// Run if called directly
if (require.main === module) {
  resetAdminPassword().catch(console.error);
}

module.exports = {
  resetPassword
};