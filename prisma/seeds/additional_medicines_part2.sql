-- Additional Comprehensive Indian Medicine Database - Part 2
-- Specialized medicines, injections, syrups, and rare/specialty drugs

-- Add more specialized categories first
INSERT INTO "MedicineCategory" ("id", "name", "description", "gstRate") VALUES 
('cat_anesthetics', 'Anesthetics', 'Local and general anesthetic agents', 5.0),
('cat_emergency', 'Emergency Medicines', 'Life-saving emergency medications', 5.0),
('cat_psychiatry', 'Psychiatry', 'Mental health medications', 5.0),
('cat_endocrinology', 'Endocrinology', 'Hormone related medications', 5.0),
('cat_nephrology', 'Nephrology', 'Kidney related medications', 5.0),
('cat_rheumatology', 'Rheumatology', 'Joint and autoimmune disease medications', 5.0),
('cat_hematology', 'Hematology', 'Blood related medications', 5.0),
('cat_ent', 'ENT', 'Ear, Nose, Throat medications', 5.0),
('cat_urology', 'Urology', 'Urinary system medications', 5.0),
('cat_radiology', 'Radiology', 'Contrast agents and imaging medications', 5.0)
ON CONFLICT ("id") DO NOTHING;

-- Insert additional comprehensive medicines
INSERT INTO "Medicine" ("id", "name", "genericName", "brand", "manufacturer", "categoryId", "dosageForm", "strength", "unitType", "mrp", "purchasePrice", "marginPercentage", "prescriptionRequired", "isActive", "description", "sideEffects", "contraindications", "dosageInstructions") VALUES

-- EMERGENCY MEDICINES (5% GST)
('med_adrenaline_1ml', 'Adrenaline Injection', 'Adrenaline', 'Adrenalin', 'Pfizer', 'cat_emergency', 'Injection', '1mg/ml', 'Ampoule 1ml', 45.00, 32.00, 40.63, true, true, 'Emergency vasoconstrictor for anaphylaxis', 'Hypertension, arrhythmias', 'Narrow angle glaucoma', 'IM injection in emergency situations'),
('med_atropine_1ml', 'Atropine Injection', 'Atropine Sulphate', 'Atropin', 'Neon', 'cat_emergency', 'Injection', '0.6mg/ml', 'Ampoule 1ml', 28.00, 20.00, 40.00, true, true, 'Anticholinergic for bradycardia and poisoning', 'Dry mouth, tachycardia', 'Narrow angle glaucoma, myasthenia gravis', 'IV/IM as per emergency protocol'),
('med_dopamine_5ml', 'Dopamine Injection', 'Dopamine HCl', 'Dopmin', 'Samarth', 'cat_emergency', 'Injection', '40mg/ml', 'Vial 5ml', 85.00, 60.00, 41.67, true, true, 'Inotropic agent for shock', 'Arrhythmias, hypertension', 'Pheochromocytoma, VT/VF', 'IV infusion only, central line preferred'),
('med_nitroglycerin_5ml', 'Nitroglycerin Injection', 'Nitroglycerin', 'Nitrocard', 'Troikaa', 'cat_emergency', 'Injection', '1mg/ml', 'Ampoule 5ml', 125.00, 90.00, 38.89, true, true, 'Vasodilator for acute MI and hypertensive crisis', 'Hypotension, headache', 'Severe hypotension, head trauma', 'IV infusion with continuous monitoring'),
('med_sodium_bicarb', 'Sodium Bicarbonate Injection', 'Sodium Bicarbonate', 'Sodabicarb', 'Fresenius Kabi', 'cat_emergency', 'Injection', '8.4%', 'Vial 50ml', 65.00, 46.00, 41.30, true, true, 'Alkalinizing agent for metabolic acidosis', 'Hypernatremia, alkalosis', 'Severe alkalosis', 'IV administration as per ABG results'),

