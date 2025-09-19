#!/usr/bin/env node

/**
 * Production Troubleshooting Script
 * This script helps diagnose and fix common production deployment issues
 */

const { PrismaClient } = require('@prisma/client');

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return prisma;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('🔧 Please check your DATABASE_URL environment variable');
    return null;
  }
}

async function checkRequiredTables(prisma) {
  console.log('🔍 Checking required tables...');
  
  const requiredTables = [
    'users',
    'patients', 
    'appointments',
    'bills',
    'prescriptions',
    'medicines',
    'medicine_stock',
    'suppliers',
    'medicine_categories',
    'gst_slabs'
  ];
  
  const missingTables = [];
  
  for (const tableName of requiredTables) {
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `;
      
      const exists = result[0]?.exists;
      if (!exists) {
        missingTables.push(tableName);
        console.log(`❌ Missing table: ${tableName}`);
      } else {
        console.log(`✅ Table exists: ${tableName}`);
      }
    } catch (error) {
      console.error(`❌ Error checking table ${tableName}:`, error.message);
      missingTables.push(tableName);
    }
  }
  
  return missingTables;
}

async function checkPharmacyData(prisma) {
  console.log('🔍 Checking pharmacy data...');
  
  try {
    const medicineCount = await prisma.medicine.count();
    const stockCount = await prisma.medicineStock.count();
    const categoryCount = await prisma.medicineCategory.count();
    const supplierCount = await prisma.supplier.count();
    
    console.log(`📊 Pharmacy Data Summary:`);
    console.log(`   - Medicines: ${medicineCount}`);
    console.log(`   - Stock entries: ${stockCount}`);
    console.log(`   - Categories: ${categoryCount}`);
    console.log(`   - Suppliers: ${supplierCount}`);
    
    if (medicineCount === 0) {
      console.log('⚠️  No medicines found. Consider adding sample data.');
    }
    if (stockCount === 0) {
      console.log('⚠️  No stock entries found. This may cause API errors.');
    }
    
  } catch (error) {
    console.error('❌ Error checking pharmacy data:', error.message);
    console.log('🔧 This suggests missing pharmacy tables. Run migrations.');
  }
}

async function seedBasicPharmacyData(prisma) {
  console.log('🌱 Seeding basic pharmacy data...');
  
  try {
    // Create basic GST slabs
    await prisma.gstSlab.upsert({
      where: { name: '5% GST' },
      update: {},
      create: {
        name: '5% GST',
        rate: 5.0,
        description: 'Essential medicines',
        isActive: true
      }
    });
    
    await prisma.gstSlab.upsert({
      where: { name: '12% GST' },
      update: {},
      create: {
        name: '12% GST',
        rate: 12.0,
        description: 'Standard medicines',
        isActive: true
      }
    });
    
    // Create basic category
    const category = await prisma.medicineCategory.upsert({
      where: { name: 'General' },
      update: {},
      create: {
        name: 'General',
        description: 'General medicines',
        gstRate: 5.0,
        isActive: true
      }
    });
    
    // Create basic supplier
    const supplier = await prisma.supplier.upsert({
      where: { name: 'Default Supplier' },
      update: {},
      create: {
        name: 'Default Supplier',
        contactPerson: 'Manager',
        phone: '+91-9999999999',
        email: 'supplier@example.com',
        isActive: true
      }
    });
    
    console.log('✅ Basic pharmacy data seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding pharmacy data:', error.message);
  }
}

async function runDiagnostics() {
  console.log('🏥 Hospital Management System - Production Diagnostics\n');
  
  // Check database connection
  const prisma = await checkDatabaseConnection();
  if (!prisma) return;
  
  try {
    // Check tables
    const missingTables = await checkRequiredTables(prisma);
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing ${missingTables.length} tables. Run migrations:`);
      console.log('   npx prisma migrate deploy');
      return;
    }
    
    // Check pharmacy data
    await checkPharmacyData(prisma);
    
    // Offer to seed basic data if empty
    const medicineCount = await prisma.medicine.count();
    if (medicineCount === 0) {
      console.log('\n🌱 Would you like to seed basic pharmacy data? (y/N)');
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          await seedBasicPharmacyData(prisma);
        }
        rl.close();
        await prisma.$disconnect();
      });
    } else {
      await prisma.$disconnect();
    }
    
    console.log('\n✅ Diagnostics complete!');
    
  } catch (error) {
    console.error('❌ Diagnostics failed:', error.message);
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = {
  checkDatabaseConnection,
  checkRequiredTables,
  checkPharmacyData,
  seedBasicPharmacyData
};