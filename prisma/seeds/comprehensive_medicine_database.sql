-- Comprehensive Indian Medicine Database
-- Updated with current GST rates and expanded medicine categories

-- Clear existing data (for re-running the seed)
DELETE FROM "MedicineStock" WHERE 1=1;
DELETE FROM "Medicine" WHERE 1=1;
DELETE FROM "Supplier" WHERE 1=1;

-- Insert comprehensive list of Indian medicines across all dosage forms
INSERT INTO "Medicine" ("id", "name", "genericName", "brand", "manufacturer", "categoryId", "dosageForm", "strength", "unitType", "mrp", "purchasePrice", "marginPercentage", "prescriptionRequired", "isActive", "description", "sideEffects", "contraindications", "dosageInstructions") VALUES

-- ANALGESICS & ANTI-INFLAMMATORY (5% GST)
('med_paracetamol_500', 'Paracetamol 500mg', 'Paracetamol', 'Crocin', 'GlaxoSmithKline', 'cat_analgesic', 'Tablet', '500mg', 'Strip of 10', 25.50, 18.00, 41.67, false, true, 'Pain reliever and fever reducer', 'Nausea, skin rash in rare cases', 'Liver disease, alcohol dependency', 'Adults: 1-2 tablets every 4-6 hours. Max 8 tablets/day'),
('med_ibuprofen_400', 'Ibuprofen 400mg', 'Ibuprofen', 'Brufen', 'Abbott', 'cat_analgesic', 'Tablet', '400mg', 'Strip of 10', 45.00, 32.00, 40.63, false, true, 'Anti-inflammatory pain reliever', 'Stomach upset, dizziness', 'Peptic ulcer, kidney disease', 'Adults: 1 tablet 3-4 times daily after meals'),
('med_diclofenac_50', 'Diclofenac Sodium 50mg', 'Diclofenac Sodium', 'Voveran', 'Novartis', 'cat_analgesic', 'Tablet', '50mg', 'Strip of 10', 42.00, 28.50, 47.37, true, true, 'Non-steroidal anti-inflammatory drug', 'Gastric irritation, headache', 'Cardiac problems, renal impairment', '1 tablet 2-3 times daily with food'),
('med_aspirin_75', 'Aspirin 75mg', 'Aspirin', 'Ecosprin', 'USV', 'cat_analgesic', 'Tablet', '75mg', 'Strip of 14', 18.00, 12.50, 44.00, false, true, 'Low-dose aspirin for cardiac protection', 'Bleeding, gastric irritation', 'Bleeding disorders, children with viral infections', '1 tablet daily after breakfast'),
('med_nimesulide_100', 'Nimesulide 100mg', 'Nimesulide', 'Nise', 'Dr. Reddys', 'cat_analgesic', 'Tablet', '100mg', 'Strip of 10', 38.50, 26.00, 48.08, true, true, 'Anti-inflammatory and analgesic', 'Liver toxicity, skin reactions', 'Liver disease, children under 12', '1 tablet twice daily after meals'),

-- ANTIBIOTICS (5% GST)
('med_amoxicillin_500', 'Amoxicillin 500mg', 'Amoxicillin', 'Mox', 'Ranbaxy', 'cat_antibiotic', 'Capsule', '500mg', 'Strip of 10', 85.00, 60.00, 41.67, true, true, 'Broad-spectrum antibiotic', 'Diarrhea, nausea, skin rash', 'Penicillin allergy', '1 capsule 3 times daily for 5-7 days'),
('med_azithromycin_500', 'Azithromycin 500mg', 'Azithromycin', 'Azee', 'Cipla', 'cat_antibiotic', 'Tablet', '500mg', 'Strip of 3', 95.00, 68.00, 39.71, true, true, 'Macrolide antibiotic', 'Stomach pain, diarrhea', 'Liver disease, heart rhythm disorders', '1 tablet daily for 3 days'),
('med_ciprofloxacin_500', 'Ciprofloxacin 500mg', 'Ciprofloxacin', 'Cifran', 'Ranbaxy', 'cat_antibiotic', 'Tablet', '500mg', 'Strip of 10', 78.00, 55.00, 41.82, true, true, 'Quinolone antibiotic', 'Nausea, dizziness, tendon pain', 'Children under 18, pregnancy', '1 tablet twice daily for 7-14 days'),
('med_cephalexin_500', 'Cephalexin 500mg', 'Cephalexin', 'Sporidex', 'Ranbaxy', 'cat_antibiotic', 'Capsule', '500mg', 'Strip of 10', 92.00, 65.00, 41.54, true, true, 'Cephalosporin antibiotic', 'Diarrhea, stomach upset', 'Cephalosporin allergy', '1 capsule 4 times daily'),
('med_doxycycline_100', 'Doxycycline 100mg', 'Doxycycline', 'Doxy-1', 'Cipla', 'cat_antibiotic', 'Capsule', '100mg', 'Strip of 10', 68.00, 48.00, 41.67, true, true, 'Tetracycline antibiotic', 'Photosensitivity, GI upset', 'Pregnancy, children under 8', '1 capsule twice daily'),

