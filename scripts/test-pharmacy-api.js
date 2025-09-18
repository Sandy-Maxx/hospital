const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPharmacyAPI() {
    try {
        console.log('🧪 Testing pharmacy APIs directly...');
        
        // Test 1: Count medicines
        console.log('\n1. Testing medicine count...');
        const medicineCount = await prisma.medicine.count();
        console.log(`   Medicines in DB: ${medicineCount}`);
        
        // Test 2: Fetch medicines with relations
        console.log('\n2. Testing medicine fetch with relations...');
        const medicines = await prisma.medicine.findMany({
            take: 3,
            include: {
                category: true,
                gstSlab: true,
                stocks: {
                    select: {
                        availableQuantity: true,
                        expiryDate: true,
                        batchNumber: true,
                    },
                    where: {
                        isActive: true,
                        availableQuantity: { gt: 0 },
                    },
                    orderBy: { expiryDate: 'asc' },
                },
            },
        });
        
        console.log('   Sample medicines:');
        medicines.forEach((med, i) => {
            console.log(`   ${i + 1}. ${med.name} (${med.brand})`);
            console.log(`      Category: ${med.category?.name || 'N/A'}`);
            console.log(`      GST: ${med.gstSlab?.rate || 'N/A'}%`);
            console.log(`      Stock entries: ${med.stocks.length}`);
        });
        
        // Test 3: Count stock entries
        console.log('\n3. Testing stock count...');
        const stockCount = await prisma.medicineStock.count();
        console.log(`   Stock entries in DB: ${stockCount}`);
        
        // Test 4: Fetch stock with relations
        console.log('\n4. Testing stock fetch with relations...');
        const stocks = await prisma.medicineStock.findMany({
            take: 3,
            include: {
                medicine: {
                    select: {
                        id: true,
                        name: true,
                        brand: true,
                        manufacturer: true,
                        dosageForm: true,
                        strength: true,
                        category: { select: { name: true } },
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        });
        
        console.log('   Sample stock entries:');
        stocks.forEach((stock, i) => {
            console.log(`   ${i + 1}. ${stock.medicine.name} - Batch: ${stock.batchNumber}`);
            console.log(`      Available: ${stock.availableQuantity}`);
            console.log(`      Supplier: ${stock.supplier.name}`);
            console.log(`      Expiry: ${stock.expiryDate.toDateString()}`);
        });
        
        console.log('\n✅ All pharmacy API tests passed!');
        
    } catch (error) {
        console.error('❌ Pharmacy API test failed:', error);
        console.error('Error details:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
    } finally {
        await prisma.$disconnect();
    }
}

testPharmacyAPI();
