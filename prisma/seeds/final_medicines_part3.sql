-- Final Comprehensive Indian Medicine Database - Part 3
-- Rare, specialized, niche medications, medical devices, and consumables

-- Add final specialized categories
INSERT INTO "MedicineCategory" ("id", "name", "description", "gstRate") VALUES 
('cat_immunology', 'Immunology', 'Immunosuppressive and autoimmune disease medications', 5.0),
('cat_chemotherapy', 'Chemotherapy', 'Cancer chemotherapy agents', 5.0),
('cat_biologics', 'Biologics', 'Biological and monoclonal antibody therapies', 5.0),
('cat_medical_devices', 'Medical Devices', 'Medical devices and consumables', 18.0),
('cat_wound_care', 'Wound Care', 'Wound dressings and healing products', 18.0),
('cat_diagnostic', 'Diagnostic', 'Diagnostic agents and test kits', 12.0),
('cat_nutrition', 'Clinical Nutrition', 'Enteral nutrition and specialized feeds', 18.0)
ON CONFLICT ("id") DO NOTHING;

-- Insert final comprehensive medicines
INSERT INTO "Medicine" ("id", "name", "genericName", "brand", "manufacturer", "categoryId", "dosageForm", "strength", "unitType", "mrp", "purchasePrice", "marginPercentage", "prescriptionRequired", "isActive", "description", "sideEffects", "contraindications", "dosageInstructions") VALUES

-- IMMUNOLOGY & BIOLOGICS (5% GST)
('med_cyclosporine_25', 'Cyclosporine 25mg', 'Cyclosporine', 'Panimun', 'Panacea Biotec', 'cat_immunology', 'Capsule', '25mg', 'Strip of 10', 485.00, 365.00, 32.88, true, true, 'Immunosuppressive for organ transplant', 'Nephrotoxicity, hypertension', 'Hypersensitivity, uncontrolled infections', '2.5-15mg/kg daily in divided doses'),
('med_mycophenolate_500', 'Mycophenolate Mofetil 500mg', 'Mycophenolate Mofetil', 'Cellcept', 'Roche', 'cat_immunology', 'Tablet', '500mg', 'Strip of 10', 1285.00, 985.00, 30.46, true, true, 'Immunosuppressive for transplant rejection prevention', 'GI upset, bone marrow suppression', 'Pregnancy, severe GI disease', '1-1.5g twice daily'),
('med_azathioprine_50', 'Azathioprine 50mg', 'Azathioprine', 'Imuran', 'GlaxoSmithKline', 'cat_immunology', 'Tablet', '50mg', 'Strip of 25', 185.00, 135.00, 37.04, true, true, 'Immunosuppressive for autoimmune diseases', 'Bone marrow suppression, hepatotoxicity', 'Pregnancy, severe infections', '1-3mg/kg daily'),
('med_rituximab_100', 'Rituximab Injection', 'Rituximab', 'Mabthera', 'Roche', 'cat_biologics', 'Injection', '100mg/10ml', 'Vial 10ml', 28500.00, 22500.00, 26.67, true, true, 'Monoclonal antibody for lymphoma/RA', 'Infusion reactions, immunosuppression', 'Active severe infections', 'IV infusion as per oncology protocol'),

-- CHEMOTHERAPY (5% GST)
('med_doxorubicin_50', 'Doxorubicin Injection', 'Doxorubicin HCl', 'Adriamycin', 'Pfizer', 'cat_chemotherapy', 'Injection', '50mg/25ml', 'Vial 25ml', 2485.00, 1920.00, 29.43, true, true, 'Anthracycline chemotherapy agent', 'Cardiotoxicity, alopecia, nausea', 'Severe cardiac impairment, pregnancy', 'IV infusion as per oncology protocol only'),
('med_cisplatin_50', 'Cisplatin Injection', 'Cisplatin', 'Kemoplat', 'Fresenius Kabi', 'cat_chemotherapy', 'Injection', '50mg/50ml', 'Vial 50ml', 1485.00, 1150.00, 29.13, true, true, 'Platinum-based chemotherapy agent', 'Nephrotoxicity, ototoxicity, neuropathy', 'Severe renal impairment, hearing loss', 'IV infusion with pre/post hydration'),
('med_cyclophosphamide_500', 'Cyclophosphamide Injection', 'Cyclophosphamide', 'Endoxan', 'Zydus Cadila', 'cat_chemotherapy', 'Injection', '500mg', 'Vial 500mg', 385.00, 295.00, 30.51, true, true, 'Alkylating chemotherapy agent', 'Hemorrhagic cystitis, alopecia', 'Severe bone marrow suppression', 'IV injection as per chemotherapy protocol'),
('med_paclitaxel_100', 'Paclitaxel Injection', 'Paclitaxel', 'Taxol', 'Bristol Myers Squibb', 'cat_chemotherapy', 'Injection', '100mg/16.7ml', 'Vial 16.7ml', 4850.00, 3785.00, 28.13, true, true, 'Taxane chemotherapy for various cancers', 'Hypersensitivity, peripheral neuropathy', 'Severe neutropenia, pregnancy', 'IV infusion with premedication'),