-- ANTACIDS & GASTROINTESTINAL (5% GST)
('med_omeprazole_20', 'Omeprazole 20mg', 'Omeprazole', 'Prilosec', 'Cipla', 'cat_gastrointestinal', 'Capsule', '20mg', 'Strip of 10', 48.00, 34.00, 41.18, false, true, 'Proton pump inhibitor', 'Headache, diarrhea, abdominal pain', 'Liver disease', '1 capsule daily before breakfast'),
('med_pantoprazole_40', 'Pantoprazole 40mg', 'Pantoprazole', 'Pantop', 'Aristo', 'cat_gastrointestinal', 'Tablet', '40mg', 'Strip of 10', 52.00, 37.00, 40.54, false, true, 'Proton pump inhibitor for acid reflux', 'Headache, dizziness', 'Severe liver impairment', '1 tablet daily on empty stomach'),
('med_ranitidine_150', 'Ranitidine 150mg', 'Ranitidine', 'Aciloc', 'Cadila', 'cat_gastrointestinal', 'Tablet', '150mg', 'Strip of 10', 35.00, 25.00, 40.00, false, true, 'H2 receptor blocker', 'Headache, constipation', 'Kidney disease', '1 tablet twice daily'),
('med_domperidone_10', 'Domperidone 10mg', 'Domperidone', 'Domstal', 'Torrent', 'cat_gastrointestinal', 'Tablet', '10mg', 'Strip of 10', 28.00, 20.00, 40.00, false, true, 'Anti-nausea and prokinetic agent', 'Dry mouth, headache', 'Cardiac arrhythmias', '1 tablet 3 times daily before meals'),
('med_loperamide_2', 'Loperamide 2mg', 'Loperamide', 'Imodium', 'Johnson & Johnson', 'cat_gastrointestinal', 'Capsule', '2mg', 'Strip of 6', 45.00, 32.00, 40.63, false, true, 'Anti-diarrheal medication', 'Constipation, dizziness', 'Bacterial gastroenteritis', '2 capsules initially, then 1 after each loose stool'),

-- CARDIOVASCULAR (5% GST)
('med_atenolol_50', 'Atenolol 50mg', 'Atenolol', 'Tenormin', 'AstraZeneca', 'cat_cardiovascular', 'Tablet', '50mg', 'Strip of 14', 55.00, 39.00, 41.03, true, true, 'Beta-blocker for hypertension', 'Fatigue, cold hands/feet', 'Asthma, heart block', '1 tablet daily in morning'),
('med_amlodipine_5', 'Amlodipine 5mg', 'Amlodipine', 'Norvasc', 'Pfizer', 'cat_cardiovascular', 'Tablet', '5mg', 'Strip of 10', 48.00, 34.00, 41.18, true, true, 'Calcium channel blocker', 'Ankle swelling, dizziness', 'Severe aortic stenosis', '1 tablet daily'),
('med_lisinopril_5', 'Lisinopril 5mg', 'Lisinopril', 'Prinivil', 'Merck', 'cat_cardiovascular', 'Tablet', '5mg', 'Strip of 10', 62.00, 44.00, 40.91, true, true, 'ACE inhibitor for hypertension', 'Dry cough, hyperkalemia', 'Pregnancy, bilateral renal artery stenosis', '1 tablet daily'),
('med_metoprolol_50', 'Metoprolol 50mg', 'Metoprolol', 'Betaloc', 'AstraZeneca', 'cat_cardiovascular', 'Tablet', '50mg', 'Strip of 10', 58.00, 41.00, 41.46, true, true, 'Beta-blocker for heart conditions', 'Fatigue, bradycardia', 'Cardiogenic shock, severe bradycardia', '1 tablet twice daily'),

