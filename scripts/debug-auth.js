#!/usr/bin/env node

/**
 * Authentication Debugging Script
 * This script helps diagnose login issues in production
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  console.log('🔍 Checking user accounts...');
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📊 Found ${users.length} users in database:`);
    console.log('');
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('🔧 You need to create user accounts first.');
      return { prisma, users: [] };
    }
    
    users.forEach((user, index) => {
      const statusIcon = user.isActive ? '✅' : '❌';
      const lastLoginText = user.lastLogin ? 
        `Last login: ${user.lastLogin.toISOString().split('T')[0]}` : 
        'Never logged in';
      
      console.log(`${statusIcon} ${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   ${lastLoginText}`);
      console.log('');
    });
    
    return { prisma, users };
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    return { prisma: null, users: [] };
  }
}

async function createDefaultAdmin(prisma) {
  console.log('🔧 Creating default admin user...');
  
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@hospital.com' },
      update: {
        isActive: true,
        password: hashedPassword
      },
      create: {
        email: 'admin@hospital.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        department: 'Administration'
      }
    });
    
    console.log('✅ Default admin user created/updated:');
    console.log(`   Email: admin@hospital.com`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${admin.role}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

async function testPasswordHash(prisma, email, testPassword) {
  console.log(`🔍 Testing password for ${email}...`);
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true, isActive: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    if (!user.isActive) {
      console.log('❌ User account is inactive');
      return false;
    }
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ Password is correct');
      return true;
    } else {
      console.log('❌ Password is incorrect');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing password:', error.message);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL', 
    'NEXTAUTH_SECRET'
  ];
  
  let allPresent = true;
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName === 'NEXTAUTH_SECRET' ? '[HIDDEN]' : value.substring(0, 50)}...`);
    } else {
      console.log(`❌ ${varName}: Not set`);
      allPresent = false;
    }
  });
  
  if (!allPresent) {
    console.log('');
    console.log('🔧 Missing environment variables detected!');
    console.log('Make sure these are set in your production environment:');
    console.log('- NEXTAUTH_URL should be your full domain (e.g., https://your-app.vercel.app)');
    console.log('- NEXTAUTH_SECRET should be a long random string');
    console.log('- DATABASE_URL should be your Supabase connection string');
  }
  
  return allPresent;
}

async function runAuthDiagnostics() {
  console.log('🔐 Hospital Management System - Authentication Diagnostics\n');
  
  // Check environment variables
  const envOk = await checkEnvironmentVariables();
  console.log('');
  
  // Check users
  const { prisma, users } = await checkUsers();
  
  if (!prisma) {
    console.log('❌ Cannot connect to database. Check your DATABASE_URL.');
    return;
  }
  
  if (users.length === 0) {
    console.log('🤔 No users found. Would you like to create a default admin user? (y/N)');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await createDefaultAdmin(prisma);
      }
      rl.close();
      await prisma.$disconnect();
    });
    return;
  }
  
  // Test login with first admin user
  const adminUser = users.find(u => u.role === 'ADMIN' && u.isActive);
  if (adminUser) {
    console.log('🧪 Testing login functionality...');
    console.log('Enter password to test (or press Enter to skip):');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`Password for ${adminUser.email}: `, async (password) => {
      if (password.trim()) {
        await testPasswordHash(prisma, adminUser.email, password);
      }
      
      console.log('');
      console.log('🎯 Diagnostic Summary:');
      console.log(`   Users in database: ${users.length}`);
      console.log(`   Active admin users: ${users.filter(u => u.role === 'ADMIN' && u.isActive).length}`);
      console.log(`   Environment variables: ${envOk ? 'OK' : 'MISSING'}`);
      console.log('');
      console.log('💡 If you still cannot login, check:');
      console.log('   1. Vercel environment variables are set correctly');
      console.log('   2. NEXTAUTH_URL matches your domain exactly');
      console.log('   3. Clear browser cookies and try again');
      console.log('   4. Check Vercel function logs for authentication errors');
      
      rl.close();
      await prisma.$disconnect();
    });
  } else {
    console.log('⚠️  No active admin users found!');
    console.log('🔧 Consider creating an admin user or activating an existing one.');
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runAuthDiagnostics().catch(console.error);
}

module.exports = {
  checkUsers,
  createDefaultAdmin,
  testPasswordHash,
  checkEnvironmentVariables
};