-- ANESTHETICS (5% GST)
('med_lignocaine_2ml', 'Lignocaine Injection', 'Lignocaine HCl', 'Xylocaine', 'AstraZeneca', 'cat_anesthetics', 'Injection', '2%', 'Vial 2ml', 32.00, 23.00, 39.13, true, true, 'Local anesthetic injection', 'Allergic reactions, methemoglobinemia', 'Hypersensitivity to amide anesthetics', 'Local infiltration/nerve block'),
('med_bupivacaine_5ml', 'Bupivacaine Injection', 'Bupivacaine HCl', 'Sensorcaine', 'Neon', 'cat_anesthetics', 'Injection', '0.5%', 'Vial 5ml', 85.00, 60.00, 41.67, true, true, 'Long-acting local anesthetic', 'Cardiac toxicity, CNS toxicity', 'Heart block, severe hypotension', 'Spinal/epidural anesthesia only'),
('med_propofol_20ml', 'Propofol Injection', 'Propofol', 'Diprivan', 'Fresenius Kabi', 'cat_anesthetics', 'Injection', '1%', 'Vial 20ml', 285.00, 220.00, 29.55, true, true, 'IV anesthetic for induction', 'Apnea, hypotension', 'Egg allergy, children under 3', 'IV induction and maintenance anesthesia'),

-- PSYCHIATRY (5% GST)
('med_haloperidol_5', 'Haloperidol 5mg', 'Haloperidol', 'Serenace', 'RPG', 'cat_psychiatry', 'Tablet', '5mg', 'Strip of 10', 45.00, 32.00, 40.63, true, true, 'Antipsychotic for schizophrenia', 'Extrapyramidal symptoms, tardive dyskinesia', 'Parkinson disease, coma', '0.5-2mg twice daily initially'),
('med_clozapine_25', 'Clozapine 25mg', 'Clozapine', 'Clozan', 'Sun Pharma', 'cat_psychiatry', 'Tablet', '25mg', 'Strip of 10', 185.00, 135.00, 37.04, true, true, 'Atypical antipsychotic for treatment-resistant schizophrenia', 'Agranulocytosis, seizures', 'Severe cardiac disease, bone marrow disorders', '12.5mg once daily initially'),
('med_lithium_300', 'Lithium Carbonate 300mg', 'Lithium Carbonate', 'Licab', 'Sun Pharma', 'cat_psychiatry', 'Tablet', '300mg', 'Strip of 10', 65.00, 46.00, 41.30, true, true, 'Mood stabilizer for bipolar disorder', 'Tremor, polyuria, thyroid dysfunction', 'Severe cardiac/renal disease', '300mg twice daily with monitoring'),
('med_escitalopram_10', 'Escitalopram 10mg', 'Escitalopram', 'Nexito', 'Sun Pharma', 'cat_psychiatry', 'Tablet', '10mg', 'Strip of 10', 125.00, 90.00, 38.89, true, true, 'SSRI antidepressant', 'Nausea, sexual dysfunction', 'MAO inhibitor use', '5-10mg once daily'),
('med_alprazolam_0_5', 'Alprazolam 0.5mg', 'Alprazolam', 'Alprax', 'Torrent', 'cat_psychiatry', 'Tablet', '0.5mg', 'Strip of 10', 48.00, 34.00, 41.18, true, true, 'Benzodiazepine for anxiety', 'Sedation, dependence', 'Acute narrow-angle glaucoma', '0.25-0.5mg 2-3 times daily'),

-- ENDOCRINOLOGY (5% GST)
('med_levothyroxine_50', 'Levothyroxine 50mcg', 'Levothyroxine Sodium', 'Eltroxin', 'GlaxoSmithKline', 'cat_endocrinology', 'Tablet', '50mcg', 'Strip of 100', 125.00, 90.00, 38.89, true, true, 'Thyroid hormone replacement', 'Palpitations, insomnia if overdosed', 'Thyrotoxicosis, acute MI', '25-50mcg daily on empty stomach'),
('med_prednisolone_5', 'Prednisolone 5mg', 'Prednisolone', 'Omnacortil', 'Macleods', 'cat_endocrinology', 'Tablet', '5mg', 'Strip of 10', 25.00, 18.00, 38.89, true, true, 'Corticosteroid anti-inflammatory', 'Cushing syndrome, osteoporosis', 'Systemic infections, live vaccines', '5-60mg daily depending on condition'),
('med_dexamethasone_0_5', 'Dexamethasone 0.5mg', 'Dexamethasone', 'Decdan', 'Cadila', 'cat_endocrinology', 'Tablet', '0.5mg', 'Strip of 10', 28.00, 20.00, 40.00, true, true, 'Potent corticosteroid', 'Immunosuppression, hyperglycemia', 'Viral infections, peptic ulcer', '0.5-9mg daily as prescribed'),