-- ANTIDIABETIC (5% GST)
('med_metformin_500', 'Metformin 500mg', 'Metformin', 'Glycomet', 'USV', 'cat_diabetes', 'Tablet', '500mg', 'Strip of 20', 42.00, 30.00, 40.00, true, true, 'First-line diabetes medication', 'GI upset, lactic acidosis (rare)', 'Kidney disease, heart failure', '1 tablet twice daily with meals'),
('med_glimepiride_1', 'Glimepiride 1mg', 'Glimepiride', 'Amaryl', 'Sanofi', 'cat_diabetes', 'Tablet', '1mg', 'Strip of 10', 35.00, 25.00, 40.00, true, true, 'Sulfonylurea for diabetes', 'Hypoglycemia, weight gain', 'Type 1 diabetes, severe kidney/liver disease', '1 tablet daily with breakfast'),
('med_gliclazide_80', 'Gliclazide 80mg', 'Gliclazide', 'Diamicron', 'Serdia', 'cat_diabetes', 'Tablet', '80mg', 'Strip of 10', 38.50, 27.00, 42.59, true, true, 'Sulfonylurea anti-diabetic', 'Hypoglycemia, GI upset', 'Type 1 diabetes, pregnancy', '1-2 tablets daily with meals'),
('med_insulin_cartridge', 'Human Insulin', 'Human Insulin', 'Huminsulin', 'Eli Lilly', 'cat_diabetes', 'Injection', '100IU/ml', 'Cartridge 3ml', 285.00, 220.00, 29.55, true, true, 'Injectable insulin for diabetes', 'Hypoglycemia, injection site reactions', 'Hypoglycemia episodes', 'As per doctors prescription - subcutaneous injection'),

-- RESPIRATORY (5% GST)
('med_salbutamol_4', 'Salbutamol 4mg', 'Salbutamol', 'Asthalin', 'Cipla', 'cat_respiratory', 'Tablet', '4mg', 'Strip of 10', 28.00, 20.00, 40.00, false, true, 'Bronchodilator for asthma', 'Tremor, palpitations', 'Hyperthyroidism, cardiac arrhythmias', '1 tablet 3-4 times daily'),
('med_montelukast_10', 'Montelukast 10mg', 'Montelukast', 'Montair', 'Cipla', 'cat_respiratory', 'Tablet', '10mg', 'Strip of 10', 85.00, 60.00, 41.67, true, true, 'Leukotriene receptor antagonist', 'Headache, abdominal pain', 'Hypersensitivity', '1 tablet daily in evening'),
('med_theophylline_200', 'Theophylline 200mg', 'Theophylline', 'Deriphyllin', 'Zydus Cadila', 'cat_respiratory', 'Tablet', '200mg', 'Strip of 10', 45.00, 32.00, 40.63, true, true, 'Bronchodilator and anti-inflammatory', 'Nausea, headache, insomnia', 'Peptic ulcer, cardiac arrhythmias', '1 tablet twice daily after meals'),

-- ANTIHISTAMINES (5% GST)
('med_cetirizine_10', 'Cetirizine 10mg', 'Cetirizine', 'Zyrtec', 'UCB', 'cat_antihistamine', 'Tablet', '10mg', 'Strip of 10', 32.00, 23.00, 39.13, false, true, 'Anti-allergic medication', 'Drowsiness, dry mouth', 'Severe kidney disease', '1 tablet daily at bedtime'),
('med_loratadine_10', 'Loratadine 10mg', 'Loratadine', 'Claritin', 'Schering-Plough', 'cat_antihistamine', 'Tablet', '10mg', 'Strip of 10', 45.00, 32.00, 40.63, false, true, 'Non-sedating antihistamine', 'Headache, fatigue', 'Hypersensitivity', '1 tablet daily'),
('med_fexofenadine_120', 'Fexofenadine 120mg', 'Fexofenadine', 'Allegra', 'Sanofi', 'cat_antihistamine', 'Tablet', '120mg', 'Strip of 10', 68.00, 48.00, 41.67, false, true, 'Non-drowsy antihistamine', 'Headache, back pain', 'Severe renal impairment', '1 tablet daily'),

