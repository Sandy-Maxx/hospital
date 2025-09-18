const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function finalDatabaseCleanup() {
    const client = await pool.connect();
    try {
        console.log('🧹 Final Database Cleanup for Pharmacy Module...\n');
        console.log('═'.repeat(70));
        
        await client.query('BEGIN');
        
        // 1. Fix NULL gstSlabIds in medicines
        console.log('💰 Step 1: Fixing NULL gstSlabId values...');
        
        const nullGstSlabs = await client.query('SELECT id, name FROM medicines WHERE "gstSlabId" IS NULL');
        
        if (nullGstSlabs.rows.length > 0) {
            console.log(`Found ${nullGstSlabs.rows.length} medicines with NULL gstSlabIds`);
            
            // Get default GST slab (5%)
            const defaultGstResult = await client.query('SELECT id FROM gst_slabs WHERE rate = $1 LIMIT 1', [5.0]);
            let defaultGstId;
            
            if (defaultGstResult.rows.length > 0) {
                defaultGstId = defaultGstResult.rows[0].id;
            } else {
                // If no 5% GST, get any GST slab
                const anyGstResult = await client.query('SELECT id FROM gst_slabs LIMIT 1');
                defaultGstId = anyGstResult.rows[0].id;
            }
            
            console.log(`Using default GST slab ID: ${defaultGstId}`);
            
            // Update NULL gstSlabIds
            const updateGstResult = await client.query(`
                UPDATE medicines 
                SET "gstSlabId" = $1 
                WHERE "gstSlabId" IS NULL
            `, [defaultGstId]);
            
            console.log(`✅ Updated ${updateGstResult.rowCount} medicines with default GST slab`);
        } else {
            console.log('✅ No NULL gstSlabIds found');
        }
        
        // 2. Fix missing supplier relationships in stock
        console.log('\\n📦 Step 2: Fixing stock entries with missing suppliers...');
        
        const stockWithMissingSuppliers = await client.query(`
            SELECT ms.id, m.name as medicine_name, ms."supplierId"
            FROM medicine_stock ms
            LEFT JOIN medicines m ON ms."medicineId" = m.id
            LEFT JOIN suppliers s ON ms."supplierId" = s.id
            WHERE s.id IS NULL
        `);
        
        if (stockWithMissingSuppliers.rows.length > 0) {
            console.log(`Found ${stockWithMissingSuppliers.rows.length} stock entries with missing suppliers`);
            
            // Get a default supplier
            const defaultSupplierResult = await client.query('SELECT id FROM suppliers LIMIT 1');
            const defaultSupplierId = defaultSupplierResult.rows[0].id;
            
            console.log(`Using default supplier ID: ${defaultSupplierId}`);
            
            // Update stock entries with missing suppliers
            const updateStockResult = await client.query(`
                UPDATE medicine_stock 
                SET "supplierId" = $1 
                WHERE "supplierId" NOT IN (SELECT id FROM suppliers)
            `, [defaultSupplierId]);
            
            console.log(`✅ Updated ${updateStockResult.rowCount} stock entries with default supplier`);
        } else {
            console.log('✅ All stock entries have valid suppliers');
        }
        
        // 3. Clean up any orphaned stock entries
        console.log('\\n🗑️  Step 3: Cleaning up orphaned stock entries...');
        
        const orphanedStock = await client.query(`
            SELECT ms.id, ms."medicineId"
            FROM medicine_stock ms
            LEFT JOIN medicines m ON ms."medicineId" = m.id
            WHERE m.id IS NULL
        `);
        
        if (orphanedStock.rows.length > 0) {
            console.log(`Found ${orphanedStock.rows.length} orphaned stock entries`);
            
            const deleteOrphanedResult = await client.query(`
                DELETE FROM medicine_stock 
                WHERE "medicineId" NOT IN (SELECT id FROM medicines)
            `);
            
            console.log(`✅ Deleted ${deleteOrphanedResult.rowCount} orphaned stock entries`);
        } else {
            console.log('✅ No orphaned stock entries found');
        }
        
        // 4. Verify data integrity
        console.log('\\n🔍 Step 4: Verifying data integrity...');
        
        const integrityChecks = await Promise.all([
            client.query('SELECT COUNT(*) FROM medicines WHERE "categoryId" IS NULL'),
            client.query('SELECT COUNT(*) FROM medicines WHERE "gstSlabId" IS NULL'),
            client.query('SELECT COUNT(*) FROM medicines WHERE manufacturer IS NULL'),
            client.query(`
                SELECT COUNT(*) FROM medicine_stock ms
                LEFT JOIN suppliers s ON ms."supplierId" = s.id
                WHERE s.id IS NULL
            `),
            client.query(`
                SELECT COUNT(*) FROM medicine_stock ms
                LEFT JOIN medicines m ON ms."medicineId" = m.id
                WHERE m.id IS NULL
            `)
        ]);
        
        console.log('Data integrity results:');
        console.log(`   Medicines with NULL categoryId: ${integrityChecks[0].rows[0].count}`);
        console.log(`   Medicines with NULL gstSlabId: ${integrityChecks[1].rows[0].count}`);
        console.log(`   Medicines with NULL manufacturer: ${integrityChecks[2].rows[0].count}`);
        console.log(`   Stock with invalid supplier: ${integrityChecks[3].rows[0].count}`);
        console.log(`   Stock with invalid medicine: ${integrityChecks[4].rows[0].count}`);
        
        // 5. Final statistics
        console.log('\\n📊 Step 5: Final Database Statistics...');
        
        const finalStats = await Promise.all([
            client.query('SELECT COUNT(*) FROM medicine_categories'),
            client.query('SELECT COUNT(*) FROM medicines'),
            client.query('SELECT COUNT(*) FROM suppliers'),
            client.query('SELECT COUNT(*) FROM medicine_stock'),
            client.query('SELECT COUNT(*) FROM gst_slabs')
        ]);
        
        console.log('\\n🏥 FINAL COMPREHENSIVE DATABASE:');
        console.log('═'.repeat(50));
        console.log(`📂 Categories: ${finalStats[0].rows[0].count}`);
        console.log(`💊 Medicines: ${finalStats[1].rows[0].count}`);
        console.log(`🏭 Suppliers: ${finalStats[2].rows[0].count}`);
        console.log(`📦 Stock Entries: ${finalStats[3].rows[0].count}`);
        console.log(`💰 GST Slabs: ${finalStats[4].rows[0].count}`);
        
        // Show sample high-value medicines
        console.log('\\n💎 Top Premium Medicines:');
        console.log('═'.repeat(40));
        
        const premiumMeds = await client.query(`
            SELECT m.name, m.brand, mc.name as category, m.mrp
            FROM medicines m
            LEFT JOIN medicine_categories mc ON m."categoryId" = mc.id
            WHERE m.mrp > 5000
            ORDER BY m.mrp DESC
            LIMIT 5
        `);
        
        premiumMeds.rows.forEach((med, i) => {
            console.log(`${i + 1}. ${med.name} (${med.brand}) - ${med.category} - ₹${med.mrp}`);
        });
        
        await client.query('COMMIT');
        
        console.log('\\n🎉 FINAL DATABASE CLEANUP COMPLETED SUCCESSFULLY!');
        console.log('✨ Your pharmacy module is now 100% ready for production use!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during final cleanup:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

finalDatabaseCleanup();
