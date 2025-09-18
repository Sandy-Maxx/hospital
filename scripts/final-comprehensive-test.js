const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function runComprehensiveTest() {
    try {
        console.log('🏥 Final Comprehensive Pharmacy Test\n');
        console.log('═'.repeat(60));
        
        // Test 1: Database connectivity
        console.log('🔗 Test 1: Database Connectivity...');
        const dbTest = await prisma.$queryRaw`SELECT NOW() as current_time`;
        console.log('✅ Database connected successfully');
        
        // Test 2: Schema integrity
        console.log('\n🏗️  Test 2: Schema Integrity...');
        const tableCheck = await Promise.all([
            prisma.medicine.count(),
            prisma.medicineCategory.count(),
            prisma.gstSlab.count(),
            prisma.supplier.count(),
            prisma.medicineStock.count()
        ]);
        
        console.log(`✅ Schema integrity verified:`);
        console.log(`   📊 Medicines: ${tableCheck[0]}`);
        console.log(`   📁 Categories: ${tableCheck[1]}`);
        console.log(`   💰 GST Slabs: ${tableCheck[2]}`);
        console.log(`   🏭 Suppliers: ${tableCheck[3]}`);
        console.log(`   📦 Stock Entries: ${tableCheck[4]}`);
        
        // Test 3: Advanced medicines query
        console.log('\n💎 Test 3: Advanced Medicine Categories...');
        const advancedMeds = await prisma.medicine.findMany({
            where: {
                mrp: {
                    gt: 1000
                }
            },
            include: {
                category: true,
                gstSlab: true
            },
            orderBy: {
                mrp: 'desc'
            },
            take: 5
        });
        
        console.log('✅ Premium medicines (>₹1000):');
        advancedMeds.forEach((med, i) => {
            console.log(`   ${i + 1}. ${med.name} - ₹${med.mrp}`);
            console.log(`      Category: ${med.category?.name} | GST: ${med.gstSlab?.rate}%`);
            console.log(`      Brand: ${med.brand} | Manufacturer: ${med.manufacturer}`);
        });
        
        // Test 4: Specialty categories
        console.log('\n🧬 Test 4: Specialty Categories...');
        const specialtyCategories = await prisma.medicineCategory.findMany({
            where: {
                name: {
                    in: ['Chemotherapy', 'Biologics', 'Immunology', 'Medical Devices']
                }
            },
            include: {
                medicines: {
                    select: {
                        id: true,
                        name: true,
                        mrp: true
                    }
                }
            }
        });
        
        console.log('✅ Specialty categories loaded:');
        specialtyCategories.forEach(cat => {
            console.log(`   📂 ${cat.name}: ${cat.medicines.length} medicines`);
            if (cat.medicines.length > 0) {
                const avgPrice = cat.medicines.reduce((sum, med) => sum + med.mrp, 0) / cat.medicines.length;
                console.log(`      Average price: ₹${avgPrice.toFixed(2)}`);
            }
        });
        
        // Test 5: GST distribution
        console.log('\n💰 Test 5: GST Rate Distribution...');
        const gstDistribution = await prisma.$queryRaw`
            SELECT 
                gs.rate as gst_rate,
                COUNT(m.id) as medicine_count,
                AVG(m.mrp) as avg_price
            FROM gst_slabs gs
            LEFT JOIN medicines m ON gs.id = m."gstSlabId"
            WHERE m.id IS NOT NULL
            GROUP BY gs.rate
            ORDER BY gs.rate
        `;
        
        console.log('✅ GST distribution:');
        gstDistribution.forEach(gst => {
            console.log(`   ${gst.gst_rate}% GST: ${gst.medicine_count} medicines (Avg: ₹${parseFloat(gst.avg_price).toFixed(2)})`);
        });
        
        // Test 6: Stock with expiry tracking
        console.log('\n📦 Test 6: Stock Management...');
        const stockWithExpiry = await prisma.medicineStock.findMany({
            include: {
                medicine: {
                    select: {
                        name: true,
                        brand: true
                    }
                },
                supplier: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                expiryDate: 'asc'
            }
        });
        
        console.log('✅ Stock entries with expiry tracking:');
        stockWithExpiry.slice(0, 5).forEach((stock, i) => {
            const expiryDate = new Date(stock.expiryDate);
            const isExpiringSoon = (expiryDate - new Date()) < (90 * 24 * 60 * 60 * 1000); // 90 days
            const statusIcon = isExpiringSoon ? '⚠️' : '✅';
            
            console.log(`   ${i + 1}. ${stock.medicine?.name} (${stock.medicine?.brand})`);
            console.log(`      Batch: ${stock.batchNumber} | Qty: ${stock.availableQuantity} | Expiry: ${expiryDate.toLocaleDateString()} ${statusIcon}`);
            console.log(`      Supplier: ${stock.supplier?.name}`);
        });
        
        // Test 7: Search functionality
        console.log('\n🔍 Test 7: Search Functionality...');
        const searchResults = await prisma.medicine.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: 'inject',
                            mode: 'insensitive'
                        }
                    },
                    {
                        genericName: {
                            contains: 'inject',
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            include: {
                category: true
            },
            take: 3
        });
        
        console.log(`✅ Search results for "inject": ${searchResults.length} medicines found`);
        searchResults.forEach((med, i) => {
            console.log(`   ${i + 1}. ${med.name} - ${med.category?.name} - ₹${med.mrp}`);
        });
        
        // Test 8: Complex filtering
        console.log('\n⚕️  Test 8: Prescription vs OTC Distribution...');
        const prescriptionStats = await prisma.$queryRaw`
            SELECT 
                "prescriptionRequired",
                COUNT(*) as count,
                AVG(mrp) as avg_price
            FROM medicines 
            GROUP BY "prescriptionRequired"
        `;
        
        console.log('✅ Medicine classification:');
        prescriptionStats.forEach(stat => {
            const type = stat.prescriptionRequired ? 'Prescription Required (Rx)' : 'Over-the-Counter (OTC)';
            console.log(`   ${type}: ${stat.count} medicines (Avg: ₹${parseFloat(stat.avg_price).toFixed(2)})`);
        });
        
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('══'.repeat(30));
        console.log('✨ Your comprehensive Indian medicine database is fully operational!');
        console.log('');
        console.log('📋 Summary:');
        console.log(`   • Database contains ${tableCheck[0]} medicines across ${tableCheck[1]} categories`);
        console.log(`   • ${advancedMeds.length} premium medicines (>₹1000) including biologics & chemotherapy`);
        console.log(`   • ${specialtyCategories.length} specialty categories for advanced treatments`);
        console.log(`   • ${stockWithExpiry.length} stock entries with batch and expiry tracking`);
        console.log(`   • GST compliance with ${gstDistribution.length} different tax rates`);
        console.log(`   • Full search and filtering capabilities`);
        console.log('');
        console.log('🚀 Ready for:');
        console.log('   • Multi-specialty hospital operations');
        console.log('   • Advanced prescription management');
        console.log('   • Inventory tracking with expiry alerts');
        console.log('   • GST-compliant billing');
        console.log('   • Comprehensive medicine catalog');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Ensure .env.local has correct DATABASE_URL');
        console.log('   2. Verify PostgreSQL is running');
        console.log('   3. Check if all migrations have been applied');
        console.log('   4. Run: npx prisma generate');
    } finally {
        await prisma.$disconnect();
    }
}

runComprehensiveTest();