-- NEUROLOGICAL (5% GST)
('med_gabapentin_300', 'Gabapentin 300mg', 'Gabapentin', 'Gabapin', 'Intas', 'cat_neurological', 'Capsule', '300mg', 'Strip of 10', 125.00, 90.00, 38.89, true, true, 'Anti-epileptic and neuropathic pain', 'Dizziness, somnolence', 'Hypersensitivity', '1 capsule 3 times daily'),
('med_phenytoin_100', 'Phenytoin 100mg', 'Phenytoin', 'Eptoin', 'Abbott', 'cat_neurological', 'Tablet', '100mg', 'Strip of 10', 45.00, 32.00, 40.63, true, true, 'Anti-epileptic medication', 'Gingival hyperplasia, rash', 'Heart block, hepatic impairment', '1 tablet 2-3 times daily'),
('med_carbamazepine_200', 'Carbamazepine 200mg', 'Carbamazepine', 'Tegretol', 'Novartis', 'cat_neurological', 'Tablet', '200mg', 'Strip of 10', 58.00, 41.00, 41.46, true, true, 'Anti-epileptic and mood stabilizer', 'Dizziness, nausea, rash', 'Bone marrow depression, heart block', '1 tablet twice daily with food'),

-- OPHTHALMIC (5% GST)
('med_tropicamide_drops', 'Tropicamide 1% Eye Drops', 'Tropicamide', 'Mydriacyl', 'Alcon', 'cat_ophthalmic', 'Drops', '1%', 'Bottle 5ml', 65.00, 46.00, 41.30, true, true, 'Mydriatic eye drops', 'Blurred vision, photophobia', 'Narrow angle glaucoma', '1-2 drops before examination'),
('med_timolol_drops', 'Timolol 0.5% Eye Drops', 'Timolol Maleate', 'Timoptic', 'Merck', 'cat_ophthalmic', 'Drops', '0.5%', 'Bottle 5ml', 128.00, 92.00, 39.13, true, true, 'Anti-glaucoma medication', 'Eye irritation, systemic beta-blockade', 'Asthma, heart block', '1 drop twice daily'),
('med_chloramphenicol_drops', 'Chloramphenicol Eye Drops', 'Chloramphenicol', 'Chloromycetin', 'Pfizer', 'cat_ophthalmic', 'Drops', '0.5%', 'Bottle 10ml', 45.00, 32.00, 40.63, true, true, 'Antibiotic eye drops', 'Local irritation', 'Hypersensitivity to chloramphenicol', '1-2 drops 4-6 times daily'),

-- DERMATOLOGICAL (5% GST)
('med_betamethasone_cream', 'Betamethasone Cream', 'Betamethasone Valerate', 'Betnovate', 'GlaxoSmithKline', 'cat_dermatology', 'Cream', '0.1%', 'Tube 15g', 48.00, 34.00, 41.18, false, true, 'Topical corticosteroid', 'Skin atrophy, irritation', 'Viral skin infections', 'Apply thin layer 2-3 times daily'),
('med_clotrimazole_cream', 'Clotrimazole Cream', 'Clotrimazole', 'Candid', 'Glenmark', 'cat_dermatology', 'Cream', '1%', 'Tube 20g', 35.00, 25.00, 40.00, false, true, 'Antifungal cream', 'Local irritation, burning', 'Hypersensitivity', 'Apply twice daily for 2-4 weeks'),
('med_hydrocortisone_cream', 'Hydrocortisone Cream', 'Hydrocortisone', 'Hycort', 'Pfizer', 'cat_dermatology', 'Cream', '1%', 'Tube 15g', 42.00, 30.00, 40.00, false, true, 'Mild topical steroid', 'Skin thinning with prolonged use', 'Bacterial/viral skin infections', 'Apply 2-3 times daily'),

