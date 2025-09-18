const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedComprehensiveMedicines() {
    const client = await pool.connect();
    try {
        console.log('🏥 Seeding Comprehensive Indian Medicine Database...\n');
        
        await client.query('BEGIN');
        
        console.log('📋 Step 1: Adding specialized categories...');
        
        // Add all the categories from the comprehensive database
        const categories = [
            { id: 'cat_immunology', name: 'Immunology', description: 'Immunosuppressive and autoimmune disease medications', gstRate: 5.0 },
            { id: 'cat_chemotherapy', name: 'Chemotherapy', description: 'Cancer chemotherapy agents', gstRate: 5.0 },
            { id: 'cat_biologics', name: 'Biologics', description: 'Biological and monoclonal antibody therapies', gstRate: 5.0 },
            { id: 'cat_medical_devices', name: 'Medical Devices', description: 'Medical devices and consumables', gstRate: 18.0 },
            { id: 'cat_wound_care', name: 'Wound Care', description: 'Wound dressings and healing products', gstRate: 18.0 },
            { id: 'cat_diagnostic', name: 'Diagnostic', description: 'Diagnostic agents and test kits', gstRate: 12.0 },
            { id: 'cat_nutrition', name: 'Clinical Nutrition', description: 'Enteral nutrition and specialized feeds', gstRate: 18.0 },
            { id: 'cat_cardiovascular', name: 'Cardiovascular', description: 'Heart and blood vessel medications', gstRate: 5.0 },
            { id: 'cat_neurological', name: 'Neurological', description: 'Brain and nervous system medications', gstRate: 5.0 },
            { id: 'cat_gastrointestinal', name: 'Gastrointestinal', description: 'Digestive system medications', gstRate: 5.0 }
        ];
        
        for (const cat of categories) {
            await client.query(`
                INSERT INTO medicine_categories (id, name, description, "gstRate", "isActive", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description,
                "gstRate" = EXCLUDED."gstRate",
                "updatedAt" = NOW()
            `, [cat.id, cat.name, cat.description, cat.gstRate, true]);
        }
        
        console.log('✅ Categories added');
        
        console.log('\\n📊 Step 2: Adding comprehensive medicines...');
        
        // Get GST slab IDs
        const gst5Result = await client.query('SELECT id FROM gst_slabs WHERE rate = $1', [5.0]);
        const gst18Result = await client.query('SELECT id FROM gst_slabs WHERE rate = $1', [18.0]);
        const gst12Result = await client.query('SELECT id FROM gst_slabs WHERE rate = $1', [12.0]);
        
        const gst5Id = gst5Result.rows.length > 0 ? gst5Result.rows[0].id : null;
        const gst18Id = gst18Result.rows.length > 0 ? gst18Result.rows[0].id : null;
        const gst12Id = gst12Result.rows.length > 0 ? gst12Result.rows[0].id : null;
        
        // Comprehensive medicine data from the SQL files
        const medicines = [
            // IMMUNOLOGY & BIOLOGICS (5% GST)
            {
                id: 'med_cyclosporine_25',
                name: 'Cyclosporine 25mg',
                genericName: 'Cyclosporine',
                brand: 'Panimun',
                manufacturer: 'Panacea Biotec',
                categoryId: 'cat_immunology',
                gstSlabId: gst5Id,
                dosageForm: 'Capsule',
                strength: '25mg',
                unitType: 'Strip of 10',
                mrp: 485.00,
                purchasePrice: 365.00,
                marginPercentage: 32.88,
                prescriptionRequired: true,
                description: 'Immunosuppressive for organ transplant'
            },
            {
                id: 'med_rituximab_100',
                name: 'Rituximab Injection',
                genericName: 'Rituximab',
                brand: 'Mabthera',
                manufacturer: 'Roche',
                categoryId: 'cat_biologics',
                gstSlabId: gst5Id,
                dosageForm: 'Injection',
                strength: '100mg/10ml',
                unitType: 'Vial 10ml',
                mrp: 28500.00,
                purchasePrice: 22500.00,
                marginPercentage: 26.67,
                prescriptionRequired: true,
                description: 'Monoclonal antibody for lymphoma/RA'
            },
            
            // CHEMOTHERAPY (5% GST)
            {
                id: 'med_doxorubicin_50',
                name: 'Doxorubicin Injection',
                genericName: 'Doxorubicin HCl',
                brand: 'Adriamycin',
                manufacturer: 'Pfizer',
                categoryId: 'cat_chemotherapy',
                gstSlabId: gst5Id,
                dosageForm: 'Injection',
                strength: '50mg/25ml',
                unitType: 'Vial 25ml',
                mrp: 2485.00,
                purchasePrice: 1920.00,
                marginPercentage: 29.43,
                prescriptionRequired: true,
                description: 'Anthracycline chemotherapy agent'
            },
            {
                id: 'med_paclitaxel_100',
                name: 'Paclitaxel Injection',
                genericName: 'Paclitaxel',
                brand: 'Taxol',
                manufacturer: 'Bristol Myers Squibb',
                categoryId: 'cat_chemotherapy',
                gstSlabId: gst5Id,
                dosageForm: 'Injection',
                strength: '100mg/16.7ml',
                unitType: 'Vial 16.7ml',
                mrp: 4850.00,
                purchasePrice: 3785.00,
                marginPercentage: 28.13,
                prescriptionRequired: true,
                description: 'Taxane chemotherapy for various cancers'
            },
            
            // ADVANCED ANTIBIOTICS (5% GST)
            {
                id: 'med_vancomycin_500',
                name: 'Vancomycin Injection',
                genericName: 'Vancomycin HCl',
                brand: 'Vancocin',
                manufacturer: 'Pfizer',
                categoryId: 'd95cf85c-0ea9-4864-8856-2b8d4aa34a24', // Existing Antibiotics category
                gstSlabId: gst5Id,
                dosageForm: 'Injection',
                strength: '500mg',
                unitType: 'Vial 500mg',
                mrp: 285.00,
                purchasePrice: 220.00,
                marginPercentage: 29.55,
                prescriptionRequired: true,
                description: 'Glycopeptide antibiotic for MRSA'
            },
            {
                id: 'med_linezolid_600',
                name: 'Linezolid 600mg',
                genericName: 'Linezolid',
                brand: 'Zyvox',
                manufacturer: 'Pfizer',
                categoryId: 'd95cf85c-0ea9-4864-8856-2b8d4aa34a24', // Existing Antibiotics category
                gstSlabId: gst5Id,
                dosageForm: 'Tablet',
                strength: '600mg',
                unitType: 'Strip of 4',
                mrp: 1285.00,
                purchasePrice: 985.00,
                marginPercentage: 30.46,
                prescriptionRequired: true,
                description: 'Oxazolidinone antibiotic for resistant Gram-positive'
            },
            
            // ADVANCED CARDIOVASCULAR
            {
                id: 'med_digoxin_0_25',
                name: 'Digoxin 0.25mg',
                genericName: 'Digoxin',
                brand: 'Lanoxin',
                manufacturer: 'Aspen',
                categoryId: 'cat_cardiovascular',
                gstSlabId: gst5Id,
                dosageForm: 'Tablet',
                strength: '0.25mg',
                unitType: 'Strip of 30',
                mrp: 85.00,
                purchasePrice: 60.00,
                marginPercentage: 41.67,
                prescriptionRequired: true,
                description: 'Cardiac glycoside for heart failure'
            },
            {
                id: 'med_amiodarone_200',
                name: 'Amiodarone 200mg',
                genericName: 'Amiodarone HCl',
                brand: 'Cordarone',
                manufacturer: 'Sanofi',
                categoryId: 'cat_cardiovascular',
                gstSlabId: gst5Id,
                dosageForm: 'Tablet',
                strength: '200mg',
                unitType: 'Strip of 10',
                mrp: 125.00,
                purchasePrice: 90.00,
                marginPercentage: 38.89,
                prescriptionRequired: true,
                description: 'Antiarrhythmic for serious arrhythmias'
            },
            
            // ADVANCED NEUROLOGICAL
            {
                id: 'med_levetiracetam_500',
                name: 'Levetiracetam 500mg',
                genericName: 'Levetiracetam',
                brand: 'Keppra',
                manufacturer: 'UCB Pharma',
                categoryId: 'cat_neurological',
                gstSlabId: gst5Id,
                dosageForm: 'Tablet',
                strength: '500mg',
                unitType: 'Strip of 10',
                mrp: 185.00,
                purchasePrice: 135.00,
                marginPercentage: 37.04,
                prescriptionRequired: true,
                description: 'Newer anti-epileptic drug'
            },
            {
                id: 'med_pregabalin_75',
                name: 'Pregabalin 75mg',
                genericName: 'Pregabalin',
                brand: 'Lyrica',
                manufacturer: 'Pfizer',
                categoryId: 'cat_neurological',
                gstSlabId: gst5Id,
                dosageForm: 'Capsule',
                strength: '75mg',
                unitType: 'Strip of 10',
                mrp: 125.00,
                purchasePrice: 90.00,
                marginPercentage: 38.89,
                prescriptionRequired: true,
                description: 'Anticonvulsant for neuropathic pain'
            },
            
            // MEDICAL DEVICES (18% GST)
            {
                id: 'med_insulin_syringes',
                name: 'Insulin Syringes',
                genericName: 'Disposable Insulin Syringes',
                brand: 'BD Ultra-Fine',
                manufacturer: 'BD',
                categoryId: 'cat_medical_devices',
                gstSlabId: gst18Id,
                dosageForm: 'Syringe',
                strength: '1ml/30G',
                unitType: 'Box of 100',
                mrp: 485.00,
                purchasePrice: 315.00,
                marginPercentage: 53.97,
                prescriptionRequired: false,
                description: 'Insulin administration syringes'
            },
            {
                id: 'med_glucometer_strips',
                name: 'Glucose Test Strips',
                genericName: 'Blood Glucose Test Strips',
                brand: 'Accu-Chek Active',
                manufacturer: 'Roche',
                categoryId: 'cat_medical_devices',
                gstSlabId: gst18Id,
                dosageForm: 'Test Strips',
                strength: 'N/A',
                unitType: 'Box of 50',
                mrp: 785.00,
                purchasePrice: 510.00,
                marginPercentage: 53.92,
                prescriptionRequired: false,
                description: 'Blood glucose monitoring strips'
            },
            
            // WOUND CARE (18% GST)
            {
                id: 'med_hydrocolloid_dressing',
                name: 'Hydrocolloid Dressing',
                genericName: 'Hydrocolloid Wound Dressing',
                brand: 'DuoDerm',
                manufacturer: 'ConvaTec',
                categoryId: 'cat_wound_care',
                gstSlabId: gst18Id,
                dosageForm: 'Dressing',
                strength: '10cm x 10cm',
                unitType: 'Box of 10',
                mrp: 485.00,
                purchasePrice: 315.00,
                marginPercentage: 53.97,
                prescriptionRequired: false,
                description: 'Advanced wound dressing'
            },
            
            // CLINICAL NUTRITION (18% GST)
            {
                id: 'med_enteral_nutrition',
                name: 'Enteral Nutrition Formula',
                genericName: 'Complete Nutritional Formula',
                brand: 'Ensure',
                manufacturer: 'Abbott',
                categoryId: 'cat_nutrition',
                gstSlabId: gst18Id,
                dosageForm: 'Powder',
                strength: '400g',
                unitType: 'Tin',
                mrp: 485.00,
                purchasePrice: 315.00,
                marginPercentage: 53.97,
                prescriptionRequired: false,
                description: 'Complete nutritional supplement'
            },
            
            // DIAGNOSTIC (12% GST)
            {
                id: 'med_urine_dipsticks',
                name: 'Urine Dipsticks',
                genericName: 'Multi-parameter Urine Test Strips',
                brand: 'Combur',
                manufacturer: 'Roche',
                categoryId: 'cat_diagnostic',
                gstSlabId: gst12Id,
                dosageForm: 'Test Strips',
                strength: '10 Parameters',
                unitType: 'Bottle of 100',
                mrp: 1285.00,
                purchasePrice: 825.00,
                marginPercentage: 55.76,
                prescriptionRequired: false,
                description: 'Urine analysis dipsticks'
            },
            
            // Additional comprehensive medicines from the other parts
            {
                id: 'med_omeprazole_20_adv',
                name: 'Omeprazole 20mg DR',
                genericName: 'Omeprazole',
                brand: 'Prilosec OTC',
                manufacturer: 'P&G',
                categoryId: 'cat_gastrointestinal',
                gstSlabId: gst5Id,
                dosageForm: 'Capsule',
                strength: '20mg',
                unitType: 'Strip of 14',
                mrp: 58.00,
                purchasePrice: 42.00,
                marginPercentage: 38.10,
                prescriptionRequired: false,
                description: 'Delayed-release proton pump inhibitor'
            },
            {
                id: 'med_losartan_50',
                name: 'Losartan 50mg',
                genericName: 'Losartan Potassium',
                brand: 'Cozaar',
                manufacturer: 'MSD',
                categoryId: 'cat_cardiovascular',
                gstSlabId: gst5Id,
                dosageForm: 'Tablet',
                strength: '50mg',
                unitType: 'Strip of 10',
                mrp: 95.00,
                purchasePrice: 68.00,
                marginPercentage: 39.71,
                prescriptionRequired: true,
                description: 'ARB for hypertension'
            },
            {
                id: 'med_rosuvastatin_10',
                name: 'Rosuvastatin 10mg',
                genericName: 'Rosuvastatin Calcium',
                brand: 'Crestor',
                manufacturer: 'AstraZeneca',
                categoryId: 'cat_cardiovascular',
                gstSlabId: gst5Id,
                dosageForm: 'Tablet',
                strength: '10mg',
                unitType: 'Strip of 10',
                mrp: 145.00,
                purchasePrice: 105.00,
                marginPercentage: 38.10,
                prescriptionRequired: true,
                description: 'HMG-CoA reductase inhibitor for cholesterol'
            },
            {
                id: 'med_pantoprazole_40_inj',
                name: 'Pantoprazole Injection',
                genericName: 'Pantoprazole Sodium',
                brand: 'Protonix IV',
                manufacturer: 'Pfizer',
                categoryId: 'cat_gastrointestinal',
                gstSlabId: gst5Id,
                dosageForm: 'Injection',
                strength: '40mg',
                unitType: 'Vial',
                mrp: 185.00,
                purchasePrice: 135.00,
                marginPercentage: 37.04,
                prescriptionRequired: true,
                description: 'IV proton pump inhibitor'
            },
            {
                id: 'med_tramadol_50',
                name: 'Tramadol 50mg',
                genericName: 'Tramadol HCl',
                brand: 'Ultram',
                manufacturer: 'Janssen',
                categoryId: 'cat_analgesic', // Existing Analgesics category
                gstSlabId: gst5Id,
                dosageForm: 'Tablet',
                strength: '50mg',
                unitType: 'Strip of 10',
                mrp: 45.00,
                purchasePrice: 32.00,
                marginPercentage: 40.63,
                prescriptionRequired: true,
                description: 'Centrally acting analgesic'
            }
        ];
        
        // Insert medicines
        let addedCount = 0;
        for (const med of medicines) {
            try {
                await client.query(`
                    INSERT INTO medicines (id, name, "genericName", brand, manufacturer, "categoryId", "gstSlabId", "dosageForm", strength, "unitType", mrp, "purchasePrice", "marginPercentage", "prescriptionRequired", "isActive", description, "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
                    ON CONFLICT (name) DO UPDATE SET
                    brand = EXCLUDED.brand,
                    manufacturer = EXCLUDED.manufacturer,
                    mrp = EXCLUDED.mrp,
                    "purchasePrice" = EXCLUDED."purchasePrice",
                    "updatedAt" = NOW()
                `, [
                    med.id, med.name, med.genericName, med.brand, med.manufacturer,
                    med.categoryId, med.gstSlabId, med.dosageForm, med.strength, med.unitType,
                    med.mrp, med.purchasePrice, med.marginPercentage, med.prescriptionRequired,
                    true, med.description
                ]);
                addedCount++;
            } catch (err) {
                console.log(`   ⚠️  Skipped ${med.name}: ${err.message}`);
            }
        }
        
        console.log(`✅ Added ${addedCount} comprehensive medicines`);
        
        console.log('\\n📦 Step 3: Adding specialized suppliers...');
        
        const suppliers = [
            { id: 'sup_specialty_pharma', name: 'Specialty Pharma International', contactPerson: 'Dr. Arun Mehta', phone: '+91-9876543220', email: 'arun@specialtypharma.com', address: '789 Specialty Complex, Mumbai - 400001', gstNumber: '27ABCDE1234F3B1', creditTerms: 60 },
            { id: 'sup_biocon_biologics', name: 'Biocon Biologics', contactPerson: 'Ms. Rashmi Iyer', phone: '+91-9876543221', email: 'rashmi@biocon.com', address: '456 Biocon Park, Bangalore - 560100', gstNumber: '29ABCDE1234F3B2', creditTerms: 90 },
            { id: 'sup_oncology_care', name: 'Oncology Care Suppliers', contactPerson: 'Dr. Sanjiv Kumar', phone: '+91-9876543224', email: 'sanjiv@oncologycare.com', address: '987 Cancer Centre Road, Delhi - 110029', gstNumber: '07ABCDE1234F3B5', creditTerms: 75 }
        ];
        
        for (const sup of suppliers) {
            await client.query(`
                INSERT INTO suppliers (id, name, "contactPerson", phone, email, address, "gstNumber", "creditTerms", "isActive", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                ON CONFLICT (name) DO UPDATE SET
                "contactPerson" = EXCLUDED."contactPerson",
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                "updatedAt" = NOW()
            `, [sup.id, sup.name, sup.contactPerson, sup.phone, sup.email, sup.address, sup.gstNumber, sup.creditTerms, true]);
        }
        
        console.log('✅ Added specialized suppliers');
        
        console.log('\\n📊 Step 4: Adding stock entries...');
        
        // Get a supplier for stock entries
        const supplierResult = await client.query('SELECT id FROM suppliers LIMIT 1');
        const supplierId = supplierResult.rows[0].id;
        
        // Add stock for some key medicines
        const stockMedicines = [
            'med_vancomycin_500',
            'med_linezolid_600',
            'med_insulin_syringes',
            'med_glucometer_strips',
            'med_enteral_nutrition'
        ];
        
        for (let i = 0; i < stockMedicines.length; i++) {
            const medicineId = stockMedicines[i];
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1 + (i % 2)); // 1-2 years expiry
            
            await client.query(`
                INSERT INTO medicine_stock (id, "medicineId", "supplierId", "batchNumber", "expiryDate", quantity, "availableQuantity", "purchasePrice", mrp, "isActive", "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                ON CONFLICT DO NOTHING
            `, [
                medicineId, supplierId, `COMP${i + 1}${new Date().getFullYear()}`,
                expiryDate, 50 + (i * 25), 50 + (i * 25),
                100.00 + (i * 50), 150.00 + (i * 75), true
            ]);
        }
        
        console.log('✅ Added stock entries for key medicines');
        
        await client.query('COMMIT');
        
        console.log('\\n🎉 Comprehensive medicine database seeded successfully!');
        
        // Show final counts
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM medicine_categories'),
            client.query('SELECT COUNT(*) FROM medicines'),
            client.query('SELECT COUNT(*) FROM suppliers'),
            client.query('SELECT COUNT(*) FROM medicine_stock')
        ]);
        
        console.log('\\n📊 Final Database Counts:');
        console.log(`   Categories: ${counts[0].rows[0].count}`);
        console.log(`   Medicines: ${counts[1].rows[0].count}`);
        console.log(`   Suppliers: ${counts[2].rows[0].count}`);
        console.log(`   Stock Entries: ${counts[3].rows[0].count}`);
        
        console.log('\\n💊 Sample of new medicines added:');
        const sampleMedicines = await client.query(`
            SELECT m.name, m.brand, mc.name as category, gs.rate as gst_rate, m.mrp
            FROM medicines m
            LEFT JOIN medicine_categories mc ON m."categoryId" = mc.id
            LEFT JOIN gst_slabs gs ON m."gstSlabId" = gs.id
            WHERE m.mrp > 1000
            ORDER BY m.mrp DESC
            LIMIT 5
        `);
        
        sampleMedicines.rows.forEach((med, i) => {
            console.log(`   ${i + 1}. ${med.name} (${med.brand}) - ${med.category} - ${med.gst_rate}% GST - ₹${med.mrp}`);
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding comprehensive medicines:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedComprehensiveMedicines();
