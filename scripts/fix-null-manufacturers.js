const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixNullManufacturers() {
    const client = await pool.connect();
    try {
        console.log('🔧 Fixing NULL manufacturer values...\n');
        
        await client.query('BEGIN');
        
        // Find medicines with NULL manufacturers
        const nullManufacturers = await client.query('SELECT id, name FROM medicines WHERE manufacturer IS NULL');
        
        if (nullManufacturers.rows.length > 0) {
            console.log(`Found ${nullManufacturers.rows.length} medicines with NULL manufacturers:`);
            nullManufacturers.rows.forEach(med => {
                console.log(`   • ${med.name} (ID: ${med.id})`);
            });
            
            // Update NULL manufacturers with default values
            const updateResult = await client.query(`
                UPDATE medicines 
                SET manufacturer = 'Generic Pharma Ltd' 
                WHERE manufacturer IS NULL
            `);
            
            console.log(`\n✅ Updated ${updateResult.rowCount} medicines with default manufacturer`);
        } else {
            console.log('✅ No NULL manufacturers found in medicines table');
        }
        
        // Check for NULL manufacturers in stock
        const nullStockManufacturers = await client.query(`
            SELECT ms.id, m.name as medicine_name 
            FROM medicine_stock ms
            LEFT JOIN medicines m ON ms."medicineId" = m.id
            WHERE ms.manufacturer IS NULL
        `);
        
        if (nullStockManufacturers.rows.length > 0) {
            console.log(`\nFound ${nullStockManufacturers.rows.length} stock entries with NULL manufacturers:`);
            nullStockManufacturers.rows.forEach(stock => {
                console.log(`   • Stock for ${stock.medicine_name} (Stock ID: ${stock.id})`);
            });
            
            // Update NULL manufacturers in stock
            const updateStockResult = await client.query(`
                UPDATE medicine_stock 
                SET manufacturer = 'Generic Pharma Ltd' 
                WHERE manufacturer IS NULL
            `);
            
            console.log(`\n✅ Updated ${updateStockResult.rowCount} stock entries with default manufacturer`);
        } else {
            console.log('\n✅ No NULL manufacturers found in stock table');
        }
        
        // Verify the fix
        const verifyMedicines = await client.query('SELECT COUNT(*) FROM medicines WHERE manufacturer IS NULL');
        const verifyStock = await client.query('SELECT COUNT(*) FROM medicine_stock WHERE manufacturer IS NULL');
        
        console.log('\n📊 Verification:');
        console.log(`   Medicines with NULL manufacturer: ${verifyMedicines.rows[0].count}`);
        console.log(`   Stock entries with NULL manufacturer: ${verifyStock.rows[0].count}`);
        
        if (parseInt(verifyMedicines.rows[0].count) === 0 && parseInt(verifyStock.rows[0].count) === 0) {
            console.log('\n🎉 All NULL manufacturer values have been fixed!');
        } else {
            console.log('\n⚠️  Some NULL values still remain');
        }
        
        await client.query('COMMIT');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing NULL manufacturers:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixNullManufacturers();
