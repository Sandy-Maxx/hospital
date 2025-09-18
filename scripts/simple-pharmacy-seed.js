const { Pool } = require('pg');
require('dotenv').config();

// Extract connection details from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
}

// Create PostgreSQL connection
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

const seedData = {
    gstSlabs: [
        { name: '0% GST', rate: 0.0, description: 'Essential medicines and life-saving drugs', isActive: true },
        { name: '5% GST', rate: 5.0, description: 'Basic medicines and healthcare products', isActive: true },
        { name: '12% GST', rate: 12.0, description: 'Standard medicines and medical supplies', isActive: true },
        { name: '18% GST', rate: 18.0, description: 'General medical products and devices', isActive: true },
        { name: '28% GST', rate: 28.0, description: 'Luxury health and wellness products', isActive: true }
    ],
    
    categories: [
        { name: 'Analgesics', description: 'Pain relief medications', gstRate: 5.0, isActive: true },
        { name: 'Antibiotics', description: 'Anti-bacterial medications', gstRate: 0.0, isActive: true },
        { name: 'Antihypertensives', description: 'Blood pressure medications', gstRate: 5.0, isActive: true },
        { name: 'Diabetes', description: 'Diabetes management medicines', gstRate: 0.0, isActive: true },
        { name: 'Vitamins & Supplements', description: 'Nutritional supplements', gstRate: 12.0, isActive: true },
        { name: 'Respiratory', description: 'Lung and breathing medicines', gstRate: 5.0, isActive: true }
    ],
    
    suppliers: [
        { name: 'Sun Pharmaceutical Industries Ltd', contactPerson: 'Rajesh Kumar', phone: '+91-98765-43210', email: 'sales@sunpharma.com', address: 'Mumbai, Maharashtra', gstNumber: '27AAAAA0000A1Z5', creditTerms: 30, isActive: true },
        { name: 'Cipla Limited', contactPerson: 'Priya Sharma', phone: '+91-87654-32109', email: 'orders@cipla.com', address: 'Bangalore, Karnataka', gstNumber: '29BBBBB1111B2Y6', creditTerms: 45, isActive: true },
        { name: 'Dr. Reddy\'s Laboratories', contactPerson: 'Arun Reddy', phone: '+91-76543-21098', email: 'supply@drreddys.com', address: 'Hyderabad, Telangana', gstNumber: '36CCCCC2222C3X7', creditTerms: 30, isActive: true },
        { name: 'Lupin Limited', contactPerson: 'Meera Patel', phone: '+91-65432-10987', email: 'procurement@lupin.com', address: 'Pune, Maharashtra', gstRate: '27DDDDD3333D4W8', creditTerms: 60, isActive: true },
        { name: 'Aurobindo Pharma', contactPerson: 'Kiran Rao', phone: '+91-54321-09876', email: 'orders@aurobindo.com', address: 'Hyderabad, Telangana', gstNumber: '36EEEEE4444E5V9', creditTerms: 30, isActive: true }
    ]
};