-- SPECIALIZED CARDIOVASCULAR (5% GST)
('med_digoxin_0_25', 'Digoxin 0.25mg', 'Digoxin', 'Lanoxin', 'Aspen', 'cat_cardiovascular', 'Tablet', '0.25mg', 'Strip of 30', 85.00, 60.00, 41.67, true, true, 'Cardiac glycoside for heart failure', 'Arrhythmias, visual disturbances', 'Ventricular tachycardia, heart block', '0.125-0.25mg daily with monitoring'),
('med_amiodarone_200', 'Amiodarone 200mg', 'Amiodarone HCl', 'Cordarone', 'Sanofi', 'cat_cardiovascular', 'Tablet', '200mg', 'Strip of 10', 125.00, 90.00, 38.89, true, true, 'Antiarrhythmic for serious arrhythmias', 'Pulmonary toxicity, thyroid dysfunction', 'Sinus bradycardia, AV block', '200mg 3 times daily initially'),
('med_isosorbide_dinitrate_5', 'Isosorbide Dinitrate 5mg', 'Isosorbide Dinitrate', 'Sorbitrate', 'Abbott', 'cat_cardiovascular', 'Tablet', '5mg', 'Strip of 30', 45.00, 32.00, 40.63, false, true, 'Long-acting nitrate for angina', 'Headache, hypotension', 'Severe hypotension, increased ICP', '5-20mg 2-3 times daily'),

-- ADVANCED ANTIBIOTICS (5% GST)
('med_vancomycin_500', 'Vancomycin Injection', 'Vancomycin HCl', 'Vancocin', 'Pfizer', 'cat_antibiotic', 'Injection', '500mg', 'Vial 500mg', 285.00, 220.00, 29.55, true, true, 'Glycopeptide antibiotic for MRSA', 'Red man syndrome, nephrotoxicity', 'Hypersensitivity', 'IV infusion with level monitoring'),
('med_linezolid_600', 'Linezolid 600mg', 'Linezolid', 'Zyvox', 'Pfizer', 'cat_antibiotic', 'Tablet', '600mg', 'Strip of 4', 1285.00, 985.00, 30.46, true, true, 'Oxazolidinone antibiotic for resistant Gram-positive', 'Thrombocytopenia, peripheral neuropathy', 'MAOI use', '600mg twice daily'),
('med_meropenem_500', 'Meropenem Injection', 'Meropenem', 'Meronem', 'AstraZeneca', 'cat_antibiotic', 'Injection', '500mg', 'Vial 500mg', 485.00, 370.00, 31.08, true, true, 'Carbapenem antibiotic for severe infections', 'Seizures, C. diff colitis', 'Hypersensitivity to carbapenems', 'IV injection every 8 hours'),
('med_colistin_4_5mu', 'Colistin Injection', 'Colistimethate Sodium', 'Coly-Mycin', 'Pfizer', 'cat_antibiotic', 'Injection', '4.5MU', 'Vial', 285.00, 220.00, 29.55, true, true, 'Last resort antibiotic for MDR Gram-negative', 'Nephrotoxicity, neurotoxicity', 'Severe renal impairment', 'IV/IM injection with monitoring'),

-- ADVANCED NEUROLOGICAL (5% GST)
('med_levetiracetam_500', 'Levetiracetam 500mg', 'Levetiracetam', 'Keppra', 'UCB Pharma', 'cat_neurological', 'Tablet', '500mg', 'Strip of 10', 185.00, 135.00, 37.04, true, true, 'Newer anti-epileptic drug', 'Behavioral changes, somnolence', 'Hypersensitivity', '500mg twice daily initially'),
('med_pregabalin_75', 'Pregabalin 75mg', 'Pregabalin', 'Lyrica', 'Pfizer', 'cat_neurological', 'Capsule', '75mg', 'Strip of 10', 125.00, 90.00, 38.89, true, true, 'Anticonvulsant for neuropathic pain', 'Weight gain, peripheral edema', 'Hypersensitivity', '75mg twice daily initially'),
('med_donepezil_10', 'Donepezil 10mg', 'Donepezil HCl', 'Aricept', 'Eisai', 'cat_neurological', 'Tablet', '10mg', 'Strip of 10', 385.00, 295.00, 30.51, true, true, 'Cholinesterase inhibitor for Alzheimer', 'Nausea, vomiting, diarrhea', 'Sick sinus syndrome, GI bleeding', '5-10mg once daily'),