-- PEDIATRIC MEDICINES (5% GST)
('med_paracetamol_syrup', 'Paracetamol Syrup', 'Paracetamol', 'Calpol', 'GlaxoSmithKline', 'cat_pediatric', 'Syrup', '120mg/5ml', 'Bottle 60ml', 38.00, 27.00, 40.74, false, true, 'Pediatric pain reliever and fever reducer', 'Rare allergic reactions', 'Liver disease', '2.5-5ml every 4-6 hours for children'),
('med_amoxicillin_syrup', 'Amoxicillin Syrup', 'Amoxicillin', 'Mox Kid', 'Ranbaxy', 'cat_pediatric', 'Syrup', '125mg/5ml', 'Bottle 30ml', 85.00, 60.00, 41.67, true, true, 'Pediatric antibiotic suspension', 'Diarrhea, rash', 'Penicillin allergy', '5ml 3 times daily for children'),
('med_multivitamin_syrup', 'Multivitamin Syrup', 'Multivitamin', 'Zincovit', 'Apex', 'cat_pediatric', 'Syrup', 'Multi', 'Bottle 200ml', 125.00, 90.00, 38.89, false, true, 'Pediatric multivitamin supplement', 'Rare GI upset', 'Hypervitaminosis', '5-10ml daily for children'),

-- GYNECOLOGY (5% GST)
('med_clomifene_50', 'Clomifene Citrate 50mg', 'Clomifene Citrate', 'Clomid', 'Sanofi', 'cat_gynecology', 'Tablet', '50mg', 'Strip of 10', 185.00, 135.00, 37.04, true, true, 'Ovulation inducing medication', 'Hot flashes, mood changes', 'Pregnancy, liver disease', 'As per gynecologists prescription'),
('med_norethisterone_5', 'Norethisterone 5mg', 'Norethisterone', 'Primolut-N', 'Bayer', 'cat_gynecology', 'Tablet', '5mg', 'Strip of 10', 65.00, 46.50, 39.78, true, true, 'Progestogen for menstrual disorders', 'Weight gain, mood changes', 'Pregnancy, liver tumors', '1 tablet 2-3 times daily'),
('med_mefenamic_acid_250', 'Mefenamic Acid 250mg', 'Mefenamic Acid', 'Meftal', 'Blue Cross', 'cat_gynecology', 'Tablet', '250mg', 'Strip of 10', 48.00, 34.00, 41.18, false, true, 'NSAID for menstrual pain', 'GI upset, dizziness', 'Peptic ulcer, kidney disease', '1 tablet 3 times daily after meals'),

-- CONTRACEPTIVES (0% GST)
('med_oral_contraceptive', 'Combined Oral Contraceptive', 'Ethinyl Estradiol + Levonorgestrel', 'Mala-D', 'Pfizer', 'cat_contraceptive', 'Tablet', '0.03mg+0.15mg', 'Strip of 21', 45.00, 35.00, 28.57, true, true, 'Combined oral contraceptive pill', 'Nausea, breakthrough bleeding', 'Thromboembolism, liver disease', '1 tablet daily for 21 days'),
('med_emergency_contraceptive', 'Emergency Contraceptive', 'Levonorgestrel', 'i-Pill', 'Piramal', 'cat_contraceptive', 'Tablet', '1.5mg', 'Single tablet', 85.00, 65.00, 30.77, false, true, 'Emergency contraceptive pill', 'Nausea, menstrual irregularities', 'Pregnancy', '1 tablet within 72 hours of unprotected intercourse'),

-- VACCINES (0% GST)
('med_hepatitis_b_vaccine', 'Hepatitis B Vaccine', 'Hepatitis B Surface Antigen', 'Engerix-B', 'GlaxoSmithKline', 'cat_vaccines', 'Injection', '20mcg/ml', 'Vial 1ml', 285.00, 225.00, 26.67, true, true, 'Hepatitis B immunization vaccine', 'Injection site pain, fever', 'Hypersensitivity to vaccine components', 'As per immunization schedule'),
('med_tetanus_vaccine', 'Tetanus Toxoid', 'Tetanus Toxoid', 'TT', 'Serum Institute', 'cat_vaccines', 'Injection', '0.5ml', 'Vial 0.5ml', 45.00, 35.00, 28.57, true, true, 'Tetanus immunization', 'Local pain, mild fever', 'Previous severe reaction', 'As per immunization schedule'),

