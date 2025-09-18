-- Sample Indian Medicine Database with Real Market Data
-- This includes commonly prescribed medicines in Indian healthcare

-- Sample Medicines with proper Indian pricing and GST classification
INSERT INTO "Medicine" (
    "id", "genericName", "brandName", "manufacturer", "composition", "strength", 
    "dosageForm", "packSize", "unit", "categoryId", "gstSlabId", 
    "mrp", "purchasePrice", "sellingPrice", "marginPercentage", 
    "requiresPrescription", "hsn", "barcode"
) VALUES 

-- Analgesics & Pain Relief
('med_crocin_500', 'Paracetamol', 'Crocin 500', 'GSK', 'Paracetamol 500mg', '500mg', 'Tablet', 20, 'pieces', 'cat_analgesic', 'gst_12', 42.50, 35.00, 40.00, 14.29, false, '30042010', 'BAR001'),
('med_disprin_325', 'Aspirin', 'Disprin', 'Reckitt Benckiser', 'Aspirin 325mg', '325mg', 'Tablet', 10, 'pieces', 'cat_analgesic', 'gst_12', 15.75, 12.00, 14.50, 20.83, false, '30042010', 'BAR002'),
('med_combiflam', 'Ibuprofen + Paracetamol', 'Combiflam', 'Sanofi', 'Ibuprofen 400mg + Paracetamol 325mg', '400+325mg', 'Tablet', 20, 'pieces', 'cat_analgesic', 'gst_12', 55.20, 45.00, 52.00, 15.56, false, '30042010', 'BAR003'),
('med_volini_gel', 'Diclofenac Diethylamine', 'Volini Gel', 'Ranbaxy', 'Diclofenac Diethylamine 1.16%', '1.16%', 'Gel', 1, '30g tube', 'cat_analgesic', 'gst_12', 89.00, 72.00, 84.00, 16.67, false, '30049099', 'BAR004'),

-- Antibiotics (Life-saving - 5% GST)
('med_azithral_500', 'Azithromycin', 'Azithral 500', 'Alembic Pharma', 'Azithromycin 500mg', '500mg', 'Tablet', 3, 'pieces', 'cat_antibiotic', 'gst_5', 45.60, 35.00, 42.00, 20.00, true, '30041020', 'BAR005'),
('med_augmentin_625', 'Amoxicillin + Clavulanic Acid', 'Augmentin 625', 'GSK', 'Amoxicillin 500mg + Clavulanic Acid 125mg', '500+125mg', 'Tablet', 10, 'pieces', 'cat_antibiotic', 'gst_5', 180.25, 145.00, 170.00, 17.24, true, '30041020', 'BAR006'),
('med_ciproflox_500', 'Ciprofloxacin', 'Ciproflox 500', 'Ranbaxy', 'Ciprofloxacin 500mg', '500mg', 'Tablet', 10, 'pieces', 'cat_antibiotic', 'gst_5', 65.80, 52.00, 62.00, 19.23, true, '30041020', 'BAR007'),
('med_amoxil_250', 'Amoxicillin', 'Amoxil 250', 'GSK', 'Amoxicillin 250mg', '250mg', 'Capsule', 10, 'pieces', 'cat_antibiotic', 'gst_5', 32.45, 26.00, 30.50, 17.31, true, '30041020', 'BAR008'),