-- NEPHROLOGY (5% GST)
('med_furosemide_40', 'Furosemide 40mg', 'Furosemide', 'Lasix', 'Sanofi', 'cat_nephrology', 'Tablet', '40mg', 'Strip of 15', 42.00, 30.00, 40.00, true, true, 'Loop diuretic for edema', 'Hypokalemia, dehydration', 'Anuria, severe hypovolemia', '20-80mg daily, can be increased'),
('med_spironolactone_25', 'Spironolactone 25mg', 'Spironolactone', 'Aldactone', 'RPG', 'cat_nephrology', 'Tablet', '25mg', 'Strip of 10', 35.00, 25.00, 40.00, true, true, 'Potassium-sparing diuretic', 'Hyperkalemia, gynecomastia', 'Hyperkalemia, Addisons disease', '25-200mg daily'),
('med_allopurinol_100', 'Allopurinol 100mg', 'Allopurinol', 'Zyloric', 'GlaxoSmithKline', 'cat_nephrology', 'Tablet', '100mg', 'Strip of 10', 58.00, 41.00, 41.46, true, true, 'Xanthine oxidase inhibitor for gout', 'Skin rash, hepatotoxicity', 'Acute gout attack', '100-300mg daily after meals'),

-- RHEUMATOLOGY (5% GST)
('med_hydroxychloroquine_200', 'Hydroxychloroquine 200mg', 'Hydroxychloroquine Sulphate', 'HCQS', 'Ipca', 'cat_rheumatology', 'Tablet', '200mg', 'Strip of 10', 68.00, 48.00, 41.67, true, true, 'Antimalarial for RA and lupus', 'Retinal toxicity, cardiomyopathy', 'Retinal disease, G6PD deficiency', '200-400mg daily with food'),
('med_sulfasalazine_500', 'Sulfasalazine 500mg', 'Sulfasalazine', 'Sazo', 'Pfizer', 'cat_rheumatology', 'Tablet', '500mg', 'Strip of 10', 125.00, 90.00, 38.89, true, true, 'DMARD for inflammatory arthritis', 'GI upset, oligospermia', 'Sulfa allergy, porphyria', '500mg 2-3 times daily'),
('med_leflunomide_20', 'Leflunomide 20mg', 'Leflunomide', 'Lefra', 'Natco', 'cat_rheumatology', 'Tablet', '20mg', 'Strip of 10', 385.00, 285.00, 35.09, true, true, 'DMARD for rheumatoid arthritis', 'Hepatotoxicity, teratogenicity', 'Pregnancy, severe liver disease', '20mg daily with monitoring'),

-- HEMATOLOGY (5% GST)
('med_warfarin_5', 'Warfarin 5mg', 'Warfarin Sodium', 'Warf', 'Cipla', 'cat_hematology', 'Tablet', '5mg', 'Strip of 10', 42.00, 30.00, 40.00, true, true, 'Anticoagulant for thrombosis prevention', 'Bleeding, skin necrosis', 'Active bleeding, pregnancy', '2-10mg daily based on INR'),
('med_clopidogrel_75', 'Clopidogrel 75mg', 'Clopidogrel Bisulphate', 'Plavix', 'Sanofi', 'cat_hematology', 'Tablet', '75mg', 'Strip of 10', 185.00, 135.00, 37.04, true, true, 'Antiplatelet for cardiovascular protection', 'Bleeding, GI upset', 'Active bleeding, severe hepatic impairment', '75mg once daily'),
('med_enoxaparin_40', 'Enoxaparin Injection', 'Enoxaparin Sodium', 'Clexane', 'Sanofi', 'cat_hematology', 'Injection', '40mg/0.4ml', 'Pre-filled syringe', 385.00, 285.00, 35.09, true, true, 'Low molecular weight heparin', 'Bleeding, thrombocytopenia', 'Active bleeding, bacterial endocarditis', 'SC injection once or twice daily'),

-- ENT (5% GST)
('med_betamethasone_nasal', 'Betamethasone Nasal Drops', 'Betamethasone Sodium Phosphate', 'Betnesol', 'GlaxoSmithKline', 'cat_ent', 'Drops', '0.1%', 'Bottle 5ml', 48.00, 34.00, 41.18, false, true, 'Corticosteroid nasal drops', 'Nasal irritation, epistaxis', 'Nasal infections, perforated septum', '2-3 drops in each nostril 2-3 times daily'),
('med_xylometazoline_drops', 'Xylometazoline Nasal Drops', 'Xylometazoline HCl', 'Otrivin', 'Novartis', 'cat_ent', 'Drops', '0.1%', 'Bottle 10ml', 65.00, 46.00, 41.30, false, true, 'Nasal decongestant', 'Rebound congestion, dryness', 'Children under 2 years', '2-3 drops in each nostril up to 3 times daily'),
('med_fluticasone_spray', 'Fluticasone Nasal Spray', 'Fluticasone Propionate', 'Flonase', 'GlaxoSmithKline', 'cat_ent', 'Spray', '50mcg/spray', 'Nasal spray 120 doses', 285.00, 220.00, 29.55, false, true, 'Corticosteroid nasal spray for allergic rhinitis', 'Nasal irritation, epistaxis', 'Nasal infections', '1-2 sprays in each nostril once daily'),

