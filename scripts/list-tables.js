const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function listTables() {
    const client = await pool.connect();
    try {
        console.log('📋 All tables in public schema:');
        
        const result = await client.query(`
            SELECT table_name, table_type
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name} (${row.table_type})`);
        });
        
        console.log(`\nTotal: ${result.rows.length} tables`);
        
        // Check if any pharmacy-related tables exist
        const pharmacyTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%medicine%' OR table_name LIKE '%gst%' OR table_name LIKE '%supplier%')
            ORDER BY table_name
        `);
        
        console.log('\n💊 Pharmacy-related tables:');
        if (pharmacyTables.rows.length > 0) {
            pharmacyTables.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        } else {
            console.log('  None found');
        }
        
    } finally {
        client.release();
        await pool.end();
    }
}

listTables().catch(console.error);