-- Antacids & Digestive (Standard 12% GST)
('med_eno_regular', 'Fruit Salt', 'ENO Regular', 'GSK', 'Sodium Bicarbonate + Citric Acid + Sodium Carbonate', 'Regular', 'Powder', 1, '100g bottle', 'cat_antacid', 'gst_12', 85.00, 68.00, 80.00, 17.65, false, '21069099', 'BAR009'),
('med_gelusil_mps', 'Magaldrate + Simethicone', 'Gelusil MPS', 'Pfizer', 'Magaldrate 480mg + Simethicone 20mg', '480+20mg', 'Tablet', 20, 'pieces', 'cat_antacid', 'gst_12', 48.30, 38.00, 45.00, 18.42, false, '30043910', 'BAR010'),
('med_digene_gel', 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone', 'Digene Gel', 'Abbott', 'Antacid + Anti-flatulent combination', 'Combination', 'Gel', 1, '170ml bottle', 'cat_antacid', 'gst_12', 72.60, 58.00, 68.00, 17.24, false, '30043910', 'BAR011'),

-- Cardiovascular (Life-saving - 5% GST)
('med_telma_40', 'Telmisartan', 'Telma 40', 'Glenmark', 'Telmisartan 40mg', '40mg', 'Tablet', 15, 'pieces', 'cat_cardiovascular', 'gst_5', 95.20, 76.00, 89.00, 17.11, true, '30041030', 'BAR012'),
('med_amlodac_5', 'Amlodipine', 'Amlodac 5', 'Zydus Cadila', 'Amlodipine 5mg', '5mg', 'Tablet', 10, 'pieces', 'cat_cardiovascular', 'gst_5', 42.75, 34.00, 40.00, 17.65, true, '30041030', 'BAR013'),
('med_ecosprin_75', 'Aspirin', 'Ecosprin 75', 'USV', 'Aspirin 75mg (Enteric Coated)', '75mg', 'Tablet', 14, 'pieces', 'cat_cardiovascular', 'gst_5', 8.95, 7.00, 8.50, 21.43, false, '30042010', 'BAR014'),
('med_atorva_20', 'Atorvastatin', 'Atorva 20', 'Zydus Cadila', 'Atorvastatin 20mg', '20mg', 'Tablet', 10, 'pieces', 'cat_cardiovascular', 'gst_5', 85.60, 68.00, 80.00, 17.65, true, '30041030', 'BAR015'),

-- Antidiabetic (Life-saving - 5% GST)
('med_glycomet_500', 'Metformin', 'Glycomet 500', 'USV', 'Metformin 500mg', '500mg', 'Tablet', 20, 'pieces', 'cat_diabetes', 'gst_5', 25.40, 20.00, 24.00, 20.00, true, '30041040', 'BAR016'),
('med_amaryl_2', 'Glimepiride', 'Amaryl 2', 'Sanofi', 'Glimepiride 2mg', '2mg', 'Tablet', 15, 'pieces', 'cat_diabetes', 'gst_5', 72.85, 58.00, 68.00, 17.24, true, '30041040', 'BAR017'),
('med_januvia_100', 'Sitagliptin', 'Januvia 100', 'MSD', 'Sitagliptin 100mg', '100mg', 'Tablet', 7, 'pieces', 'cat_diabetes', 'gst_5', 210.50, 168.00, 198.00, 17.86, true, '30041040', 'BAR018'),

-- Respiratory (Standard 12% GST)
('med_asthalin_100', 'Salbutamol', 'Asthalin 100mcg', 'Cipla', 'Salbutamol 100mcg', '100mcg', 'Inhaler', 1, '200 doses', 'cat_respiratory', 'gst_12', 145.80, 118.00, 137.00, 16.10, true, '30049019', 'BAR019'),
('med_alex_cough', 'Dextromethorphan + Phenylephrine + Chlorpheniramine', 'Alex Cough Syrup', 'Glenmark', 'Multi-ingredient cough syrup', 'Combination', 'Syrup', 1, '100ml bottle', 'cat_respiratory', 'gst_12', 65.30, 52.00, 61.50, 18.27, false, '30049099', 'BAR020'),
('med_levolin_2_5', 'Levosalbutamol', 'Levolin 2.5mg', 'Cipla', 'Levosalbutamol 2.5mg', '2.5mg', 'Respule', 5, '2.5ml vials', 'cat_respiratory', 'gst_12', 68.45, 54.00, 64.00, 18.52, true, '30049019', 'BAR021'),

-- Vitamins & Supplements (Higher rate 18% GST)
('med_becadexamin', 'Multivitamin + Minerals', 'Becadexamin', 'Glaxo', 'B-Complex + Vitamin C + Minerals', 'Combination', 'Capsule', 20, 'pieces', 'cat_vitamins', 'gst_18', 48.60, 38.00, 45.00, 18.42, false, '21069020', 'BAR022'),
('med_shelcal_500', 'Calcium Carbonate + Vitamin D3', 'Shelcal 500', 'Torrent', 'Calcium Carbonate 1250mg + Vitamin D3 250 IU', '1250+250', 'Tablet', 15, 'pieces', 'cat_vitamins', 'gst_18', 76.50, 60.00, 71.00, 18.33, false, '21069020', 'BAR023'),
('med_zincovit', 'Zinc + Multivitamins', 'Zincovit', 'Apex Laboratories', 'Zinc + B-Complex + Antioxidants', 'Combination', 'Tablet', 15, 'pieces', 'cat_vitamins', 'gst_18', 89.25, 70.00, 83.00, 18.57, false, '21069020', 'BAR024'),

-- Dermatological (Higher rate 18% GST)
('med_candid_cream', 'Clotrimazole', 'Candid Cream', 'Glenmark', 'Clotrimazole 1%', '1%', 'Cream', 1, '20g tube', 'cat_dermatology', 'gst_18', 42.80, 33.00, 39.50, 19.70, false, '30054010', 'BAR025'),
('med_betnovate_gm', 'Betamethasone + Gentamicin + Miconazole', 'Betnovate GM', 'GSK', 'Triple combination cream', 'Combination', 'Cream', 1, '20g tube', 'cat_dermatology', 'gst_18', 85.40, 66.00, 79.00, 19.70, true, '30054010', 'BAR026'),
('med_moisturex_soft', 'White Soft Paraffin + Liquid Paraffin', 'Moisturex Soft', 'Cipla', 'Emollient cream', 'Combination', 'Cream', 1, '60g tube', 'cat_dermatology', 'gst_18', 156.90, 122.00, 145.00, 18.85, false, '30054010', 'BAR027'),

-- Ophthalmic (Standard 12% GST)
('med_moxiflox_eye', 'Moxifloxacin', 'Moxiflox Eye Drops', 'Alcon', 'Moxifloxacin 0.5%', '0.5%', 'Eye Drops', 1, '5ml bottle', 'cat_ophthalmic', 'gst_12', 145.60, 118.00, 137.00, 16.10, true, '30049039', 'BAR028'),
('med_refresh_tears', 'Carboxymethylcellulose', 'Refresh Tears', 'Allergan', 'Carboxymethylcellulose 0.5%', '0.5%', 'Eye Drops', 1, '10ml bottle', 'cat_ophthalmic', 'gst_12', 89.50, 72.00, 84.00, 16.67, false, '30049099', 'BAR029'),

-- Neurological (Life-saving - 5% GST)
('med_eptoin_100', 'Phenytoin', 'Eptoin 100', 'Abbott', 'Phenytoin Sodium 100mg', '100mg', 'Tablet', 30, 'pieces', 'cat_neurological', 'gst_5', 45.80, 36.00, 42.50, 18.06, true, '30041050', 'BAR030'),
('med_tegretol_200', 'Carbamazepine', 'Tegretol 200', 'Novartis', 'Carbamazepine 200mg', '200mg', 'Tablet', 10, 'pieces', 'cat_neurological', 'gst_5', 28.70, 23.00, 27.00, 17.39, true, '30041050', 'BAR031'),

-- Antiseptics (Higher rate 18% GST)
('med_dettol_liquid', 'Chloroxylenol', 'Dettol Antiseptic Liquid', 'RB Health', 'Chloroxylenol 4.8%', '4.8%', 'Liquid', 1, '60ml bottle', 'cat_antiseptic', 'gst_18', 42.00, 32.00, 38.50, 20.31, false, '38089410', 'BAR032'),
('med_povidine_iodine', 'Povidone Iodine', 'Betadine Solution', 'Win-Medicare', 'Povidone Iodine 10%', '10%', 'Solution', 1, '60ml bottle', 'cat_antiseptic', 'gst_18', 85.60, 66.00, 79.00, 19.70, false, '38089410', 'BAR033'),

-- Gastrointestinal (Standard 12% GST)
('med_pantop_40', 'Pantoprazole', 'Pantop 40', 'Aristo', 'Pantoprazole 40mg', '40mg', 'Tablet', 15, 'pieces', 'cat_gastrointestinal', 'gst_12', 68.25, 54.00, 64.00, 18.52, true, '30043920', 'BAR034'),
('med_drotin_m', 'Drotaverine + Mefenamic Acid', 'Drotin M', 'Ranbaxy', 'Drotaverine 80mg + Mefenamic Acid 250mg', '80+250mg', 'Tablet', 10, 'pieces', 'cat_gastrointestinal', 'gst_12', 45.80, 36.00, 42.50, 18.06, true, '30043920', 'BAR035');

-- Add some sample suppliers
INSERT INTO "Supplier" (
    "id", "name", "contactPerson", "phone", "email", "address", 
    "city", "state", "pincode", "gstNumber", "licenseNumber", "creditDays"
) VALUES 
('supp_cipla', 'Cipla Ltd', 'Rajesh Kumar', '+91 9876543210', 'purchase@cipla.com', 'Cipla House, Peninsula Business Park, Ganpatrao Kadam Marg', 'Mumbai', 'Maharashtra', '400013', '27AABCC1234C1Z5', 'DL20B05000123', 30),
('supp_sun_pharma', 'Sun Pharmaceutical Industries', 'Amit Sharma', '+91 9876543211', 'orders@sunpharma.com', 'Sun House, 201 B/1, Western Express Highway', 'Mumbai', 'Maharashtra', '400063', '27AABCS1234D1Z6', 'DL20B05000124', 45),
('supp_dr_reddys', 'Dr. Reddy\'s Laboratories', 'Priya Singh', '+91 9876543212', 'procurement@drreddys.com', '8-2-337, Road No. 3, Banjara Hills', 'Hyderabad', 'Telangana', '500034', '36AABCD1234E1Z7', 'AP20B05000125', 30),
('supp_aurobindo', 'Aurobindo Pharma Ltd', 'Vikram Reddy', '+91 9876543213', 'supply@aurobindo.com', 'Plot No. 2, Maitrivihar, Ameerpet', 'Hyderabad', 'Telangana', '500038', '36AABCA1234F1Z8', 'AP20B05000126', 60),
('supp_glenmark', 'Glenmark Pharmaceuticals', 'Neha Patel', '+91 9876543214', 'vendor@glenmark.com', 'B/2, Mahalaxmi Chambers, 22 Bhulabhai Desai Road', 'Mumbai', 'Maharashtra', '400026', '27AABCG1234G1Z9', 'DL20B05000127', 30);