-- UROLOGY (5% GST)
('med_tamsulosin_0_4', 'Tamsulosin 0.4mg', 'Tamsulosin HCl', 'Flomax', 'Boehringer Ingelheim', 'cat_urology', 'Capsule', '0.4mg', 'Strip of 10', 125.00, 90.00, 38.89, true, true, 'Alpha-blocker for BPH', 'Dizziness, ejaculatory dysfunction', 'Severe hepatic impairment', '0.4mg once daily after breakfast'),
('med_finasteride_5', 'Finasteride 5mg', 'Finasteride', 'Fincar', 'Cipla', 'cat_urology', 'Tablet', '5mg', 'Strip of 10', 185.00, 135.00, 37.04, true, true, '5-alpha reductase inhibitor for BPH', 'Decreased libido, erectile dysfunction', 'Pregnancy (women), children', '5mg once daily'),
('med_oxybutynin_5', 'Oxybutynin 5mg', 'Oxybutynin Chloride', 'Ditropan', 'Janssen', 'cat_urology', 'Tablet', '5mg', 'Strip of 10', 85.00, 60.00, 41.67, true, true, 'Anticholinergic for overactive bladder', 'Dry mouth, constipation', 'Glaucoma, GI obstruction', '5mg 2-3 times daily'),

-- ADDITIONAL INJECTIONS AND IV FLUIDS
('med_normal_saline_500', 'Normal Saline IV', 'Sodium Chloride 0.9%', 'NS', 'Baxter', 'cat_emergency', 'IV Fluid', '0.9%', 'Bottle 500ml', 45.00, 32.00, 40.63, false, true, 'Isotonic IV fluid for hydration', 'Hypernatremia, fluid overload', 'Hypernatremia, CHF', 'IV administration as needed'),
('med_dextrose_5_500', '5% Dextrose IV', 'Dextrose 5% in Water', 'D5W', 'Baxter', 'cat_emergency', 'IV Fluid', '5%', 'Bottle 500ml', 48.00, 34.00, 41.18, false, true, 'Hypotonic IV fluid with calories', 'Hyperglycemia, hyponatremia', 'Diabetic coma, severe dehydration', 'IV administration with monitoring'),
('med_ringer_lactate_500', 'Ringer Lactate IV', 'Sodium Chloride + Potassium Chloride + Calcium Chloride + Sodium Lactate', 'RL', 'Baxter', 'cat_emergency', 'IV Fluid', 'Compound', 'Bottle 500ml', 52.00, 37.00, 40.54, false, true, 'Balanced IV fluid for replacement', 'Hyperkalemia, alkalosis', 'Hyperkalemia, severe alkalosis', 'IV administration for fluid replacement'),

-- SPECIALIZED SYRUPS AND SUSPENSIONS
('med_lactulose_syrup', 'Lactulose Syrup', 'Lactulose', 'Duphalac', 'Abbott', 'cat_gastrointestinal', 'Syrup', '10g/15ml', 'Bottle 200ml', 185.00, 135.00, 37.04, false, true, 'Osmotic laxative for constipation', 'Flatulence, abdominal cramps', 'Galactosemia', '15-30ml once or twice daily'),
('med_iron_sucrose_100', 'Iron Sucrose Injection', 'Iron Sucrose', 'Orofer', 'Emcure', 'cat_hematology', 'Injection', '100mg/5ml', 'Vial 5ml', 285.00, 220.00, 29.55, true, true, 'IV iron for iron deficiency anemia', 'Hypotension, allergic reactions', 'Iron overload, oral iron intolerance', 'IV infusion over 15-30 minutes'),
('med_methylcobalamin_1500', 'Methylcobalamin Injection', 'Methylcobalamin', 'Mecobalamin', 'Sun Pharma', 'cat_vitamins', 'Injection', '1500mcg/ml', 'Ampoule 2ml', 85.00, 55.00, 54.55, false, true, 'Vitamin B12 injection', 'Allergic reactions (rare)', 'Cobalt hypersensitivity', 'IM injection once weekly'),