-- ONCOLOGY (5% GST)
('med_methotrexate_2_5', 'Methotrexate 2.5mg', 'Methotrexate', 'Folitrax', 'Ipca', 'cat_oncology', 'Tablet', '2.5mg', 'Strip of 10', 185.00, 135.00, 37.04, true, true, 'Antimetabolite for cancer/autoimmune diseases', 'Bone marrow suppression, hepatotoxicity', 'Pregnancy, severe hepatic/renal impairment', 'As per oncologists prescription only'),
('med_tamoxifen_20', 'Tamoxifen 20mg', 'Tamoxifen Citrate', 'Tamifen', 'Cipla', 'cat_oncology', 'Tablet', '20mg', 'Strip of 10', 225.00, 165.00, 36.36, true, true, 'Selective estrogen receptor modulator', 'Hot flashes, thromboembolism risk', 'Pregnancy, history of thromboembolism', 'As per oncologists prescription'),

-- VITAMINS & SUPPLEMENTS (18% GST)
('med_multivitamin_tab', 'Multivitamin Tablet', 'Multivitamin & Minerals', 'A to Z', 'Alkem', 'cat_vitamins', 'Tablet', 'Multi', 'Strip of 15', 85.00, 55.00, 54.55, false, true, 'Daily multivitamin supplement', 'Rare allergic reactions', 'Hypervitaminosis', '1 tablet daily after breakfast'),
('med_vitamin_d3_60k', 'Vitamin D3 60,000 IU', 'Cholecalciferol', 'Calcirol', 'Cadila', 'cat_vitamins', 'Sachet', '60,000 IU', 'Sachet', 25.00, 16.00, 56.25, false, true, 'High dose Vitamin D3 supplement', 'Hypercalcemia with overdose', 'Hypercalcemia, kidney stones', '1 sachet weekly or as prescribed'),
('med_iron_folic_acid', 'Iron + Folic Acid', 'Ferrous Sulfate + Folic Acid', 'Fefol', 'GlaxoSmithKline', 'cat_vitamins', 'Capsule', '150mg+0.5mg', 'Strip of 10', 45.00, 29.00, 55.17, false, true, 'Iron and folic acid supplement', 'GI upset, constipation', 'Hemochromatosis, peptic ulcer', '1 capsule daily on empty stomach'),
('med_calcium_carbonate', 'Calcium Carbonate + Vitamin D3', 'Calcium Carbonate + Cholecalciferol', 'Shelcal', 'Torrent', 'cat_vitamins', 'Tablet', '500mg+250IU', 'Strip of 15', 125.00, 80.00, 56.25, false, true, 'Calcium and Vitamin D3 supplement', 'Constipation, hypercalcemia', 'Hypercalcemia, kidney stones', '1-2 tablets daily with meals'),

-- ANTISEPTICS (18% GST)
('med_povidone_iodine', 'Povidone Iodine Solution', 'Povidone Iodine', 'Betadine', 'Win-Medicare', 'cat_antiseptic', 'Solution', '10%', 'Bottle 100ml', 85.00, 55.00, 54.55, false, true, 'Antiseptic solution for wounds', 'Skin irritation, staining', 'Thyroid disorders, iodine sensitivity', 'Apply to affected area 2-3 times daily'),
('med_hydrogen_peroxide', 'Hydrogen Peroxide Solution', 'Hydrogen Peroxide', 'H2O2', 'Ranbaxy', 'cat_antiseptic', 'Solution', '6%', 'Bottle 100ml', 45.00, 29.00, 55.17, false, true, 'Antiseptic and wound cleanser', 'Foaming, mild irritation', 'Deep wounds, body cavities', 'Apply to wound, allow to foam, then rinse'),
('med_alcohol_swabs', 'Isopropyl Alcohol Swabs', 'Isopropyl Alcohol', 'Alcohol Prep Pads', 'BD', 'cat_antiseptic', 'Swabs', '70%', 'Box of 100', 125.00, 80.00, 56.25, false, true, 'Antiseptic alcohol swabs', 'Skin drying', 'Open wounds, mucous membranes', 'Use for skin disinfection before injection');

