const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 Setting up Hospital Management System...\n');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} else {
  console.log('✅ Dependencies already installed\n');
}

// Generate Prisma client
console.log('🗄️  Setting up database...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.error('❌ Failed to generate Prisma client');
}

// Push database schema
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema pushed');
} catch (error) {
  console.error('❌ Failed to push database schema');
}

// Seed database
console.log('🌱 Seeding database...');
try {
  execSync('npx tsx lib/seed.ts', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully');
} catch (error) {
  console.error('❌ Failed to seed database');
  console.log('Installing tsx for seeding...');
  try {
    execSync('npm install -g tsx', { stdio: 'inherit' });
    execSync('npx tsx lib/seed.ts', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');
  } catch (seedError) {
    console.error('❌ Failed to seed database even after installing tsx');
  }
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Open: http://localhost:3000');
console.log('3. Login with demo credentials:');
console.log('   - Admin: admin@hospital.com / admin123');
console.log('   - Doctor: doctor@hospital.com / doctor123');
console.log('   - Receptionist: reception@hospital.com / reception123');
console.log('\n🚀 Happy coding!');
