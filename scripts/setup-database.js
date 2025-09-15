#!/usr/bin/env node

/**
 * Comprehensive Database Setup Script for Hospital Management System
 * 
 * This script will:
 * 1. Reset the database (optional with --force flag)
 * 2. Run Prisma migrations
 * 3. Seed all required data including:
 *    - Users with proper roles (ADMIN, DOCTOR, NURSE, RECEPTIONIST)
 *    - Hospital settings
 *    - Permissions and custom roles
 *    - Problem categories
 *    - IPD data (wards, bed types, beds)
 *    - Patients and appointments
 *    - Medicine inventory
 *    - Consultation fees
 *    - Sample prescriptions and bills
 *    - Sample admissions
 *    - Appointment sessions
 *    - Doctor availability
 * 
 * Usage: 
 *   node scripts/setup-database.js          # Normal setup (no reset)
 *   node scripts/setup-database.js --force  # Force reset and full setup
 */

const { execSync } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const forceReset = args.includes('--force') || args.includes('-f');

console.log('🚀 Starting comprehensive Hospital Management System database setup...\n');

// Change to project root
process.chdir(path.join(__dirname, '..'));

try {
  // Step 1: Optionally reset database
  if (forceReset) {
    console.log('⚠️  FORCE RESET MODE: This will delete all existing data!');
    console.log('🔄 Resetting database...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    console.log('✅ Database reset complete\n');
  }

  // Step 2: Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated\n');

  // Step 3: Push schema changes (ensure database is up to date)
  console.log('📋 Pushing schema changes...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Schema updated\n');

  // Step 4: Run main seed (users, patients, appointments, medicines, etc.)
  console.log('🌱 Running main database seed...');
  try {
    execSync('npm run db:seed', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  npm run db:seed failed, trying direct execution...');
    execSync('node -r esbuild-register lib/seed.ts', { stdio: 'inherit' });
  }
  console.log('✅ Main seed complete\n');

  // Step 5: Run IPD seed
  console.log('🏥 Running IPD seed (wards, bed types, beds)...');
  try {
    execSync('node -r esbuild-register lib/ipd-seed.ts', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  esbuild-register failed, trying ts-node...');
    try {
      execSync('npx ts-node lib/ipd-seed.ts', { stdio: 'inherit' });
    } catch (tsError) {
      console.log('⚠️  ts-node failed, trying direct node execution...');
      execSync('node lib/ipd-seed.js', { stdio: 'inherit' });
    }
  }
  console.log('✅ IPD seed complete\n');

  // Step 6: Run permissions seed
  console.log('🔐 Running permissions seed...');
  try {
    execSync('node -r esbuild-register lib/permissions-seed.ts', { stdio: 'inherit' });
  } catch (error) {
    try {
      execSync('npx ts-node lib/permissions-seed.ts', { stdio: 'inherit' });
    } catch (tsError) {
      execSync('node lib/permissions-seed.js', { stdio: 'inherit' });
    }
  }
  console.log('✅ Permissions seed complete\n');

  // Step 7: Run problem categories seed
  console.log('📋 Running problem categories seed...');
  try {
    execSync('node -r esbuild-register lib/problem-categories-seed.ts', { stdio: 'inherit' });
  } catch (error) {
    try {
      execSync('npx ts-node lib/problem-categories-seed.ts', { stdio: 'inherit' });
    } catch (tsError) {
      execSync('node lib/problem-categories-seed.js', { stdio: 'inherit' });
    }
  }
  console.log('✅ Problem categories seed complete\n');

  console.log('🎉 Database setup completed successfully!\n');
  console.log('=' .repeat(60));
  console.log('📊 DATABASE SUMMARY:');
  console.log('=' .repeat(60));
  console.log('👤 LOGIN CREDENTIALS:');
  console.log('   🔑 Admin: admin@hospital.com / admin123');
  console.log('   👨‍⚕️  Doctor: doctor@hospital.com / doctor123');
  console.log('   📝 Receptionist: reception@hospital.com / reception123');
  console.log('   👩‍⚕️  Nurse: nurse.mary@hospital.com / nurse123');
  console.log('   👨‍⚕️  Additional Doctors:');
  console.log('      - Dr. Sarah: dr.sarah@hospital.com / doctor123');
  console.log('      - Dr. Michael: dr.michael@hospital.com / doctor123');
  console.log('      - Dr. Rajesh: dr.rajesh@hospital.com / doctor123');
  console.log('      - Dr. Priya: dr.priya@hospital.com / doctor123');
  console.log();
  console.log('🏥 SEEDED DATA INCLUDES:');
  console.log('   • Users & Staff (Doctors, Nurses, Receptionists, Admin)');
  console.log('   • Patients (15+ sample patients with Indian names)');
  console.log('   • Appointments (25+ sample appointments with various statuses)');
  console.log('   • Medicines (Indian brands + generic medicines)');
  console.log('   • IPD Setup (6 wards: General, Semi-Private, Private, ICU, Pediatric, Maternity)');
  console.log('   • Bed Types & Beds (60+ beds across all wards)');
  console.log('   • Consultation Fees (for all doctors)');
  console.log('   • Hospital Settings');
  console.log('   • Permissions & Custom Roles');
  console.log('   • Problem Categories (25+ medical categories)');
  console.log('   • Sample Prescriptions');
  console.log();
  console.log('🚀 Your Hospital Management System is ready to use!');
  console.log('📱 Visit http://localhost:3000 to access the system');
  console.log('=' .repeat(60));

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  console.error('\n🔧 Troubleshooting Tips:');
  console.error('1. Make sure PostgreSQL is running');
  console.error('2. Check DATABASE_URL in your .env file');
  console.error('3. Ensure you have proper database permissions');
  console.error('4. Try running with --force flag to reset everything');
  console.error('5. Check that all dependencies are installed: npm install');
  process.exit(1);
}