-- SPECIALIZED CREAMS AND OINTMENTS
('med_mupirocin_ointment', 'Mupirocin Ointment', 'Mupirocin', 'Bactroban', 'GlaxoSmithKline', 'cat_dermatology', 'Ointment', '2%', 'Tube 5g', 125.00, 90.00, 38.89, true, true, 'Topical antibiotic for skin infections', 'Local irritation', 'Hypersensitivity', 'Apply 3 times daily for 7-10 days'),
('med_fusidic_acid_cream', 'Fusidic Acid Cream', 'Fusidic Acid', 'Fucidin', 'Leo Pharma', 'cat_dermatology', 'Cream', '2%', 'Tube 15g', 85.00, 60.00, 41.67, true, true, 'Topical antibiotic cream', 'Contact dermatitis', 'Hypersensitivity to fusidic acid', 'Apply 3-4 times daily'),
('med_tacrolimus_ointment', 'Tacrolimus Ointment', 'Tacrolimus', 'Protopic', 'Leo Pharma', 'cat_dermatology', 'Ointment', '0.1%', 'Tube 10g', 685.00, 520.00, 31.73, true, true, 'Topical immunomodulator for eczema', 'Burning sensation, erythema', 'Immunocompromised state, skin cancers', 'Apply thin layer twice daily'),

-- RADIOLOGY CONTRAST AGENTS (5% GST)
('med_iohexol_350', 'Iohexol Injection', 'Iohexol', 'Omnipaque', 'GE Healthcare', 'cat_radiology', 'Injection', '350mg I/ml', 'Bottle 50ml', 1285.00, 985.00, 30.46, true, true, 'Non-ionic contrast for CT scans', 'Nausea, allergic reactions', 'Severe renal impairment, thyrotoxicosis', 'IV injection for imaging studies'),
('med_gadolinium_15ml', 'Gadolinium Contrast', 'Gadolinium DTPA', 'Magnevist', 'Bayer', 'cat_radiology', 'Injection', '0.5mmol/ml', 'Vial 15ml', 2485.00, 1920.00, 29.43, true, true, 'MRI contrast agent', 'Nausea, headache', 'Severe renal impairment', 'IV injection for MRI enhancement'),

-- ADDITIONAL PEDIATRIC MEDICINES
('med_oral_rehydration_salts', 'ORS Powder', 'Sodium Chloride + Potassium Chloride + Glucose + Sodium Citrate', 'Electral', 'FDC', 'cat_pediatric', 'Powder', 'WHO Formula', 'Sachet 21.8g', 12.50, 9.00, 38.89, false, true, 'Oral rehydration therapy', 'Hypernatremia if concentrated', 'Severe dehydration requiring IV', '1 sachet in 200ml water for children'),
('med_zinc_sulfate_20', 'Zinc Sulfate Dispersible', 'Zinc Sulfate', 'Zinconia', 'Mankind', 'cat_pediatric', 'Tablet', '20mg', 'Strip of 10', 25.00, 18.00, 38.89, false, true, 'Zinc supplement for diarrhea and growth', 'GI upset', 'Wilson disease', '20mg daily for children with diarrhea'),
('med_albendazole_400', 'Albendazole 400mg', 'Albendazole', 'Zentel', 'GlaxoSmithKline', 'cat_pediatric', 'Tablet', '400mg', 'Strip of 1', 18.50, 13.50, 37.04, false, true, 'Anthelmintic for worm infections', 'Abdominal pain, nausea', 'Pregnancy, liver disease', 'Single dose 400mg, repeat after 2 weeks'),

-- HERBAL AND AYURVEDIC (18% GST) - Updated category
INSERT INTO "MedicineCategory" ("id", "name", "description", "gstRate") VALUES 
('cat_ayurvedic', 'Ayurvedic & Herbal', 'Traditional and herbal medicines', 18.0)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Medicine" ("id", "name", "genericName", "brand", "manufacturer", "categoryId", "dosageForm", "strength", "unitType", "mrp", "purchasePrice", "marginPercentage", "prescriptionRequired", "isActive", "description", "sideEffects", "contraindications", "dosageInstructions") VALUES
('med_triphala_500', 'Triphala 500mg', 'Triphala', 'Himalaya Triphala', 'Himalaya', 'cat_ayurvedic', 'Tablet', '500mg', 'Bottle of 60', 185.00, 120.00, 54.17, false, true, 'Ayurvedic digestive and detox supplement', 'Loose stools initially', 'Pregnancy, diarrhea', '1-2 tablets at bedtime'),
('med_ashwagandha_500', 'Ashwagandha 500mg', 'Withania Somnifera', 'Himalaya Ashvagandha', 'Himalaya', 'cat_ayurvedic', 'Tablet', '500mg', 'Bottle of 60', 225.00, 145.00, 55.17, false, true, 'Adaptogenic herb for stress and immunity', 'Drowsiness', 'Pregnancy, autoimmune diseases', '1 tablet twice daily with milk'),
('med_brahmi_500', 'Brahmi 500mg', 'Bacopa Monnieri', 'Himalaya Brahmi', 'Himalaya', 'cat_ayurvedic', 'Tablet', '500mg', 'Bottle of 60', 195.00, 125.00, 56.00, false, true, 'Brain tonic for memory and concentration', 'GI upset', 'Bradycardia', '1 tablet twice daily after meals');

