const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateMedicinesTable() {
    const client = await pool.connect();
    try {
        console.log('🔄 Migrating medicines table to new schema...');
        
        await client.query('BEGIN');
        
        // Add missing columns to medicines table
        const missingColumns = [
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS brand VARCHAR DEFAULT \'Unknown\'',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS "categoryId" VARCHAR',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS "gstSlabId" VARCHAR',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS "unitType" VARCHAR DEFAULT \'Unit\'',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS mrp DECIMAL DEFAULT 0',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS "purchasePrice" DECIMAL DEFAULT 0',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS "marginPercentage" DECIMAL DEFAULT 0',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS "prescriptionRequired" BOOLEAN DEFAULT true',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS description TEXT',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS "sideEffects" TEXT',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS contraindications TEXT',
            'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS "dosageInstructions" TEXT'
        ];
        
        for (const sql of missingColumns) {
            console.log('Adding column...', sql.split('ADD COLUMN IF NOT EXISTS ')[1]?.split(' ')[0] || 'column');
            await client.query(sql);
        }
        
        // Update the medicines table to have proper values
        console.log('🔄 Setting default values for existing records...');
        
        // First, get a default category and gst slab ID if they exist
        const categoryResult = await client.query('SELECT id FROM medicine_categories LIMIT 1');
        const gstResult = await client.query('SELECT id FROM gst_slabs WHERE rate = 5.0 LIMIT 1');
        
        if (categoryResult.rows.length > 0 && gstResult.rows.length > 0) {
            const defaultCategoryId = categoryResult.rows[0].id;
            const defaultGstSlabId = gstResult.rows[0].id;
            
            await client.query(`
                UPDATE medicines 
                SET 
                    brand = COALESCE(brand, name),
                    "categoryId" = COALESCE("categoryId", $1),
                    "gstSlabId" = COALESCE("gstSlabId", $2),
                    "unitType" = COALESCE("unitType", 'Unit'),
                    mrp = COALESCE(mrp, 10.0),
                    "purchasePrice" = COALESCE("purchasePrice", 8.0),
                    "marginPercentage" = COALESCE("marginPercentage", 25.0)
                WHERE "categoryId" IS NULL OR "gstSlabId" IS NULL
            `, [defaultCategoryId, defaultGstSlabId]);
            
            console.log('✅ Updated existing records with default values');
        }
        
        // Add foreign key constraints (only if the referenced tables exist)
        try {
            await client.query('ALTER TABLE medicines ADD CONSTRAINT fk_medicines_category FOREIGN KEY ("categoryId") REFERENCES medicine_categories(id) ON DELETE SET NULL');
            console.log('✅ Added category foreign key constraint');
        } catch (e) {
            console.log('⚠️  Category foreign key constraint already exists or failed:', e.message);
        }
        
        try {
            await client.query('ALTER TABLE medicines ADD CONSTRAINT fk_medicines_gst_slab FOREIGN KEY ("gstSlabId") REFERENCES gst_slabs(id) ON DELETE SET NULL');
            console.log('✅ Added GST slab foreign key constraint');
        } catch (e) {
            console.log('⚠️  GST slab foreign key constraint already exists or failed:', e.message);
        }
        
        await client.query('COMMIT');
        console.log('✅ Medicines table migration completed successfully!');
        
        // Show updated structure
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'medicines'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Updated medicines table columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await migrateMedicinesTable();
        console.log('\n🎉 Migration completed!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
