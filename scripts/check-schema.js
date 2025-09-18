const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        console.log('🔍 Checking medicine_stock table schema...\n');
        
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'medicine_stock' 
            ORDER BY ordinal_position
        `);
        
        console.log('medicine_stock table columns:');
        result.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
        });
        
        console.log('\n🔍 Checking medicines table schema...\n');
        
        const medicinesResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'medicines' 
            ORDER BY ordinal_position
        `);
        
        console.log('medicines table columns:');
        medicinesResult.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
        });
        
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
