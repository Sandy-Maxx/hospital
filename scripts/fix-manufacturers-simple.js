const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixManufacturers() {
    const client = await pool.connect();
    try {
        console.log('🔧 Fixing NULL manufacturer values...\n');
        
        // Update NULL manufacturers with default values
        const updateResult = await client.query(`
            UPDATE medicines 
            SET manufacturer = 'Generic Pharma Ltd' 
            WHERE manufacturer IS NULL
        `);
        
        console.log(`✅ Updated ${updateResult.rowCount} medicines with default manufacturer`);
        
        // Verify the fix
        const verifyResult = await client.query('SELECT COUNT(*) FROM medicines WHERE manufacturer IS NULL');
        console.log(`📊 Medicines with NULL manufacturer: ${verifyResult.rows[0].count}`);
        
        if (parseInt(verifyResult.rows[0].count) === 0) {
            console.log('🎉 All NULL manufacturer values have been fixed!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixManufacturers();
