const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkMedicinesTable() {
    const client = await pool.connect();
    try {
        console.log('🔍 Checking medicines table structure...');
        
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'medicines'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Medicines table columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) ${row.column_default ? `[default: ${row.column_default}]` : ''}`);
        });
        
        // Check if there are any records
        const countResult = await client.query('SELECT COUNT(*) FROM medicines');
        console.log(`\n📊 Records in medicines table: ${countResult.rows[0].count}`);
        
    } finally {
        client.release();
        await pool.end();
    }
}

checkMedicinesTable().catch(console.error);