async function seedPharmacy() {
    const client = await pool.connect();
    try {
        console.log('🏥 Starting pharmacy database seeding...');
        
        // Start transaction
        await client.query('BEGIN');
        
        // 1. Seed GST Slabs
        console.log('📊 Creating GST slabs...');
        for (const gst of seedData.gstSlabs) {
            const gstQuery = `
                INSERT INTO gst_slabs (id, name, rate, description, "isActive", "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            `;
            await client.query(gstQuery, [gst.name, gst.rate, gst.description, gst.isActive]);
        }
        
        // 2. Seed Medicine Categories
        console.log('📂 Creating medicine categories...');
        for (const cat of seedData.categories) {
            const catQuery = `
                INSERT INTO medicine_categories (id, name, description, "gstRate", "isActive", "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            `;
            await client.query(catQuery, [cat.name, cat.description, cat.gstRate, cat.isActive]);
        }
        
        // 3. Seed Suppliers
        console.log('🏪 Creating suppliers...');
        for (const sup of seedData.suppliers) {
            const supQuery = `
                INSERT INTO suppliers (id, name, "contactPerson", phone, email, address, "gstNumber", "creditTerms", "isActive", "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            `;
            await client.query(supQuery, [sup.name, sup.contactPerson, sup.phone, sup.email, sup.address, sup.gstNumber, sup.creditTerms, sup.isActive]);
        }
        
        // 4. Seed Sample Medicines
        console.log('💊 Creating sample medicines...');
        
        // Get category and GST slab IDs
        const analgesicsResult = await client.query('SELECT id FROM medicine_categories WHERE name = $1', ['Analgesics']);
        const antibioticsResult = await client.query('SELECT id FROM medicine_categories WHERE name = $1', ['Antibiotics']);
        const diabetesResult = await client.query('SELECT id FROM medicine_categories WHERE name = $1', ['Diabetes']);
        
        const gst5Result = await client.query('SELECT id FROM gst_slabs WHERE rate = $1', [5.0]);
        const gst0Result = await client.query('SELECT id FROM gst_slabs WHERE rate = $1', [0.0]);
        
        if (analgesicsResult.rows.length > 0 && gst5Result.rows.length > 0) {
            const analgesicsId = analgesicsResult.rows[0].id;
            const gst5Id = gst5Result.rows[0].id;
            
            const paracetamolQuery = `
                INSERT INTO medicines (id, name, "genericName", brand, manufacturer, "categoryId", "gstSlabId", "dosageForm", strength, "unitType", mrp, "purchasePrice", "marginPercentage", "prescriptionRequired", "isActive", description, "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            `;
            await client.query(paracetamolQuery, [
                'Paracetamol 500mg Tablet',
                'Paracetamol',
                'Dolo',
                'Micro Labs Ltd',
                analgesicsId,
                gst5Id,
                'Tablet',
                '500mg',
                'Strip of 10',
                15.50,
                12.00,
                29.17,
                false,
                true,
                'Pain relief and fever reducer'
            ]);
        }
        
        if (antibioticsResult.rows.length > 0 && gst0Result.rows.length > 0) {
            const antibioticsId = antibioticsResult.rows[0].id;
            const gst0Id = gst0Result.rows[0].id;
            
            const amoxicillinQuery = `
                INSERT INTO medicines (id, name, "genericName", brand, manufacturer, "categoryId", "gstSlabId", "dosageForm", strength, "unitType", mrp, "purchasePrice", "marginPercentage", "prescriptionRequired", "isActive", description, "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            `;
            await client.query(amoxicillinQuery, [
                'Amoxicillin 500mg Capsule',
                'Amoxicillin',
                'Amoxil',
                'Cipla Limited',
                antibioticsId,
                gst0Id,
                'Capsule',
                '500mg',
                'Strip of 10',
                85.00,
                68.00,
                25.00,
                true,
                true,
                'Antibiotic for bacterial infections'
            ]);
        }
        
        if (diabetesResult.rows.length > 0 && gst0Result.rows.length > 0) {
            const diabetesId = diabetesResult.rows[0].id;
            const gst0Id = gst0Result.rows[0].id;
            
            const metforminQuery = `
                INSERT INTO medicines (id, name, "genericName", brand, manufacturer, "categoryId", "gstSlabId", "dosageForm", strength, "unitType", mrp, "purchasePrice", "marginPercentage", "prescriptionRequired", "isActive", description, "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            `;
            await client.query(metforminQuery, [
                'Metformin 500mg Tablet',
                'Metformin Hydrochloride',
                'Glycomet',
                'USV Private Limited',
                diabetesId,
                gst0Id,
                'Tablet',
                '500mg',
                'Strip of 20',
                24.00,
                19.20,
                25.00,
                true,
                true,
                'Type 2 diabetes management'
            ]);
        }
        
        // 5. Seed Sample Stock
        console.log('📦 Creating sample stock entries...');
        
        // Get supplier and medicine IDs for stock entries
        const supplierResult = await client.query('SELECT id FROM suppliers LIMIT 1');
        const medicineResults = await client.query('SELECT id, name FROM medicines LIMIT 3');
        
        if (supplierResult.rows.length > 0 && medicineResults.rows.length > 0) {
            const supplierId = supplierResult.rows[0].id;
            
            for (let i = 0; i < medicineResults.rows.length; i++) {
                const medicine = medicineResults.rows[i];
                const expiryDate = new Date();
                expiryDate.setFullYear(expiryDate.getFullYear() + 2); // 2 years from now
                
                const stockQuery = `
                    INSERT INTO medicine_stock (id, "medicineId", "supplierId", "batchNumber", "expiryDate", quantity, "availableQuantity", "purchasePrice", mrp, "isActive", "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                `;
                await client.query(stockQuery, [
                    medicine.id,
                    supplierId,
                    `BATCH${i + 1}${new Date().getFullYear()}`,
                    expiryDate,
                    100 + (i * 50), // quantity
                    100 + (i * 50), // available quantity
                    15.00 + (i * 10), // purchase price
                    20.00 + (i * 15), // mrp
                    true
                ]);
            }
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log('✅ Pharmacy database seeding completed successfully!');
        
        // Show summary
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM gst_slabs'),
            client.query('SELECT COUNT(*) FROM medicine_categories'),
            client.query('SELECT COUNT(*) FROM suppliers'),
            client.query('SELECT COUNT(*) FROM medicines'),
            client.query('SELECT COUNT(*) FROM medicine_stock')
        ]);
        
        console.log('\n📋 Summary:');
        console.log(`   GST Slabs: ${counts[0].rows[0].count}`);
        console.log(`   Categories: ${counts[1].rows[0].count}`);
        console.log(`   Suppliers: ${counts[2].rows[0].count}`);
        console.log(`   Medicines: ${counts[3].rows[0].count}`);
        console.log(`   Stock Entries: ${counts[4].rows[0].count}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding pharmacy data:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await seedPharmacy();
        console.log('\n🎉 Pharmacy module setup completed!');
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