-- Insert more suppliers from different regions
INSERT INTO "Supplier" ("id", "name", "contactPerson", "phone", "email", "address", "gstNumber", "creditTerms", "isActive") VALUES
('sup_apollo_pharmacy', 'Apollo Pharmacy Distribution', 'Mr. Venkat Reddy', '+91-9876543215', 'venkat@apollopharmacy.com', '789 Apollo Health Street, Hyderabad - 500032', '36ABCDE1234F2A1', 30, true),
('sup_cipla_direct', 'Cipla Direct Distribution', 'Ms. Kavita Patel', '+91-9876543216', 'kavita@cipla.com', '321 Cipla Tower, Goa - 403722', '30ABCDE1234F2A2', 45, true),
('sup_lupin_pharma', 'Lupin Pharma Solutions', 'Dr. Rajesh Kumar', '+91-9876543217', 'rajesh@lupin.com', '654 Lupin Complex, Pune - 411057', '27ABCDE1234F2A3', 60, true),
('sup_alkem_labs', 'Alkem Laboratories', 'Mr. Sanjay Singh', '+91-9876543218', 'sanjay@alkem.com', '987 Alkem House, Mumbai - 400070', '27ABCDE1234F2A4', 30, true),
('sup_zydus_cadila', 'Zydus Cadila Healthcare', 'Ms. Priyanka Sharma', '+91-9876543219', 'priyanka@zyduscadila.com', '456 Zydus Tower, Ahmedabad - 380054', '24ABCDE1234F2A5', 45, true);

-- Insert additional stock entries for new medicines
INSERT INTO "MedicineStock" ("medicineId", "supplierId", "batchNumber", "expiryDate", "quantity", "purchasePrice", "mrp", "manufacturingDate", "location") VALUES
('med_adrenaline_1ml', 'sup_apollo_pharmacy', 'ADR2024016', '2025-08-31', 50, 32.00, 45.00, '2024-02-01', 'Emergency Cart'),
('med_propofol_20ml', 'sup_cipla_direct', 'PRO2024017', '2025-07-15', 25, 220.00, 285.00, '2024-01-15', 'OR Refrigerator'),
('med_levothyroxine_50', 'sup_lupin_pharma', 'LEV2024018', '2026-03-31', 200, 90.00, 125.00, '2024-01-20', 'Rack F1'),
('med_haloperidol_5', 'sup_alkem_labs', 'HAL2024019', '2025-12-31', 100, 32.00, 45.00, '2024-02-10', 'Rack F2'),
('med_furosemide_40', 'sup_zydus_cadila', 'FUR2024020', '2025-11-30', 150, 30.00, 42.00, '2024-01-25', 'Rack F3'),
('med_warfarin_5', 'sup_apollo_pharmacy', 'WAR2024021', '2025-10-31', 80, 30.00, 42.00, '2024-02-05', 'Rack F4'),
('med_clopidogrel_75', 'sup_cipla_direct', 'CLO2024022', '2025-09-15', 60, 135.00, 185.00, '2024-01-12', 'Rack F5'),
('med_normal_saline_500', 'sup_lupin_pharma', 'NSL2024023', '2025-08-31', 200, 32.00, 45.00, '2024-02-01', 'IV Fluid Store'),
('med_tacrolimus_ointment', 'sup_alkem_labs', 'TAC2024024', '2025-12-15', 20, 520.00, 685.00, '2024-01-18', 'Refrigerator R2'),
('med_ashwagandha_500', 'sup_zydus_cadila', 'ASH2024025', '2025-11-30', 100, 145.00, 225.00, '2024-02-08', 'Rack G1');

COMMIT;
