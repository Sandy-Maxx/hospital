const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedMassiveComprehensiveMedicines() {
    const client = await pool.connect();
    try {
        console.log('🏥 Seeding MASSIVE Comprehensive Indian Medicine Database...\n');
        console.log('═'.repeat(80));
        
        await client.query('BEGIN');
        
        // 1. ADD COMPREHENSIVE CATEGORIES
        console.log('📋 Step 1: Adding comprehensive medical categories...');
        
        const categories = [
            // Existing + New Comprehensive Categories
            { id: 'cat_cardiology', name: 'Cardiology', description: 'Heart and cardiovascular system medications', gstRate: 5.0 },
            { id: 'cat_endocrinology', name: 'Endocrinology', description: 'Hormonal and metabolic disorder medications', gstRate: 5.0 },
            { id: 'cat_nephrology', name: 'Nephrology', description: 'Kidney and urinary system medications', gstRate: 5.0 },
            { id: 'cat_pulmonology', name: 'Pulmonology', description: 'Respiratory system medications', gstRate: 5.0 },
            { id: 'cat_gastroenterology', name: 'Gastroenterology', description: 'Digestive system specialized medications', gstRate: 5.0 },
            { id: 'cat_hematology', name: 'Hematology', description: 'Blood disorders and clotting medications', gstRate: 5.0 },
            { id: 'cat_oncology_advanced', name: 'Advanced Oncology', description: 'Specialized cancer treatment drugs', gstRate: 5.0 },
            { id: 'cat_psychiatry', name: 'Psychiatry', description: 'Mental health and neuropsychiatric medications', gstRate: 5.0 },
            { id: 'cat_dermatology', name: 'Dermatology', description: 'Skin and dermatological conditions', gstRate: 5.0 },
            { id: 'cat_ophthalmology', name: 'Ophthalmology', description: 'Eye care medications and solutions', gstRate: 5.0 },
            { id: 'cat_ent', name: 'ENT (Ear, Nose, Throat)', description: 'ENT specialty medications', gstRate: 5.0 },
            { id: 'cat_orthopedics', name: 'Orthopedics', description: 'Bone and joint medications', gstRate: 5.0 },
            { id: 'cat_rheumatology', name: 'Rheumatology', description: 'Joint and autoimmune disease medications', gstRate: 5.0 },
            { id: 'cat_urology', name: 'Urology', description: 'Urinary tract and male reproductive system', gstRate: 5.0 },
            { id: 'cat_gynecology', name: 'Gynecology & Obstetrics', description: 'Women health and pregnancy medications', gstRate: 5.0 },
            { id: 'cat_pediatrics', name: 'Pediatrics', description: 'Children-specific medications and formulations', gstRate: 5.0 },
            { id: 'cat_geriatrics', name: 'Geriatrics', description: 'Elderly care specialized medications', gstRate: 5.0 },
            { id: 'cat_critical_care', name: 'Critical Care', description: 'ICU and emergency medications', gstRate: 5.0 },
            { id: 'cat_anesthesia', name: 'Anesthesia', description: 'Anesthetic agents and adjuvants', gstRate: 5.0 },
            { id: 'cat_emergency', name: 'Emergency Medicine', description: 'Emergency and trauma medications', gstRate: 5.0 },
            { id: 'cat_infectious_diseases', name: 'Infectious Diseases', description: 'Specialized anti-infective agents', gstRate: 5.0 },
            { id: 'cat_pain_management', name: 'Pain Management', description: 'Specialized pain relief medications', gstRate: 5.0 },
            { id: 'cat_radiology', name: 'Radiology & Imaging', description: 'Contrast agents and imaging medications', gstRate: 12.0 },
            { id: 'cat_laboratory', name: 'Laboratory Medicine', description: 'Laboratory reagents and test solutions', gstRate: 12.0 },
            { id: 'cat_surgical', name: 'Surgical Supplies', description: 'Surgical medications and supplies', gstRate: 18.0 },
            { id: 'cat_ayurveda', name: 'Ayurveda & Herbal', description: 'Traditional Indian medicines and herbs', gstRate: 5.0 },
            { id: 'cat_homeopathy', name: 'Homeopathy', description: 'Homeopathic medicines and remedies', gstRate: 5.0 },
            { id: 'cat_physiotherapy', name: 'Physiotherapy', description: 'Physical therapy aids and medications', gstRate: 18.0 },
            { id: 'cat_dental', name: 'Dental Care', description: 'Dental and oral health medications', gstRate: 18.0 }
        ];
        
        let categoryCount = 0;
        for (const cat of categories) {
            try {
                await client.query(`
                    INSERT INTO medicine_categories (id, name, description, "gstRate", "isActive", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                    ON CONFLICT (name) DO UPDATE SET
                    description = EXCLUDED.description,
                    "gstRate" = EXCLUDED."gstRate",
                    "updatedAt" = NOW()
                `, [cat.id, cat.name, cat.description, cat.gstRate, true]);
                categoryCount++;
            } catch (err) {
                console.log(`   ⚠️  Category skipped: ${cat.name}`);
            }
        }
        
        console.log(`✅ Added/Updated ${categoryCount} comprehensive categories`);
        
        // 2. ADD 20+ COMPREHENSIVE SUPPLIERS
        console.log('\\n🏭 Step 2: Adding 20+ comprehensive Indian pharmaceutical suppliers...');
        
        const suppliers = [
            // Major Indian Pharmaceutical Companies
            { id: 'sup_sun_pharma', name: 'Sun Pharmaceutical Industries Ltd', contactPerson: 'Dr. Dilip Shanghvi', phone: '+91-22-4324-4324', email: 'info@sunpharma.com', address: 'Sun House, 201B Western Wing, 2nd Floor, Kanakia Wall Street, Andheri-Kurla Road, Andheri (East), Mumbai - 400093', gstNumber: '27AAACS8778P1ZN', creditTerms: 45 },
            { id: 'sup_dr_reddys', name: 'Dr. Reddys Laboratories Ltd', contactPerson: 'Mr. G.V. Prasad', phone: '+91-40-4900-2900', email: 'info@drreddys.com', address: '8-2-337, Road No. 3, Banjara Hills, Hyderabad - 500034, Telangana', gstNumber: '36AAACH2972H1Z8', creditTerms: 60 },
            { id: 'sup_cipla', name: 'Cipla Limited', contactPerson: 'Mr. Umang Vohra', phone: '+91-22-2482-1891', email: 'investorrelations@cipla.com', address: 'Cipla House, Peninsula Business Park, Ganpatrao Kadam Marg, Lower Parel, Mumbai - 400013', gstNumber: '27AAACH3421G1ZC', creditTerms: 30 },
            { id: 'sup_aurobindo', name: 'Aurobindo Pharma Limited', contactPerson: 'Mr. N. Govindarajan', phone: '+91-40-6672-5000', email: 'info@aurobindo.com', address: 'Plot No. 2, Maitrivihar, Ameerpet, Hyderabad - 500038, Telangana', gstNumber: '36AAACA4621B1ZY', creditTerms: 45 },
            { id: 'sup_lupin', name: 'Lupin Limited', contactPerson: 'Ms. Vinita Gupta', phone: '+91-22-6640-2323', email: 'customers@lupin.com', address: '159, CST Road, Kalina, Santacruz (East), Mumbai - 400098', gstNumber: '27AAACL0618Q1ZH', creditTerms: 30 },
            { id: 'sup_torrent', name: 'Torrent Pharmaceuticals Ltd', contactPerson: 'Mr. Samir Mehta', phone: '+91-79-2665-9000', email: 'info@torrentpharma.com', address: 'Torrent House, Off Ashram Road, Ahmedabad - 380009, Gujarat', gstNumber: '24AAACT6204G1ZL', creditTerms: 45 },
            { id: 'sup_glenmark', name: 'Glenmark Pharmaceuticals Ltd', contactPerson: 'Mr. Glenn Saldanha', phone: '+91-22-4018-9999', email: 'info@glenmarkpharma.com', address: 'Glenmark House, HDO - Corporate Building, B.D. Sawant Marg, Chakala, Andheri (East), Mumbai - 400099', gstNumber: '27AAACG2551L1ZG', creditTerms: 30 },
            { id: 'sup_alkem', name: 'Alkem Laboratories Ltd', contactPerson: 'Mr. Samprada Singh', phone: '+91-22-3982-9999', email: 'info@alkem.com', address: 'Devashish Building, Alkem House, Senapati Bapat Marg, Lower Parel, Mumbai - 400013', gstNumber: '27AAACA3368P1ZA', creditTerms: 45 },
            { id: 'sup_cadila', name: 'Cadila Healthcare Limited (Zydus)', contactPerson: 'Mr. Sharvil Patel', phone: '+91-79-2665-9000', email: 'info@zyduscadila.com', address: 'Zydus Tower, Satellite Cross Roads, Ahmedabad - 380015, Gujarat', gstNumber: '24AAACZ5123E1ZY', creditTerms: 60 },
            { id: 'sup_abbott_india', name: 'Abbott India Limited', contactPerson: 'Mr. Anil Joshi', phone: '+91-22-5046-1000', email: 'info.india@abbott.com', address: '3rd & 4th Floor, Corporate Park, Sion Trombay Road, Mumbai - 400071', gstNumber: '27AAACA6708C1ZX', creditTerms: 30 },
            
            // Specialty and Biotech Companies  
            { id: 'sup_biocon', name: 'Biocon Limited', contactPerson: 'Ms. Kiran Mazumdar Shaw', phone: '+91-80-2808-2808', email: 'info@biocon.com', address: '20th KM Hosur Road, Electronics City, Bangalore - 560100, Karnataka', gstNumber: '29AAACB2428Q1ZA', creditTerms: 90 },
            { id: 'sup_serum_institute', name: 'Serum Institute of India Pvt Ltd', contactPerson: 'Mr. Adar Poonawalla', phone: '+91-20-2699-3900', email: 'info@seruminstitute.com', address: '212/2, Hadapsar, Off Soli Poonawalla Road, Pune - 411028, Maharashtra', gstNumber: '27AAACS8845R1ZP', creditTerms: 75 },
            { id: 'sup_bharat_biotech', name: 'Bharat Biotech International Ltd', contactPerson: 'Dr. Krishna Ella', phone: '+91-40-2348-0567', email: 'info@bharatbiotech.com', address: 'Genome Valley, Shameerpet, Hyderabad - 500078, Telangana', gstNumber: '36AABCB8878M1Z0', creditTerms: 60 },
            { id: 'sup_wockhardt', name: 'Wockhardt Limited', contactPerson: 'Dr. Habil Khorakiwala', phone: '+91-22-2653-6077', email: 'info@wockhardt.com', address: 'D-4/1, MIDC, Aurangabad - 431210, Maharashtra', gstNumber: '27AAACW0038A1ZJ', creditTerms: 45 },
            { id: 'sup_intas', name: 'Intas Pharmaceuticals Ltd', contactPerson: 'Mr. Binish Chudgar', phone: '+91-79-2589-4720', email: 'info@intaspharma.com', address: 'Plot No: 457, 458 GIDC, Matoda, Ahmedabad - 382210, Gujarat', gstNumber: '24AAACI1482G1ZB', creditTerms: 30 },
            { id: 'sup_mankind', name: 'Mankind Pharma Ltd', contactPerson: 'Mr. Ramesh Juneja', phone: '+91-11-4097-2000', email: 'info@mankindpharma.com', address: '208, Okhla Industrial Estate, Phase III, New Delhi - 110020', gstNumber: '07AAACM6489H1ZC', creditTerms: 45 },
            
            // Regional and Specialized Companies
            { id: 'sup_hetero', name: 'Hetero Healthcare Limited', contactPerson: 'Dr. B. Partha Saradhi Reddy', phone: '+91-40-4012-9999', email: 'info@heteroworld.com', address: '7-1-27 to 42, Ameerpet, Hyderabad - 500016, Telangana', gstNumber: '36AAACH6238F1ZK', creditTerms: 60 },
            { id: 'sup_natco', name: 'Natco Pharma Limited', contactPerson: 'Mr. V.C. Nannapaneni', phone: '+91-40-2304-0144', email: 'info@natcopharma.co.in', address: 'Natco House, Road No. 2, Banjara Hills, Hyderabad - 500034, Telangana', gstNumber: '36AAACN6058K1ZH', creditTerms: 45 },
            { id: 'sup_strides', name: 'Strides Pharma Science Limited', contactPerson: 'Mr. Arun Kumar', phone: '+91-80-6784-0000', email: 'info@strides.com', address: 'Strides House, Bilekahalli, Bannerghatta Road, Bangalore - 560076, Karnataka', gstNumber: '29AAACS6213E1ZG', creditTerms: 30 },
            { id: 'sup_divis', name: 'Divis Laboratories Limited', contactPerson: 'Dr. Murali K. Divi', phone: '+91-40-6692-7000', email: 'info@divislabs.com', address: '1-72/7/3, Nr. Cyber Towers, Madhapur, Hyderabad - 500081, Telangana', gstNumber: '36AAACA1557A1ZL', creditTerms: 60 },
            { id: 'sup_granules', name: 'Granules India Limited', contactPerson: 'Dr. Krishna Prasad Chigurupati', phone: '+91-40-3045-1000', email: 'info@granulesindia.com', address: '2nd & 3rd Floor, Granules House, Plot No. 41 & 42, Sector-1, HUDA Techno Enclave, Madhapur, Hyderabad - 500081', gstNumber: '36AAACG4719R1ZD', creditTerms: 45 },
            
            // Additional Specialized Suppliers
            { id: 'sup_innovative', name: 'Innovative Pharmaceuticals Pvt Ltd', contactPerson: 'Dr. Rajesh Kumar', phone: '+91-22-2659-8877', email: 'info@innovativepharma.in', address: 'Plot 15-16, Sector 7, IMT Manesar, Gurugram - 122051, Haryana', gstNumber: '06AABCI9876K1Z5', creditTerms: 30 },
            { id: 'sup_medplus', name: 'MedPlus Health Services Pvt Ltd', contactPerson: 'Mr. Gangadi Madhukar Reddy', phone: '+91-40-4424-4444', email: 'info@medplusindia.com', address: 'Plot No. 9 & 14, IDA Phase II, Cherlapally, Hyderabad - 500051', gstNumber: '36AABCM5432H1Z8', creditTerms: 15 },
            { id: 'sup_specialty_biologics', name: 'Specialty Biologics India Ltd', contactPerson: 'Dr. Priya Nair', phone: '+91-80-4567-8901', email: 'info@specialtybiologics.in', address: 'Biotech Park, Phase II, Hinjewadi, Pune - 411057', gstNumber: '27AABCS1234B1Z9', creditTerms: 90 }
        ];
        
        let supplierCount = 0;
        for (const sup of suppliers) {
            try {
                await client.query(`
                    INSERT INTO suppliers (id, name, "contactPerson", phone, email, address, "gstNumber", "creditTerms", "isActive", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                    ON CONFLICT (name) DO UPDATE SET
                    "contactPerson" = EXCLUDED."contactPerson",
                    phone = EXCLUDED.phone,
                    email = EXCLUDED.email,
                    address = EXCLUDED.address,
                    "updatedAt" = NOW()
                `, [sup.id, sup.name, sup.contactPerson, sup.phone, sup.email, sup.address, sup.gstNumber, sup.creditTerms, true]);
                supplierCount++;
            } catch (err) {
                console.log(`   ⚠️  Supplier skipped: ${sup.name}`);
            }
        }
        
        console.log(`✅ Added/Updated ${supplierCount} comprehensive suppliers`);
        
        // 3. GET GST SLAB IDs
        const gst0Result = await client.query('SELECT id FROM gst_slabs WHERE rate = $1', [0.0]);
        const gst5Result = await client.query('SELECT id FROM gst_slabs WHERE rate = $1', [5.0]);
        const gst12Result = await client.query('SELECT id FROM gst_slabs WHERE rate = $1', [12.0]);
        const gst18Result = await client.query('SELECT id FROM gst_slabs WHERE rate = $1', [18.0]);
        
        const gst0Id = gst0Result.rows.length > 0 ? gst0Result.rows[0].id : null;
        const gst5Id = gst5Result.rows.length > 0 ? gst5Result.rows[0].id : null;
        const gst12Id = gst12Result.rows.length > 0 ? gst12Result.rows[0].id : null;
        const gst18Id = gst18Result.rows.length > 0 ? gst18Result.rows[0].id : null;
        
        // 4. ADD MASSIVE COMPREHENSIVE MEDICINE LIST
        console.log('\\n💊 Step 3: Adding massive comprehensive medicine database...');
        
        // This will be a truly comprehensive list covering all specialties
        const medicines = [
            // CARDIOLOGY (Advanced)
            { id: 'med_atorvastatin_40', name: 'Atorvastatin 40mg', genericName: 'Atorvastatin Calcium', brand: 'Lipitor', manufacturer: 'Pfizer India', categoryId: 'cat_cardiology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '40mg', unitType: 'Strip of 10', mrp: 245.00, purchasePrice: 185.00, marginPercentage: 32.43, prescriptionRequired: true, description: 'HMG-CoA reductase inhibitor for hypercholesterolemia' },
            { id: 'med_clopidogrel_75', name: 'Clopidogrel 75mg', genericName: 'Clopidogrel Bisulfate', brand: 'Plavix', manufacturer: 'Sanofi India', categoryId: 'cat_cardiology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '75mg', unitType: 'Strip of 15', mrp: 185.00, purchasePrice: 135.00, marginPercentage: 37.04, prescriptionRequired: true, description: 'Antiplatelet agent for cardiovascular protection' },
            { id: 'med_metoprolol_50', name: 'Metoprolol 50mg', genericName: 'Metoprolol Tartrate', brand: 'Lopresor', manufacturer: 'Novartis India', categoryId: 'cat_cardiology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '50mg', unitType: 'Strip of 20', mrp: 85.00, purchasePrice: 60.00, marginPercentage: 41.67, prescriptionRequired: true, description: 'Beta blocker for hypertension and angina' },
            { id: 'med_ramipril_5', name: 'Ramipril 5mg', genericName: 'Ramipril', brand: 'Altace', manufacturer: 'Sanofi India', categoryId: 'cat_cardiology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '5mg', unitType: 'Strip of 10', mrp: 125.00, purchasePrice: 90.00, marginPercentage: 38.89, prescriptionRequired: true, description: 'ACE inhibitor for hypertension and heart failure' },
            
            // ENDOCRINOLOGY
            { id: 'med_insulin_glargine', name: 'Insulin Glargine 100IU/ml', genericName: 'Insulin Glargine', brand: 'Lantus', manufacturer: 'Sanofi India', categoryId: 'cat_endocrinology', gstSlabId: gst5Id, dosageForm: 'Injection', strength: '100IU/ml', unitType: 'Vial 10ml', mrp: 1285.00, purchasePrice: 985.00, marginPercentage: 30.46, prescriptionRequired: true, description: 'Long-acting basal insulin for diabetes' },
            { id: 'med_metformin_1000', name: 'Metformin 1000mg ER', genericName: 'Metformin HCl', brand: 'Glucophage XR', manufacturer: 'Sun Pharma', categoryId: 'cat_endocrinology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '1000mg', unitType: 'Strip of 15', mrp: 145.00, purchasePrice: 105.00, marginPercentage: 38.10, prescriptionRequired: true, description: 'Extended-release biguanide antidiabetic' },
            { id: 'med_sitagliptin_100', name: 'Sitagliptin 100mg', genericName: 'Sitagliptin Phosphate', brand: 'Januvia', manufacturer: 'MSD India', categoryId: 'cat_endocrinology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '100mg', unitType: 'Strip of 7', mrp: 485.00, purchasePrice: 365.00, marginPercentage: 32.88, prescriptionRequired: true, description: 'DPP-4 inhibitor for type 2 diabetes' },
            { id: 'med_levothyroxine_100', name: 'Levothyroxine 100mcg', genericName: 'Levothyroxine Sodium', brand: 'Eltroxin', manufacturer: 'Abbott India', categoryId: 'cat_endocrinology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '100mcg', unitType: 'Strip of 30', mrp: 65.00, purchasePrice: 45.00, marginPercentage: 44.44, prescriptionRequired: true, description: 'Thyroid hormone replacement therapy' },
            
            // NEPHROLOGY
            { id: 'med_furosemide_40', name: 'Furosemide 40mg', genericName: 'Furosemide', brand: 'Lasix', manufacturer: 'Sanofi India', categoryId: 'cat_nephrology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '40mg', unitType: 'Strip of 15', mrp: 25.00, purchasePrice: 18.00, marginPercentage: 38.89, prescriptionRequired: true, description: 'Loop diuretic for edema and hypertension' },
            { id: 'med_enalapril_10', name: 'Enalapril 10mg', genericName: 'Enalapril Maleate', brand: 'Vasotec', manufacturer: 'Dr. Reddys', categoryId: 'cat_nephrology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '10mg', unitType: 'Strip of 10', mrp: 45.00, purchasePrice: 32.00, marginPercentage: 40.63, prescriptionRequired: true, description: 'ACE inhibitor for hypertension and proteinuria' },
            
            // PULMONOLOGY  
            { id: 'med_salbutamol_inhaler', name: 'Salbutamol Inhaler', genericName: 'Salbutamol Sulphate', brand: 'Asthalin', manufacturer: 'Cipla', categoryId: 'cat_pulmonology', gstSlabId: gst5Id, dosageForm: 'Inhaler', strength: '100mcg/dose', unitType: '1 Inhaler (200 doses)', mrp: 145.00, purchasePrice: 105.00, marginPercentage: 38.10, prescriptionRequired: true, description: 'Short-acting beta2 agonist bronchodilator' },
            { id: 'med_budesonide_inhaler', name: 'Budesonide Inhaler', genericName: 'Budesonide', brand: 'Budecort', manufacturer: 'Cipla', categoryId: 'cat_pulmonology', gstSlabId: gst5Id, dosageForm: 'Inhaler', strength: '200mcg/dose', unitType: '1 Inhaler (120 doses)', mrp: 385.00, purchasePrice: 285.00, marginPercentage: 35.09, prescriptionRequired: true, description: 'Inhaled corticosteroid for asthma control' },
            { id: 'med_theophylline_300', name: 'Theophylline 300mg SR', genericName: 'Theophylline', brand: 'Deriphyllin', manufacturer: 'Zydus Cadila', categoryId: 'cat_pulmonology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '300mg', unitType: 'Strip of 10', mrp: 85.00, purchasePrice: 60.00, marginPercentage: 41.67, prescriptionRequired: true, description: 'Sustained-release bronchodilator' },
            
            // ADVANCED ONCOLOGY
            { id: 'med_imatinib_400', name: 'Imatinib 400mg', genericName: 'Imatinib Mesylate', brand: 'Glivec', manufacturer: 'Novartis India', categoryId: 'cat_oncology_advanced', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '400mg', unitType: 'Strip of 10', mrp: 8485.00, purchasePrice: 6485.00, marginPercentage: 30.84, prescriptionRequired: true, description: 'Tyrosine kinase inhibitor for CML and GIST' },
            { id: 'med_erlotinib_150', name: 'Erlotinib 150mg', genericName: 'Erlotinib HCl', brand: 'Tarceva', manufacturer: 'Roche India', categoryId: 'cat_oncology_advanced', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '150mg', unitType: 'Strip of 30', mrp: 12500.00, purchasePrice: 9500.00, marginPercentage: 31.58, prescriptionRequired: true, description: 'EGFR inhibitor for non-small cell lung cancer' },
            { id: 'med_bevacizumab_400', name: 'Bevacizumab 400mg', genericName: 'Bevacizumab', brand: 'Avastin', manufacturer: 'Roche India', categoryId: 'cat_oncology_advanced', gstSlabId: gst5Id, dosageForm: 'Injection', strength: '400mg/16ml', unitType: 'Vial 16ml', mrp: 48500.00, purchasePrice: 38500.00, marginPercentage: 25.97, prescriptionRequired: true, description: 'VEGF inhibitor monoclonal antibody' },
            { id: 'med_carboplatin_450', name: 'Carboplatin 450mg', genericName: 'Carboplatin', brand: 'Paraplatin', manufacturer: 'Bristol Myers', categoryId: 'cat_oncology_advanced', gstSlabId: gst5Id, dosageForm: 'Injection', strength: '450mg/45ml', unitType: 'Vial 45ml', mrp: 1850.00, purchasePrice: 1450.00, marginPercentage: 27.59, prescriptionRequired: true, description: 'Platinum-based chemotherapy agent' },
            
            // PSYCHIATRY
            { id: 'med_sertraline_50', name: 'Sertraline 50mg', genericName: 'Sertraline HCl', brand: 'Zoloft', manufacturer: 'Pfizer India', categoryId: 'cat_psychiatry', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '50mg', unitType: 'Strip of 10', mrp: 185.00, purchasePrice: 135.00, marginPercentage: 37.04, prescriptionRequired: true, description: 'SSRI antidepressant for depression and anxiety' },
            { id: 'med_olanzapine_10', name: 'Olanzapine 10mg', genericName: 'Olanzapine', brand: 'Zyprexa', manufacturer: 'Eli Lilly', categoryId: 'cat_psychiatry', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '10mg', unitType: 'Strip of 10', mrp: 385.00, purchasePrice: 285.00, marginPercentage: 35.09, prescriptionRequired: true, description: 'Atypical antipsychotic for schizophrenia' },
            { id: 'med_lorazepam_2', name: 'Lorazepam 2mg', genericName: 'Lorazepam', brand: 'Ativan', manufacturer: 'Sun Pharma', categoryId: 'cat_psychiatry', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '2mg', unitType: 'Strip of 10', mrp: 45.00, purchasePrice: 32.00, marginPercentage: 40.63, prescriptionRequired: true, description: 'Benzodiazepine for anxiety and insomnia' },
            
            // DERMATOLOGY
            { id: 'med_tretinoin_025', name: 'Tretinoin 0.025% Cream', genericName: 'Tretinoin', brand: 'Retin-A', manufacturer: 'Johnson & Johnson', categoryId: 'cat_dermatology', gstSlabId: gst5Id, dosageForm: 'Cream', strength: '0.025%', unitType: 'Tube 20g', mrp: 285.00, purchasePrice: 210.00, marginPercentage: 35.71, prescriptionRequired: true, description: 'Topical retinoid for acne and photoaging' },
            { id: 'med_betamethasone_cream', name: 'Betamethasone 0.1% Cream', genericName: 'Betamethasone Valerate', brand: 'Betnovate', manufacturer: 'GlaxoSmithKline', categoryId: 'cat_dermatology', gstSlabId: gst5Id, dosageForm: 'Cream', strength: '0.1%', unitType: 'Tube 15g', mrp: 125.00, purchasePrice: 90.00, marginPercentage: 38.89, prescriptionRequired: true, description: 'Topical corticosteroid for inflammatory skin conditions' },
            { id: 'med_ketoconazole_shampoo', name: 'Ketoconazole 2% Shampoo', genericName: 'Ketoconazole', brand: 'Nizoral', manufacturer: 'Johnson & Johnson', categoryId: 'cat_dermatology', gstSlabId: gst12Id, dosageForm: 'Shampoo', strength: '2%', unitType: 'Bottle 100ml', mrp: 485.00, purchasePrice: 315.00, marginPercentage: 53.97, prescriptionRequired: false, description: 'Antifungal shampoo for seborrheic dermatitis' },
            
            // OPHTHALMOLOGY
            { id: 'med_timolol_eye_drops', name: 'Timolol 0.5% Eye Drops', genericName: 'Timolol Maleate', brand: 'Timoptic', manufacturer: 'Alcon India', categoryId: 'cat_ophthalmology', gstSlabId: gst5Id, dosageForm: 'Eye Drops', strength: '0.5%', unitType: 'Bottle 5ml', mrp: 185.00, purchasePrice: 135.00, marginPercentage: 37.04, prescriptionRequired: true, description: 'Beta blocker for glaucoma and ocular hypertension' },
            { id: 'med_latanoprost_drops', name: 'Latanoprost 0.005% Drops', genericName: 'Latanoprost', brand: 'Xalatan', manufacturer: 'Pfizer India', categoryId: 'cat_ophthalmology', gstSlabId: gst5Id, dosageForm: 'Eye Drops', strength: '0.005%', unitType: 'Bottle 2.5ml', mrp: 485.00, purchasePrice: 365.00, marginPercentage: 32.88, prescriptionRequired: true, description: 'Prostaglandin analog for glaucoma treatment' },
            { id: 'med_artificial_tears', name: 'Artificial Tears Solution', genericName: 'Carboxymethylcellulose', brand: 'Refresh Tears', manufacturer: 'Allergan India', categoryId: 'cat_ophthalmology', gstSlabId: gst12Id, dosageForm: 'Eye Drops', strength: '0.5%', unitType: 'Bottle 10ml', mrp: 145.00, purchasePrice: 105.00, marginPercentage: 38.10, prescriptionRequired: false, description: 'Lubricating drops for dry eyes' },
            
            // ENT SPECIALTY
            { id: 'med_fluticasone_nasal', name: 'Fluticasone Nasal Spray', genericName: 'Fluticasone Propionate', brand: 'Flonase', manufacturer: 'GlaxoSmithKline', categoryId: 'cat_ent', gstSlabId: gst5Id, dosageForm: 'Nasal Spray', strength: '50mcg/spray', unitType: '1 Bottle (120 sprays)', mrp: 285.00, purchasePrice: 210.00, marginPercentage: 35.71, prescriptionRequired: true, description: 'Intranasal corticosteroid for allergic rhinitis' },
            { id: 'med_ciprofloxacin_ear_drops', name: 'Ciprofloxacin 0.3% Ear Drops', genericName: 'Ciprofloxacin HCl', brand: 'Ciloxan', manufacturer: 'Novartis India', categoryId: 'cat_ent', gstSlabId: gst5Id, dosageForm: 'Ear Drops', strength: '0.3%', unitType: 'Bottle 5ml', mrp: 145.00, purchasePrice: 105.00, marginPercentage: 38.10, prescriptionRequired: true, description: 'Antibiotic ear drops for otitis externa' },
            
            // ORTHOPEDICS
            { id: 'med_diclofenac_gel', name: 'Diclofenac 1% Gel', genericName: 'Diclofenac Diethylamine', brand: 'Voltaren Gel', manufacturer: 'Novartis India', categoryId: 'cat_orthopedics', gstSlabId: gst5Id, dosageForm: 'Gel', strength: '1%', unitType: 'Tube 30g', mrp: 185.00, purchasePrice: 135.00, marginPercentage: 37.04, prescriptionRequired: false, description: 'Topical NSAID for musculoskeletal pain' },
            { id: 'med_calcium_vitamin_d3', name: 'Calcium + Vitamin D3', genericName: 'Calcium Carbonate + Cholecalciferol', brand: 'Calcimax', manufacturer: 'Lupin', categoryId: 'cat_orthopedics', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '500mg + 250IU', unitType: 'Strip of 15', mrp: 125.00, purchasePrice: 90.00, marginPercentage: 38.89, prescriptionRequired: false, description: 'Calcium supplement with Vitamin D3' },
            { id: 'med_glucosamine_500', name: 'Glucosamine Sulfate 500mg', genericName: 'Glucosamine Sulfate', brand: 'Osteocare', manufacturer: 'Abbott India', categoryId: 'cat_orthopedics', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '500mg', unitType: 'Strip of 10', mrp: 285.00, purchasePrice: 210.00, marginPercentage: 35.71, prescriptionRequired: false, description: 'Joint health supplement' },
            
            // UROLOGY
            { id: 'med_tamsulosin_04', name: 'Tamsulosin 0.4mg', genericName: 'Tamsulosin HCl', brand: 'Flomax', manufacturer: 'Boehringer Ingelheim', categoryId: 'cat_urology', gstSlabId: gst5Id, dosageForm: 'Capsule', strength: '0.4mg', unitType: 'Strip of 10', mrp: 185.00, purchasePrice: 135.00, marginPercentage: 37.04, prescriptionRequired: true, description: 'Alpha blocker for benign prostatic hyperplasia' },
            { id: 'med_finasteride_5', name: 'Finasteride 5mg', genericName: 'Finasteride', brand: 'Proscar', manufacturer: 'MSD India', categoryId: 'cat_urology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '5mg', unitType: 'Strip of 10', mrp: 385.00, purchasePrice: 285.00, marginPercentage: 35.09, prescriptionRequired: true, description: '5-alpha reductase inhibitor for BPH' },
            { id: 'med_sildenafil_100', name: 'Sildenafil 100mg', genericName: 'Sildenafil Citrate', brand: 'Viagra', manufacturer: 'Pfizer India', categoryId: 'cat_urology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '100mg', unitType: 'Strip of 4', mrp: 1285.00, purchasePrice: 985.00, marginPercentage: 30.46, prescriptionRequired: true, description: 'PDE5 inhibitor for erectile dysfunction' },
            
            // GYNECOLOGY & OBSTETRICS
            { id: 'med_folic_acid_5', name: 'Folic Acid 5mg', genericName: 'Folic Acid', brand: 'Folvite', manufacturer: 'Abbott India', categoryId: 'cat_gynecology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '5mg', unitType: 'Strip of 10', mrp: 25.00, purchasePrice: 18.00, marginPercentage: 38.89, prescriptionRequired: false, description: 'Folate supplement for pregnancy and anemia' },
            { id: 'med_iron_folic_acid', name: 'Iron + Folic Acid', genericName: 'Ferrous Fumarate + Folic Acid', brand: 'IFA', manufacturer: 'Sun Pharma', categoryId: 'cat_gynecology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '200mg + 0.4mg', unitType: 'Strip of 10', mrp: 45.00, purchasePrice: 32.00, marginPercentage: 40.63, prescriptionRequired: false, description: 'Iron and folate supplement for pregnancy' },
            { id: 'med_mifepristone_200', name: 'Mifepristone 200mg', genericName: 'Mifepristone', brand: 'Mifeprex', manufacturer: 'Cipla', categoryId: 'cat_gynecology', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '200mg', unitType: 'Strip of 1', mrp: 485.00, purchasePrice: 365.00, marginPercentage: 32.88, prescriptionRequired: true, description: 'Anti-progestational agent for medical abortion' },
            
            // PEDIATRICS  
            { id: 'med_paracetamol_syrup', name: 'Paracetamol Pediatric Syrup', genericName: 'Paracetamol', brand: 'Crocin Syrup', manufacturer: 'GlaxoSmithKline', categoryId: 'cat_pediatrics', gstSlabId: gst5Id, dosageForm: 'Syrup', strength: '120mg/5ml', unitType: 'Bottle 60ml', mrp: 85.00, purchasePrice: 60.00, marginPercentage: 41.67, prescriptionRequired: false, description: 'Pediatric fever and pain relief syrup' },
            { id: 'med_amoxicillin_dry_syrup', name: 'Amoxicillin Dry Syrup', genericName: 'Amoxicillin', brand: 'Mox Syrup', manufacturer: 'Ranbaxy', categoryId: 'cat_pediatrics', gstSlabId: gst5Id, dosageForm: 'Dry Syrup', strength: '125mg/5ml', unitType: 'Bottle 30ml', mrp: 125.00, purchasePrice: 90.00, marginPercentage: 38.89, prescriptionRequired: true, description: 'Pediatric antibiotic suspension' },
            { id: 'med_ors_powder', name: 'ORS Powder', genericName: 'Oral Rehydration Salt', brand: 'Electral', manufacturer: 'FDC Limited', categoryId: 'cat_pediatrics', gstSlabId: gst5Id, dosageForm: 'Powder', strength: '21.8g sachet', unitType: 'Box of 10 sachets', mrp: 45.00, purchasePrice: 32.00, marginPercentage: 40.63, prescriptionRequired: false, description: 'Oral rehydration solution for diarrhea' },
            
            // CRITICAL CARE
            { id: 'med_noradrenaline_4', name: 'Noradrenaline 4mg/4ml', genericName: 'Noradrenaline Tartrate', brand: 'Levophed', manufacturer: 'Hospira India', categoryId: 'cat_critical_care', gstSlabId: gst5Id, dosageForm: 'Injection', strength: '4mg/4ml', unitType: 'Ampoule 4ml', mrp: 285.00, purchasePrice: 210.00, marginPercentage: 35.71, prescriptionRequired: true, description: 'Vasopressor for shock and hypotension' },
            { id: 'med_propofol_200', name: 'Propofol 200mg/20ml', genericName: 'Propofol', brand: 'Diprivan', manufacturer: 'AstraZeneca', categoryId: 'cat_critical_care', gstSlabId: gst5Id, dosageForm: 'Injection', strength: '200mg/20ml', unitType: 'Vial 20ml', mrp: 485.00, purchasePrice: 365.00, marginPercentage: 32.88, prescriptionRequired: true, description: 'Intravenous anesthetic agent' },
            { id: 'med_midazolam_5', name: 'Midazolam 5mg/5ml', genericName: 'Midazolam HCl', brand: 'Versed', manufacturer: 'Roche India', categoryId: 'cat_critical_care', gstSlabId: gst5Id, dosageForm: 'Injection', strength: '5mg/5ml', unitType: 'Ampoule 5ml', mrp: 185.00, purchasePrice: 135.00, marginPercentage: 37.04, prescriptionRequired: true, description: 'Benzodiazepine for sedation and anxiolysis' },
            
            // ANESTHESIA
            { id: 'med_sevoflurane_250', name: 'Sevoflurane 250ml', genericName: 'Sevoflurane', brand: 'Sevorane', manufacturer: 'Abbott India', categoryId: 'cat_anesthesia', gstSlabId: gst5Id, dosageForm: 'Inhalation', strength: '100%', unitType: 'Bottle 250ml', mrp: 2485.00, purchasePrice: 1920.00, marginPercentage: 29.43, prescriptionRequired: true, description: 'Volatile inhalational anesthetic' },
            { id: 'med_lignocaine_2', name: 'Lignocaine 2% with Adrenaline', genericName: 'Lignocaine HCl + Adrenaline', brand: 'Xylocaine', manufacturer: 'AstraZeneca', categoryId: 'cat_anesthesia', gstSlabId: gst5Id, dosageForm: 'Injection', strength: '20mg/ml + 1:200000', unitType: 'Vial 30ml', mrp: 85.00, purchasePrice: 60.00, marginPercentage: 41.67, prescriptionRequired: true, description: 'Local anesthetic with vasoconstrictor' },
            
            // RADIOLOGY & IMAGING
            { id: 'med_iohexol_350', name: 'Iohexol 350mg I/ml', genericName: 'Iohexol', brand: 'Omnipaque', manufacturer: 'GE Healthcare', categoryId: 'cat_radiology', gstSlabId: gst12Id, dosageForm: 'Injection', strength: '350mg I/ml', unitType: 'Vial 100ml', mrp: 1485.00, purchasePrice: 1150.00, marginPercentage: 29.13, prescriptionRequired: true, description: 'Non-ionic contrast medium for CT and angiography' },
            { id: 'med_gadolinium_dtpa', name: 'Gadolinium DTPA', genericName: 'Gadopentetic Acid', brand: 'Magnevist', manufacturer: 'Bayer India', categoryId: 'cat_radiology', gstSlabId: gst12Id, dosageForm: 'Injection', strength: '469.01mg/ml', unitType: 'Vial 15ml', mrp: 2485.00, purchasePrice: 1920.00, marginPercentage: 29.43, prescriptionRequired: true, description: 'MRI contrast agent' },
            
            // AYURVEDA & HERBAL
            { id: 'med_ashwagandha_500', name: 'Ashwagandha 500mg', genericName: 'Withania Somnifera', brand: 'Himalaya Ashvagandha', manufacturer: 'Himalaya Drug Company', categoryId: 'cat_ayurveda', gstSlabId: gst5Id, dosageForm: 'Tablet', strength: '500mg', unitType: 'Bottle of 60', mrp: 285.00, purchasePrice: 210.00, marginPercentage: 35.71, prescriptionRequired: false, description: 'Ayurvedic adaptogen for stress and vitality' },
            { id: 'med_triphala_powder', name: 'Triphala Powder', genericName: 'Terminalia Chebula + Terminalia Bellirica + Emblica Officinalis', brand: 'Dabur Triphala', manufacturer: 'Dabur India', categoryId: 'cat_ayurveda', gstSlabId: gst5Id, dosageForm: 'Powder', strength: '100g', unitType: 'Bottle 100g', mrp: 145.00, purchasePrice: 105.00, marginPercentage: 38.10, prescriptionRequired: false, description: 'Traditional Ayurvedic digestive and detox formula' },
            { id: 'med_brahmi_ghrita', name: 'Brahmi Ghrita', genericName: 'Bacopa Monnieri + Ghee', brand: 'Baidyanath Brahmi Ghrita', manufacturer: 'Shree Baidyanath', categoryId: 'cat_ayurveda', gstSlabId: gst5Id, dosageForm: 'Ghrita', strength: '100g', unitType: 'Jar 100g', mrp: 385.00, purchasePrice: 285.00, marginPercentage: 35.09, prescriptionRequired: false, description: 'Ayurvedic brain tonic and memory enhancer' }
        ];
        
        // Insert medicines with error handling
        let medicineCount = 0;
        let skippedCount = 0;
        
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
                medicineCount++;
            } catch (err) {
                console.log(`   ⚠️  Medicine skipped: ${med.name} - ${err.message}`);
                skippedCount++;
            }
        }
        
        console.log(`✅ Added ${medicineCount} comprehensive medicines`);
        if (skippedCount > 0) {
            console.log(`⚠️  Skipped ${skippedCount} medicines due to conflicts or errors`);
        }
        
        // 5. ADD COMPREHENSIVE STOCK ENTRIES
        console.log('\\n📦 Step 4: Adding comprehensive stock entries...');
        
        const stockEntries = [];
        const supplierIds = ['sup_sun_pharma', 'sup_dr_reddys', 'sup_cipla', 'sup_aurobindo', 'sup_lupin'];
        
        // Get random supplier and medicine combinations for stock
        const medicineStockSamples = [
            'med_atorvastatin_40', 'med_insulin_glargine', 'med_imatinib_400', 
            'med_bevacizumab_400', 'med_sertraline_50', 'med_sildenafil_100',
            'med_noradrenaline_4', 'med_sevoflurane_250', 'med_iohexol_350'
        ];
        
        let stockCount = 0;
        for (let i = 0; i < medicineStockSamples.length; i++) {
            const medicineId = medicineStockSamples[i];
            const supplierId = supplierIds[i % supplierIds.length];
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1 + (i % 3)); // 1-3 years expiry
            
            try {
                await client.query(`
                    INSERT INTO medicine_stock (id, "medicineId", "supplierId", "batchNumber", "expiryDate", quantity, "availableQuantity", "purchasePrice", mrp, "isActive", "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                `, [
                    medicineId, supplierId, `COMP${i + 1}${new Date().getFullYear()}`,
                    expiryDate, 25 + (i * 15), 25 + (i * 15),
                    500.00 + (i * 200), 750.00 + (i * 300), true
                ]);
                stockCount++;
            } catch (err) {
                console.log(`   ⚠️  Stock entry skipped for ${medicineId}`);
            }
        }
        
        console.log(`✅ Added ${stockCount} comprehensive stock entries`);
        
        await client.query('COMMIT');
        
        console.log('\\n🎉 MASSIVE COMPREHENSIVE MEDICINE DATABASE SEEDED SUCCESSFULLY!');
        console.log('═'.repeat(80));
        
        // Show final statistics
        const finalStats = await Promise.all([
            client.query('SELECT COUNT(*) FROM medicine_categories'),
            client.query('SELECT COUNT(*) FROM medicines'),
            client.query('SELECT COUNT(*) FROM suppliers'),
            client.query('SELECT COUNT(*) FROM medicine_stock')
        ]);
        
        console.log('\\n📊 FINAL COMPREHENSIVE DATABASE STATISTICS:');
        console.log('═'.repeat(60));
        console.log(`🏥 CATEGORIES: ${finalStats[0].rows[0].count} (Comprehensive Medical Specialties)`);
        console.log(`💊 MEDICINES: ${finalStats[1].rows[0].count} (Multi-Specialty Hospital Grade)`);
        console.log(`🏭 SUPPLIERS: ${finalStats[2].rows[0].count} (Major Indian Pharmaceutical Companies)`);
        console.log(`📦 STOCK ENTRIES: ${finalStats[3].rows[0].count} (With Batch & Expiry Tracking)`);
        
        // Show specialty highlights
        console.log('\\n🌟 SPECIALTY HIGHLIGHTS:');
        console.log('═'.repeat(60));
        
        const specialtyStats = await client.query(`
            SELECT 
                mc.name as category,
                COUNT(m.id) as medicine_count,
                MAX(m.mrp) as highest_price,
                MIN(m.mrp) as lowest_price
            FROM medicine_categories mc
            LEFT JOIN medicines m ON mc.id = m."categoryId"
            WHERE m.id IS NOT NULL AND mc.name IN (
                'Advanced Oncology', 'Cardiology', 'Endocrinology', 
                'Critical Care', 'Anesthesia', 'Radiology & Imaging'
            )
            GROUP BY mc.id, mc.name
            ORDER BY highest_price DESC
        `);
        
        specialtyStats.rows.forEach(spec => {
            console.log(`📂 ${spec.category}: ${spec.medicine_count} medicines (₹${parseFloat(spec.lowest_price)} - ₹${parseFloat(spec.highest_price)})`);
        });
        
        console.log('\\n✨ YOUR HOSPITAL IS NOW READY FOR COMPREHENSIVE MULTI-SPECIALTY OPERATIONS! ✨');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding massive comprehensive medicines:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedMassiveComprehensiveMedicines();
