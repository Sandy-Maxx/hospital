const { Pool } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkAndCreateTables() {
    const client = await pool.connect();
    try {
        console.log('🔍 Checking database connection and existing tables...');
        
        // Test connection
        const testResult = await client.query('SELECT NOW() as current_time');
        console.log('✅ Database connected:', testResult.rows[0].current_time);
        
        // Check if any pharmacy tables exist
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('gst_slabs', 'medicine_categories', 'suppliers', 'medicines', 'medicine_stock')
            ORDER BY table_name
        `);
        
        console.log('📋 Existing pharmacy tables:', tableCheck.rows.map(r => r.table_name));
        
        const requiredTables = ['gst_slabs', 'medicine_categories', 'suppliers', 'medicines', 'medicine_stock'];
        const existingTables = tableCheck.rows.map(r => r.table_name);
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
            console.log(`⚠️  Missing tables: ${missingTables.join(', ')}. Creating them...`);
            
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
            console.log('✅ Created gst_slabs table');
            
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
            console.log('✅ Created medicine_categories table');
            
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
            console.log('✅ Created suppliers table');
            
            // Create Medicines table
            await client.query(`
                CREATE TABLE IF NOT EXISTS medicines (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR UNIQUE NOT NULL,
                    "genericName" VARCHAR NOT NULL,
                    brand VARCHAR NOT NULL,
                    manufacturer VARCHAR NOT NULL,
                    "categoryId" VARCHAR NOT NULL,
                    "gstSlabId" VARCHAR NOT NULL,
                    "dosageForm" VARCHAR NOT NULL,
                    strength VARCHAR NOT NULL,
                    "unitType" VARCHAR NOT NULL,
                    mrp DECIMAL NOT NULL,
                    "purchasePrice" DECIMAL NOT NULL,
                    "marginPercentage" DECIMAL,
                    "prescriptionRequired" BOOLEAN DEFAULT true,
                    "isActive" BOOLEAN DEFAULT true,
                    description TEXT,
                    "sideEffects" TEXT,
                    contraindications TEXT,
                    "dosageInstructions" TEXT,
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW(),
                    FOREIGN KEY ("categoryId") REFERENCES medicine_categories(id),
                    FOREIGN KEY ("gstSlabId") REFERENCES gst_slabs(id)
                )
            `);
            console.log('✅ Created medicines table');
            
            // Create Medicine Stock table
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
                    "updatedAt" TIMESTAMP DEFAULT NOW(),
                    FOREIGN KEY ("medicineId") REFERENCES medicines(id),
                    FOREIGN KEY ("supplierId") REFERENCES suppliers(id)
                )
            `);
            console.log('✅ Created medicine_stock table');
            
            // Create indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines("genericName")');
            await client.query('CREATE INDEX IF NOT EXISTS idx_medicines_brand ON medicines(brand)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_medicine_stock_batch ON medicine_stock("batchNumber")');
            await client.query('CREATE INDEX IF NOT EXISTS idx_medicine_stock_expiry ON medicine_stock("expiryDate")');
            
            await client.query('COMMIT');
            console.log('✅ All pharmacy tables created successfully!');
        } else {
            console.log('✅ Pharmacy tables already exist');
        }
        
        // Final table check
        const finalCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('gst_slabs', 'medicine_categories', 'suppliers', 'medicines', 'medicine_stock')
            ORDER BY table_name
        `);
        
        console.log('\\n📊 Final pharmacy tables:', finalCheck.rows.map(r => r.table_name));
        
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
        await checkAndCreateTables();
        console.log('\\n✅ Database setup completed!');
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