-- HORMONES & FERTILITY (5% GST)
('med_hcg_5000', 'HCG Injection', 'Human Chorionic Gonadotropin', 'Pregnyl', 'Organon', 'cat_endocrinology', 'Injection', '5000 IU', 'Vial', 485.00, 370.00, 31.08, true, true, 'Fertility hormone injection', 'OHSS, injection site reactions', 'Prostate cancer, breast cancer', 'IM injection as per fertility protocol'),
('med_testosterone_250', 'Testosterone Injection', 'Testosterone Enanthate', 'Testoviron', 'Bayer', 'cat_endocrinology', 'Injection', '250mg/ml', 'Ampoule 1ml', 185.00, 135.00, 37.04, true, true, 'Testosterone replacement therapy', 'Prostate enlargement, polycythemia', 'Prostate/breast cancer', 'IM injection every 2-4 weeks'),
('med_growth_hormone_4mg', 'Human Growth Hormone', 'Somatropin', 'Genotropin', 'Pfizer', 'cat_endocrinology', 'Injection', '4mg', 'Cartridge', 2485.00, 1920.00, 29.43, true, true, 'Growth hormone for growth disorders', 'Joint pain, insulin resistance', 'Active malignancy, diabetic retinopathy', 'SC injection daily as prescribed'),

-- MEDICAL DEVICES & CONSUMABLES (18% GST)
('med_insulin_syringes', 'Insulin Syringes', 'Disposable Insulin Syringes', 'BD Ultra-Fine', 'BD', 'cat_medical_devices', 'Syringe', '1ml/30G', 'Box of 100', 485.00, 315.00, 53.97, false, true, 'Insulin administration syringes', 'None significant', 'Reuse, sharing', 'Single use only for insulin injection'),
('med_glucometer_strips', 'Glucose Test Strips', 'Blood Glucose Test Strips', 'Accu-Chek Active', 'Roche', 'cat_medical_devices', 'Test Strips', 'N/A', 'Box of 50', 785.00, 510.00, 53.92, false, true, 'Blood glucose monitoring strips', 'None', 'Expired strips', 'Use with compatible glucometer'),
('med_urine_dipsticks', 'Urine Dipsticks', 'Multi-parameter Urine Test Strips', 'Combur', 'Roche', 'cat_diagnostic', 'Test Strips', '10 Parameters', 'Bottle of 100', 1285.00, 825.00, 55.76, false, true, 'Urine analysis dipsticks', 'None', 'Expired strips', 'Dip in fresh urine sample'),
('med_ecg_electrodes', 'ECG Electrodes', 'Disposable ECG Electrodes', '3M Red Dot', '3M', 'cat_medical_devices', 'Electrodes', 'Adult', 'Pouch of 50', 285.00, 185.00, 54.05, false, true, 'ECG monitoring electrodes', 'Skin irritation in sensitive patients', 'Allergic to adhesive', 'Single use for ECG monitoring'),

-- WOUND CARE (18% GST)
('med_hydrocolloid_dressing', 'Hydrocolloid Dressing', 'Hydrocolloid Wound Dressing', 'DuoDerm', 'ConvaTec', 'cat_wound_care', 'Dressing', '10cm x 10cm', 'Box of 10', 485.00, 315.00, 53.97, false, true, 'Advanced wound dressing', 'Allergic reaction to adhesive', 'Infected wounds', 'Change every 3-7 days or as needed'),
('med_alginate_dressing', 'Alginate Dressing', 'Calcium Alginate Dressing', 'Kaltostat', 'ConvaTec', 'cat_wound_care', 'Dressing', '10cm x 10cm', 'Box of 10', 685.00, 445.00, 53.93, false, true, 'Absorptive dressing for exuding wounds', 'None significant', 'Dry wounds', 'Change daily or when saturated'),
('med_silver_dressing', 'Silver Antimicrobial Dressing', 'Silver Sulfadiazine Dressing', 'Acticoat', 'Smith & Nephew', 'cat_wound_care', 'Dressing', '10cm x 10cm', 'Box of 5', 1285.00, 835.00, 53.89, false, true, 'Antimicrobial wound dressing', 'Silver staining', 'Silver allergy', 'Change every 3 days or as clinically indicated'),

