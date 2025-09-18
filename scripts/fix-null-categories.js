const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixNullCategories() {
    const client = await pool.connect();
    try {
        console.log('🔧 Fixing NULL categoryId values...\n');
        
        // Find medicines with NULL categoryIds
        const nullCategories = await client.query('SELECT id, name FROM medicines WHERE "categoryId" IS NULL');
        
        if (nullCategories.rows.length > 0) {
            console.log(`Found ${nullCategories.rows.length} medicines with NULL categoryIds:`);
            nullCategories.rows.forEach(med => {
                console.log(`   • ${med.name} (ID: ${med.id})`);
            });
            
            // Get a default category ID (Analgesics & Anti-inflammatory)
            const defaultCategoryResult = await client.query('SELECT id FROM medicine_categories WHERE name ILIKE $1 LIMIT 1', ['%analgesic%']);
            let defaultCategoryId;
            
            if (defaultCategoryResult.rows.length > 0) {
                defaultCategoryId = defaultCategoryResult.rows[0].id;
            } else {
                // If no analgesic category, get any category
                const anyCategoryResult = await client.query('SELECT id FROM medicine_categories LIMIT 1');
                defaultCategoryId = anyCategoryResult.rows[0].id;
            }
            
            console.log(`\nUsing default categoryId: ${defaultCategoryId}`);
            
            // Update NULL categoryIds
            const updateResult = await client.query(`
                UPDATE medicines 
                SET "categoryId" = $1 
                WHERE "categoryId" IS NULL
            `, [defaultCategoryId]);
            
            console.log(`\n✅ Updated ${updateResult.rowCount} medicines with default category`);
        } else {
            console.log('✅ No NULL categoryIds found in medicines table');
        }
        
        // Verify the fix
        const verifyResult = await client.query('SELECT COUNT(*) FROM medicines WHERE "categoryId" IS NULL');
        console.log(`📊 Medicines with NULL categoryId: ${verifyResult.rows[0].count}`);
        
        if (parseInt(verifyResult.rows[0].count) === 0) {
            console.log('🎉 All NULL categoryId values have been fixed!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixNullCategories();
