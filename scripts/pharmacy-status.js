const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkPharmacyStatus() {
    const client = await pool.connect();
    try {
        console.log('🏥 PHARMACY MODULE STATUS REPORT');
        console.log('=====================================');
        
        // 1. Check database tables
        console.log('\n📋 1. DATABASE TABLES:');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('gst_slabs', 'medicine_categories', 'suppliers', 'medicines', 'medicine_stock')
            ORDER BY table_name
        `);
        
        tables.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
        });
        
        if (tables.rows.length !== 5) {
            console.log('   ⚠️  Some tables missing!');
        }
        
        // 2. Check data counts
        console.log('\n📊 2. DATA COUNTS:');
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM gst_slabs'),
            client.query('SELECT COUNT(*) FROM medicine_categories'),
            client.query('SELECT COUNT(*) FROM suppliers'),
            client.query('SELECT COUNT(*) FROM medicines'),
            client.query('SELECT COUNT(*) FROM medicine_stock')
        ]);
        
        console.log(`   GST Slabs: ${counts[0].rows[0].count}`);
        console.log(`   Categories: ${counts[1].rows[0].count}`);
        console.log(`   Suppliers: ${counts[2].rows[0].count}`);
        console.log(`   Medicines: ${counts[3].rows[0].count}`);
        console.log(`   Stock Entries: ${counts[4].rows[0].count}`);
        
        // 3. Check sample data
        console.log('\n💊 3. SAMPLE MEDICINES:');
        const medicines = await client.query(`
            SELECT m.name, m.brand, mc.name as category_name, gs.rate as gst_rate
            FROM medicines m
            LEFT JOIN medicine_categories mc ON m."categoryId" = mc.id
            LEFT JOIN gst_slabs gs ON m."gstSlabId" = gs.id
            LIMIT 3
        `);
        
        medicines.rows.forEach((med, i) => {
            console.log(`   ${i + 1}. ${med.name || 'N/A'} (${med.brand || 'N/A'})`);
            console.log(`      Category: ${med.category_name || 'N/A'} | GST: ${med.gst_rate || 'N/A'}%`);
        });
        
        // 4. Check medicines table structure
        console.log('\n🔍 4. MEDICINES TABLE STRUCTURE:');
        const structure = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'medicines'
            AND column_name IN ('brand', 'categoryId', 'gstSlabId', 'mrp', 'purchasePrice')
            ORDER BY column_name
        `);
        
        const requiredColumns = ['brand', 'categoryId', 'gstSlabId', 'mrp', 'purchasePrice'];
        const existingColumns = structure.rows.map(r => r.column_name);
        
        requiredColumns.forEach(col => {
            if (existingColumns.includes(col)) {
                console.log(`   ✅ ${col}`);
            } else {
                console.log(`   ❌ ${col} (missing)`);
            }
        });
        
        // 5. API Status (simple check)
        console.log('\n🌐 5. API STATUS:');
        try {
            const http = require('http');
            const testReq = new Promise((resolve) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/test-pharmacy',
                    method: 'GET'
                }, (res) => {
                    resolve(res.statusCode);
                });
                req.on('error', () => resolve('ERROR'));
                req.setTimeout(2000, () => resolve('TIMEOUT'));
                req.end();
            });
            
            const status = await testReq;
            console.log(`   Test endpoint: ${status === 200 ? '✅ Working' : `❌ Status ${status}`}`);
            
        } catch (e) {
            console.log('   Test endpoint: ❌ Could not connect');
        }
        
        // 6. Summary
        console.log('\n🎯 6. SUMMARY:');
        const allTablesExist = tables.rows.length === 5;
        const hasData = counts.every(c => parseInt(c.rows[0].count) > 0);
        const hasRequiredColumns = requiredColumns.every(col => existingColumns.includes(col));
        
        if (allTablesExist && hasData && hasRequiredColumns) {
            console.log('   ✅ Pharmacy module is READY!');
            console.log('   💡 If APIs are failing, restart the development server to reload Prisma client.');
        } else {
            console.log('   ❌ Pharmacy module has issues:');
            if (!allTablesExist) console.log('      - Missing database tables');
            if (!hasData) console.log('      - Missing data in tables');
            if (!hasRequiredColumns) console.log('      - Missing required columns');
        }
        
    } finally {
        client.release();
        await pool.end();
    }
}

checkPharmacyStatus().catch(console.error);