-- CLINICAL NUTRITION (18% GST)
('med_enteral_nutrition', 'Enteral Nutrition Formula', 'Complete Nutritional Formula', 'Ensure', 'Abbott', 'cat_nutrition', 'Powder', '400g', 'Tin', 485.00, 315.00, 53.97, false, true, 'Complete nutritional supplement', 'GI intolerance', 'Galactosemia', 'Mix with water as per instructions'),
('med_protein_powder', 'Protein Supplement', 'Whey Protein Isolate', 'Resource Protein', 'Nestle', 'cat_nutrition', 'Powder', '200g', 'Tin', 785.00, 510.00, 53.92, false, true, 'High protein nutritional supplement', 'Lactose intolerance', 'Milk protein allergy', 'Mix with liquid as directed'),

-- ADVANCED RESPIRATORY (5% GST)
('med_ipratropium_inhaler', 'Ipratropium Inhaler', 'Ipratropium Bromide', 'Atrovent', 'Boehringer Ingelheim', 'cat_respiratory', 'Inhaler', '20mcg/puff', 'Inhaler 200 doses', 285.00, 220.00, 29.55, false, true, 'Anticholinergic bronchodilator', 'Dry mouth, cough', 'Hypersensitivity to atropine', '2 puffs 4 times daily'),
('med_formoterol_inhaler', 'Formoterol Inhaler', 'Formoterol Fumarate', 'Foracort', 'Cipla', 'cat_respiratory', 'Inhaler', '6mcg/puff', 'Inhaler 120 doses', 185.00, 135.00, 37.04, true, true, 'Long-acting bronchodilator', 'Tremor, palpitations', 'Arrhythmias', '2 puffs twice daily'),
('med_budesonide_inhaler', 'Budesonide Inhaler', 'Budesonide', 'Pulmicort', 'AstraZeneca', 'cat_respiratory', 'Inhaler', '100mcg/puff', 'Inhaler 200 doses', 385.00, 295.00, 30.51, true, true, 'Inhaled corticosteroid', 'Oral thrush, hoarseness', 'Respiratory tract infections', '1-2 puffs twice daily'),

-- SPECIALIZED GASTROINTESTINAL (5% GST)
('med_mesalamine_800', 'Mesalamine 800mg', 'Mesalamine', 'Asacol', 'Procter & Gamble', 'cat_gastrointestinal', 'Tablet', '800mg', 'Strip of 10', 185.00, 135.00, 37.04, true, true, 'Anti-inflammatory for IBD', 'Headache, abdominal pain', 'Salicylate hypersensitivity', '800mg 3 times daily'),
('med_ursodeoxycholic_300', 'Ursodeoxycholic Acid 300mg', 'Ursodeoxycholic Acid', 'Udiliv', 'Abbott', 'cat_gastrointestinal', 'Tablet', '300mg', 'Strip of 10', 285.00, 220.00, 29.55, false, true, 'Hepatoprotective and choleretic', 'Diarrhea, pruritus', 'Acute cholecystitis', '8-10mg/kg daily in divided doses'),

-- TOPICAL ANESTHETICS (5% GST)
('med_lidocaine_gel', 'Lidocaine Gel 2%', 'Lidocaine HCl', 'Xylocaine Jelly', 'AstraZeneca', 'cat_anesthetics', 'Gel', '2%', 'Tube 30g', 85.00, 60.00, 41.67, false, true, 'Topical anesthetic gel', 'Local irritation', 'Hypersensitivity', 'Apply to affected area as needed'),
('med_benzocaine_spray', 'Benzocaine Throat Spray', 'Benzocaine', 'Anesthol', 'Reckitt Benckiser', 'cat_anesthetics', 'Spray', '20%', 'Bottle 15ml', 125.00, 90.00, 38.89, false, true, 'Topical anesthetic for throat', 'Methemoglobinemia (rare)', 'Infants under 2 years', '3-4 sprays every 2-3 hours'),

