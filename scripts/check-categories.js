const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkCategories() {
    const client = await pool.connect();
    try {
        console.log('🔍 Checking existing categories...');
        const result = await client.query('SELECT id, name FROM medicine_categories ORDER BY name');
        console.log('\nExisting categories:');
        result.rows.forEach(cat => {
            console.log(`   ${cat.id} - ${cat.name}`);
        });
        console.log(`\nTotal: ${result.rows.length} categories`);
    } finally {
        client.release();
        await pool.end();
    }
}

checkCategories();
