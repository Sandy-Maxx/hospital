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
        ];\n        \n        for (const sql of missingColumns) {\n            console.log('Adding column...', sql.split('ADD COLUMN IF NOT EXISTS ')[1]?.split(' ')[0] || 'column');\n            await client.query(sql);\n        }\n        \n        // Update the medicines table to have proper values\n        console.log('🔄 Setting default values for existing records...');\n        \n        // First, get a default category and gst slab ID if they exist\n        const categoryResult = await client.query('SELECT id FROM medicine_categories LIMIT 1');\n        const gstResult = await client.query('SELECT id FROM gst_slabs WHERE rate = 5.0 LIMIT 1');\n        \n        if (categoryResult.rows.length > 0 && gstResult.rows.length > 0) {\n            const defaultCategoryId = categoryResult.rows[0].id;\n            const defaultGstSlabId = gstResult.rows[0].id;\n            \n            await client.query(`\n                UPDATE medicines \n                SET \n                    brand = COALESCE(brand, name),\n                    \"categoryId\" = COALESCE(\"categoryId\", $1),\n                    \"gstSlabId\" = COALESCE(\"gstSlabId\", $2),\n                    \"unitType\" = COALESCE(\"unitType\", 'Unit'),\n                    mrp = COALESCE(mrp, 10.0),\n                    \"purchasePrice\" = COALESCE(\"purchasePrice\", 8.0),\n                    \"marginPercentage\" = COALESCE(\"marginPercentage\", 25.0)\n                WHERE \"categoryId\" IS NULL OR \"gstSlabId\" IS NULL\n            `, [defaultCategoryId, defaultGstSlabId]);\n            \n            console.log('✅ Updated existing records with default values');\n        }\n        \n        // Add foreign key constraints (only if the referenced tables exist)\n        try {\n            await client.query('ALTER TABLE medicines ADD CONSTRAINT fk_medicines_category FOREIGN KEY (\"categoryId\") REFERENCES medicine_categories(id) ON DELETE SET NULL');\n            console.log('✅ Added category foreign key constraint');\n        } catch (e) {\n            console.log('⚠️  Category foreign key constraint already exists or failed:', e.message);\n        }\n        \n        try {\n            await client.query('ALTER TABLE medicines ADD CONSTRAINT fk_medicines_gst_slab FOREIGN KEY (\"gstSlabId\") REFERENCES gst_slabs(id) ON DELETE SET NULL');\n            console.log('✅ Added GST slab foreign key constraint');\n        } catch (e) {\n            console.log('⚠️  GST slab foreign key constraint already exists or failed:', e.message);\n        }\n        \n        await client.query('COMMIT');\n        console.log('✅ Medicines table migration completed successfully!');\n        \n        // Show updated structure\n        const result = await client.query(`\n            SELECT column_name, data_type, is_nullable\n            FROM information_schema.columns \n            WHERE table_schema = 'public' \n            AND table_name = 'medicines'\n            ORDER BY ordinal_position\n        `);\n        \n        console.log('\\n📋 Updated medicines table columns:');\n        result.rows.forEach(row => {\n            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);\n        });\n        \n    } catch (error) {\n        await client.query('ROLLBACK');\n        console.error('❌ Migration failed:', error.message);\n        throw error;\n    } finally {\n        client.release();\n    }\n}\n\nasync function main() {\n    try {\n        await migrateMedicinesTable();\n        console.log('\\n🎉 Migration completed!');\n    } catch (error) {\n        console.error('❌ Migration failed:', error.message);\n        process.exit(1);\n    } finally {\n        await pool.end();\n    }\n}\n\nmain();