-- SPECIALIZED SUPPLEMENTS (18% GST)
('med_coq10_100', 'Coenzyme Q10 100mg', 'Ubiquinone', 'CoQ10', 'Now Foods', 'cat_vitamins', 'Capsule', '100mg', 'Bottle of 30', 1285.00, 835.00, 53.89, false, true, 'Antioxidant supplement for heart health', 'GI upset', 'Anticoagulant interactions', '100mg 1-2 times daily'),
('med_omega_3_1000', 'Omega-3 1000mg', 'EPA/DHA', 'Seven Seas', 'Merck', 'cat_vitamins', 'Capsule', '1000mg', 'Bottle of 30', 485.00, 315.00, 53.97, false, true, 'Essential fatty acid supplement', 'Fishy aftertaste, GI upset', 'Fish allergy', '1-2 capsules daily with meals'),
('med_probiotics_10billion', 'Probiotics 10 Billion CFU', 'Multi-strain Probiotics', 'Bifilac', 'Tablets India', 'cat_vitamins', 'Capsule', '10 Billion CFU', 'Strip of 10', 285.00, 185.00, 54.05, false, true, 'Multi-strain probiotic supplement', 'Initial GI discomfort', 'Immunocompromised state', '1 capsule daily');

-- Insert more specialized suppliers
INSERT INTO "Supplier" ("id", "name", "contactPerson", "phone", "email", "address", "gstNumber", "creditTerms", "isActive") VALUES
('sup_specialty_pharma', 'Specialty Pharma International', 'Dr. Arun Mehta', '+91-9876543220', 'arun@specialtypharma.com', '789 Specialty Complex, Mumbai - 400001', '27ABCDE1234F3B1', 60, true),
('sup_biocon_biologics', 'Biocon Biologics', 'Ms. Rashmi Iyer', '+91-9876543221', 'rashmi@biocon.com', '456 Biocon Park, Bangalore - 560100', '29ABCDE1234F3B2', 90, true),
('sup_medical_consumables', 'Advanced Medical Consumables', 'Mr. Vijay Gupta', '+91-9876543222', 'vijay@medconsumables.com', '123 Device Street, Gurgaon - 122001', '06ABCDE1234F3B3', 30, true),
('sup_nutrition_plus', 'Nutrition Plus Healthcare', 'Ms. Neha Agarwal', '+91-9876543223', 'neha@nutritionplus.com', '654 Health Avenue, Pune - 411001', '27ABCDE1234F3B4', 45, true),
('sup_oncology_care', 'Oncology Care Suppliers', 'Dr. Sanjiv Kumar', '+91-9876543224', 'sanjiv@oncologycare.com', '987 Cancer Centre Road, Delhi - 110029', '07ABCDE1234F3B5', 75, true);

-- Insert stock entries for specialized medicines
INSERT INTO "MedicineStock" ("medicineId", "supplierId", "batchNumber", "expiryDate", "quantity", "purchasePrice", "mrp", "manufacturingDate", "location") VALUES
('med_rituximab_100', 'sup_biocon_biologics', 'RTX2024026', '2025-06-30', 5, 22500.00, 28500.00, '2024-01-10', 'Oncology Refrigerator'),
('med_doxorubicin_50', 'sup_oncology_care', 'DOX2024027', '2025-05-31', 10, 1920.00, 2485.00, '2024-02-15', 'Chemo Store'),
('med_vancomycin_500', 'sup_specialty_pharma', 'VAN2024028', '2025-04-30', 20, 220.00, 285.00, '2024-01-05', 'ICU Store'),
('med_linezolid_600', 'sup_specialty_pharma', 'LIN2024029', '2025-08-15', 15, 985.00, 1285.00, '2024-02-20', 'ID Specialist Store'),
('med_cyclosporine_25', 'sup_biocon_biologics', 'CYC2024030', '2025-12-31', 50, 365.00, 485.00, '2024-01-12', 'Transplant Store'),
('med_insulin_syringes', 'sup_medical_consumables', 'ISY2024031', '2026-12-31', 1000, 315.00, 485.00, '2024-02-01', 'Consumables Store'),
('med_glucometer_strips', 'sup_medical_consumables', 'GLS2024032', '2025-03-31', 200, 510.00, 785.00, '2024-01-15', 'Lab Store'),
('med_growth_hormone_4mg', 'sup_specialty_pharma', 'GHR2024033', '2025-07-31', 12, 1920.00, 2485.00, '2024-02-10', 'Endo Refrigerator'),
('med_hydrocolloid_dressing', 'sup_medical_consumables', 'HYD2024034', '2026-06-30', 100, 315.00, 485.00, '2024-01-20', 'Wound Care Store'),
('med_enteral_nutrition', 'sup_nutrition_plus', 'ENT2024035', '2025-11-30', 50, 315.00, 485.00, '2024-02-05', 'Nutrition Store');

COMMIT;
