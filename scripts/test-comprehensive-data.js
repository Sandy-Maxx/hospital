const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testComprehensiveData() {
    const client = await pool.connect();
    try {
        console.log('🧪 Testing Comprehensive Medicine Data...\n');
        
        // Test comprehensive medicine data
        const result = await client.query(`
            SELECT 
                m.name,
                m.brand,
                m."genericName",
                mc.name as category,
                gs.rate as gst_rate,
                m.mrp,
                m."prescriptionRequired",
                m.description
            FROM medicines m
            LEFT JOIN medicine_categories mc ON m."categoryId" = mc.id
            LEFT JOIN gst_slabs gs ON m."gstSlabId" = gs.id
            ORDER BY m.mrp DESC
            LIMIT 10
        `);
        
        console.log('Top 10 Most Expensive Medicines:');
        console.log('═'.repeat(80));
        result.rows.forEach((med, i) => {
            const rx = med.prescriptionRequired ? '🔐 Rx' : '💊 OTC';
            console.log(`${i + 1}. ${med.name} (${med.brand})`);
            console.log(`   Generic: ${med.genericName}`);
            console.log(`   Category: ${med.category} | GST: ${med.gst_rate}% | MRP: ₹${med.mrp} | ${rx}`);
            console.log(`   Description: ${med.description}`);
            console.log('');
        });
        
        // Test category distribution
        const categoryStats = await client.query(`
            SELECT 
                mc.name as category,
                COUNT(m.id) as medicine_count,
                AVG(m.mrp) as avg_price,
                MIN(m.mrp) as min_price,
                MAX(m.mrp) as max_price
            FROM medicine_categories mc
            LEFT JOIN medicines m ON mc.id = m."categoryId"
            GROUP BY mc.id, mc.name
            ORDER BY medicine_count DESC
        `);
        
        console.log('📊 Medicine Distribution by Category:');
        console.log('═'.repeat(80));
        categoryStats.rows.forEach(cat => {
            if (cat.medicine_count > 0) {
                console.log(`${cat.category}: ${cat.medicine_count} medicines`);
                console.log(`   Price Range: ₹${parseFloat(cat.min_price).toFixed(2)} - ₹${parseFloat(cat.max_price).toFixed(2)}`);
                console.log(`   Average Price: ₹${parseFloat(cat.avg_price).toFixed(2)}`);
                console.log('');
            }
        });
        
        // Test high-value medicines by category
        console.log('💎 Premium Medicines by Specialty:');
        console.log('═'.repeat(80));
        
        const premiumMeds = await client.query(`
            SELECT 
                m.name,
                m.brand,
                mc.name as category,
                m.mrp,
                m.description
            FROM medicines m
            LEFT JOIN medicine_categories mc ON m."categoryId" = mc.id
            WHERE m.mrp > 1000
            ORDER BY mc.name, m.mrp DESC
        `);
        
        let currentCategory = '';
        premiumMeds.rows.forEach(med => {
            if (med.category !== currentCategory) {
                currentCategory = med.category;
                console.log(`\n📂 ${currentCategory}:`);
            }
            console.log(`   • ${med.name} (${med.brand}) - ₹${med.mrp}`);
            console.log(`     ${med.description}`);
        });
        
    } finally {
        client.release();
        await pool.end();
    }
}

testComprehensiveData();
