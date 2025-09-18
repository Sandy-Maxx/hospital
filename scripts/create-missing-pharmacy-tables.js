const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createMissingTables() {
    const client = await pool.connect();
    try {
        console.log('🔍 Creating missing pharmacy tables...');
        
        await client.query('BEGIN');
        
        // Create GST Slabs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS gst_slabs (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR UNIQUE NOT NULL,
                rate DECIMAL NOT NULL,
                description TEXT,
                "isActive" BOOLEAN DEFAULT true,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Created/verified gst_slabs table');
        
        // Create Medicine Categories table
        await client.query(`
            CREATE TABLE IF NOT EXISTS medicine_categories (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR UNIQUE NOT NULL,
                description TEXT,
                "gstRate" DECIMAL DEFAULT 5.0,
                "isActive" BOOLEAN DEFAULT true,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Created/verified medicine_categories table');
        
        // Create Suppliers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR UNIQUE NOT NULL,
                "contactPerson" VARCHAR,
                phone VARCHAR,
                email VARCHAR,
                address TEXT,
                "gstNumber" VARCHAR,
                "creditTerms" INTEGER DEFAULT 30,
                "isActive" BOOLEAN DEFAULT true,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Created/verified suppliers table');
        
        // Create Medicine Stock table (don't reference medicines yet)
        await client.query(`
            CREATE TABLE IF NOT EXISTS medicine_stock (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                "medicineId" VARCHAR NOT NULL,
                "supplierId" VARCHAR NOT NULL,
                "batchNumber" VARCHAR NOT NULL,
                "expiryDate" TIMESTAMP NOT NULL,
                quantity INTEGER NOT NULL,
                "availableQuantity" INTEGER NOT NULL,
                "purchasePrice" DECIMAL NOT NULL,
                mrp DECIMAL NOT NULL,
                "manufacturingDate" TIMESTAMP,
                location VARCHAR,
                "isActive" BOOLEAN DEFAULT true,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Created/verified medicine_stock table');
        
        // Create indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_gst_slabs_rate ON gst_slabs(rate)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_medicine_categories_name ON medicine_categories(name)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_medicine_stock_batch ON medicine_stock("batchNumber")');
        await client.query('CREATE INDEX IF NOT EXISTS idx_medicine_stock_expiry ON medicine_stock("expiryDate")');
        
        await client.query('COMMIT');
        console.log('✅ All missing pharmacy tables created successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await createMissingTables();
        console.log('\n✅ Missing tables creation completed!');
    } catch (error) {
        console.error('❌ Creation failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