-- Insert sample suppliers
INSERT INTO "Supplier" ("id", "name", "contactPerson", "phone", "email", "address", "gstNumber", "creditTerms", "isActive") VALUES
('sup_pharma_dist_mumbai', 'Pharma Distributors Mumbai', 'Mr. Rajesh Shah', '+91-9876543210', 'rajesh@pharmadist.com', '123 Pharmaceutical Market, Byculla, Mumbai - 400011', '27ABCDE1234F1Z5', 30, true),
('sup_medical_suppliers_delhi', 'Medical Suppliers Delhi', 'Ms. Priya Sharma', '+91-9876543211', 'priya@medsuppliers.com', '456 Medical Complex, Karol Bagh, New Delhi - 110005', '07ABCDE1234F1Z6', 45, true),
('sup_healthcare_kolkata', 'Healthcare Distributors Kolkata', 'Mr. Amit Roy', '+91-9876543212', 'amit@healthcare.com', '789 Medicine Street, Park Street, Kolkata - 700016', '19ABCDE1234F1Z7', 30, true),
('sup_pharma_chennai', 'Pharma Solutions Chennai', 'Dr. Lakshmi Narayanan', '+91-9876543213', 'lakshmi@pharmasol.com', '321 Medical Plaza, T. Nagar, Chennai - 600017', '33ABCDE1234F1Z8', 60, true),
('sup_medicos_bangalore', 'Medicos Bangalore', 'Mr. Suresh Kumar', '+91-9876543214', 'suresh@medicos.com', '654 Pharmacy Hub, Brigade Road, Bangalore - 560025', '29ABCDE1234F1Z9', 30, true);

-- Insert sample stock entries for medicines
INSERT INTO "MedicineStock" ("medicineId", "supplierId", "batchNumber", "expiryDate", "quantity", "purchasePrice", "mrp", "manufacturingDate", "location") VALUES
('med_paracetamol_500', 'sup_pharma_dist_mumbai', 'PCM2024001', '2025-12-31', 500, 18.00, 25.50, '2024-01-15', 'Rack A1'),
('med_ibuprofen_400', 'sup_pharma_dist_mumbai', 'IBU2024002', '2025-11-30', 300, 32.00, 45.00, '2024-02-10', 'Rack A2'),
('med_amoxicillin_500', 'sup_medical_suppliers_delhi', 'AMX2024003', '2025-10-15', 200, 60.00, 85.00, '2024-01-20', 'Rack B1'),
('med_azithromycin_500', 'sup_medical_suppliers_delhi', 'AZI2024004', '2025-09-30', 150, 68.00, 95.00, '2024-02-05', 'Rack B2'),
('med_omeprazole_20', 'sup_healthcare_kolkata', 'OME2024005', '2025-08-31', 250, 34.00, 48.00, '2024-01-10', 'Rack C1'),
('med_atenolol_50', 'sup_pharma_chennai', 'ATE2024006', '2026-01-15', 180, 39.00, 55.00, '2024-02-20', 'Rack D1'),
('med_metformin_500', 'sup_medicos_bangalore', 'MET2024007', '2025-07-31', 400, 30.00, 42.00, '2024-01-25', 'Rack E1'),
('med_cetirizine_10', 'sup_pharma_dist_mumbai', 'CET2024008', '2025-06-30', 350, 23.00, 32.00, '2024-02-15', 'Rack A3'),
('med_salbutamol_4', 'sup_medical_suppliers_delhi', 'SAL2024009', '2025-05-31', 200, 20.00, 28.00, '2024-01-30', 'Rack B3'),
('med_paracetamol_syrup', 'sup_healthcare_kolkata', 'PCS2024010', '2025-04-30', 120, 27.00, 38.00, '2024-02-01', 'Rack C2'),
('med_multivitamin_tab', 'sup_pharma_chennai', 'MVT2024011', '2025-12-15', 300, 55.00, 85.00, '2024-01-05', 'Rack D2'),
('med_betamethasone_cream', 'sup_medicos_bangalore', 'BET2024012', '2025-03-31', 80, 34.00, 48.00, '2024-02-25', 'Rack E2'),
('med_insulin_cartridge', 'sup_pharma_dist_mumbai', 'INS2024013', '2025-11-15', 50, 220.00, 285.00, '2024-01-08', 'Refrigerator R1'),
('med_gabapentin_300', 'sup_medical_suppliers_delhi', 'GAB2024014', '2025-10-31', 100, 90.00, 125.00, '2024-02-12', 'Rack B4'),
('med_oral_contraceptive', 'sup_healthcare_kolkata', 'OCP2024015', '2025-09-15', 150, 35.00, 45.00, '2024-01-18', 'Rack C3');

COMMIT;
