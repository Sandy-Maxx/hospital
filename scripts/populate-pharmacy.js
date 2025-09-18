// Simple script to populate basic pharmacy data
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🏥 Starting pharmacy data population...');

  try {
    // 1. Create GST Slabs
    console.log('📊 Creating GST slabs...');
    const gstSlabs = await prisma.$transaction(async (tx) => {
      const slabs = [
        { id: 'gst_0', name: '0% GST', rate: 0.0, description: 'Life-saving drugs, vaccines, contraceptives' },
        { id: 'gst_5', name: '5% GST', rate: 5.0, description: 'Essential medicines' },
        { id: 'gst_12', name: '12% GST', rate: 12.0, description: 'Some specific medicines' },
        { id: 'gst_18', name: '18% GST', rate: 18.0, description: 'Vitamins, antiseptics' },
        { id: 'gst_28', name: '28% GST', rate: 28.0, description: 'Luxury items (not for medicines)' }
      ];

      const results = [];
      for (const slab of slabs) {
        try {
          const result = await tx.gstSlab.upsert({
            where: { id: slab.id },
            create: slab,
            update: slab
          });
          results.push(result);
        } catch (e) {
          console.log(`GST slab ${slab.name} already exists or error: ${e.message}`);
        }
      }
      return results;
    });
    console.log(`✅ Created ${gstSlabs.length} GST slabs`);

    // 2. Create Medicine Categories
    console.log('📂 Creating medicine categories...');
    const categories = await prisma.$transaction(async (tx) => {
      const cats = [
        { id: 'cat_analgesic', name: 'Analgesics', description: 'Pain relievers', gstRate: 5.0 },
        { id: 'cat_antibiotic', name: 'Antibiotics', description: 'Anti-bacterial medications', gstRate: 5.0 },
        { id: 'cat_cardiovascular', name: 'Cardiovascular', description: 'Heart medications', gstRate: 5.0 },
        { id: 'cat_diabetes', name: 'Antidiabetic', description: 'Diabetes medications', gstRate: 5.0 },
        { id: 'cat_gastrointestinal', name: 'Gastrointestinal', description: 'Digestive medications', gstRate: 5.0 },
        { id: 'cat_vitamins', name: 'Vitamins', description: 'Vitamin supplements', gstRate: 18.0 },
        { id: 'cat_contraceptive', name: 'Contraceptives', description: 'Family planning', gstRate: 0.0 }
      ];

      const results = [];
      for (const cat of cats) {
        try {
          const result = await tx.medicineCategory.upsert({
            where: { id: cat.id },
            create: cat,
            update: cat
          });
          results.push(result);
        } catch (e) {
          console.log(`Category ${cat.name} already exists or error: ${e.message}`);
        }
      }
      return results;
    });
    console.log(`✅ Created ${categories.length} medicine categories`);

    // 3. Create Suppliers
    console.log('🏪 Creating suppliers...');
    const suppliers = await prisma.$transaction(async (tx) => {
      const sups = [
        {
          id: 'sup_pharma_mumbai',
          name: 'Pharma Distributors Mumbai',
          contactPerson: 'Mr. Rajesh Shah',
          phone: '+91-9876543210',
          email: 'rajesh@pharmadist.com',
          address: '123 Pharmaceutical Market, Mumbai - 400011',
          gstNumber: '27ABCDE1234F1Z5',
          creditTerms: 30
        },
        {
          id: 'sup_medical_delhi',
          name: 'Medical Suppliers Delhi',
          contactPerson: 'Ms. Priya Sharma',
          phone: '+91-9876543211',
          email: 'priya@medsuppliers.com',
          address: '456 Medical Complex, Delhi - 110005',
          gstNumber: '07ABCDE1234F1Z6',
          creditTerms: 45
        }
      ];

      const results = [];
      for (const sup of sups) {
        try {
          const result = await tx.supplier.upsert({
            where: { id: sup.id },
            create: sup,
            update: sup
          });
          results.push(result);
        } catch (e) {
          console.log(`Supplier ${sup.name} already exists or error: ${e.message}`);
        }
      }
      return results;
    });
    console.log(`✅ Created ${suppliers.length} suppliers`);

    // 4. Create Sample Medicines
    console.log('💊 Creating sample medicines...');
    const medicines = await prisma.$transaction(async (tx) => {
      const meds = [
        {
          id: 'med_paracetamol_500',
          name: 'Paracetamol 500mg',
          genericName: 'Paracetamol',
          brand: 'Crocin',
          manufacturer: 'GlaxoSmithKline',
          categoryId: 'cat_analgesic',
          gstSlabId: 'gst_5',
          dosageForm: 'Tablet',
          strength: '500mg',
          unitType: 'Strip of 10',
          mrp: 25.50,
          purchasePrice: 18.00,
          marginPercentage: 41.67,
          prescriptionRequired: false,
          description: 'Pain reliever and fever reducer',
          sideEffects: 'Nausea, skin rash in rare cases',
          contraindications: 'Liver disease, alcohol dependency',
          dosageInstructions: 'Adults: 1-2 tablets every 4-6 hours. Max 8 tablets/day'
        },
        {
          id: 'med_amoxicillin_500',
          name: 'Amoxicillin 500mg',
          genericName: 'Amoxicillin',
          brand: 'Mox',
          manufacturer: 'Ranbaxy',
          categoryId: 'cat_antibiotic',
          gstSlabId: 'gst_5',
          dosageForm: 'Capsule',
          strength: '500mg',
          unitType: 'Strip of 10',
          mrp: 85.00,
          purchasePrice: 60.00,
          marginPercentage: 41.67,
          prescriptionRequired: true,
          description: 'Broad-spectrum antibiotic',
          sideEffects: 'Diarrhea, nausea, skin rash',
          contraindications: 'Penicillin allergy',
          dosageInstructions: '1 capsule 3 times daily for 5-7 days'
        },
        {
          id: 'med_metformin_500',
          name: 'Metformin 500mg',
          genericName: 'Metformin',
          brand: 'Glycomet',
          manufacturer: 'USV',
          categoryId: 'cat_diabetes',
          gstSlabId: 'gst_5',
          dosageForm: 'Tablet',
          strength: '500mg',
          unitType: 'Strip of 20',
          mrp: 42.00,
          purchasePrice: 30.00,
          marginPercentage: 40.00,
          prescriptionRequired: true,
          description: 'First-line diabetes medication',
          sideEffects: 'GI upset, lactic acidosis (rare)',
          contraindications: 'Kidney disease, heart failure',
          dosageInstructions: '1 tablet twice daily with meals'
        }
      ];

      const results = [];
      for (const med of meds) {
        try {
          const result = await tx.medicine.upsert({
            where: { id: med.id },
            create: med,
            update: med
          });
          results.push(result);
        } catch (e) {
          console.log(`Medicine ${med.name} already exists or error: ${e.message}`);
        }
      }
      return results;
    });
    console.log(`✅ Created ${medicines.length} medicines`);

    // 5. Create Sample Stock
    console.log('📦 Creating sample stock...');
    const stocks = await prisma.$transaction(async (tx) => {
      const stockData = [
        {
          medicineId: 'med_paracetamol_500',
          supplierId: 'sup_pharma_mumbai',
          batchNumber: 'PCM2024001',
          expiryDate: new Date('2025-12-31'),
          quantity: 500,
          availableQuantity: 500,
          purchasePrice: 18.00,
          mrp: 25.50,
          manufacturingDate: new Date('2024-01-15'),
          location: 'Rack A1'
        },
        {
          medicineId: 'med_amoxicillin_500',
          supplierId: 'sup_medical_delhi',
          batchNumber: 'AMX2024001',
          expiryDate: new Date('2025-10-15'),
          quantity: 200,
          availableQuantity: 200,
          purchasePrice: 60.00,
          mrp: 85.00,
          manufacturingDate: new Date('2024-01-20'),
          location: 'Rack B1'
        },
        {
          medicineId: 'med_metformin_500',
          supplierId: 'sup_pharma_mumbai',
          batchNumber: 'MET2024001',
          expiryDate: new Date('2025-07-31'),
          quantity: 400,
          availableQuantity: 400,
          purchasePrice: 30.00,
          mrp: 42.00,
          manufacturingDate: new Date('2024-01-25'),
          location: 'Rack C1'
        }
      ];

      const results = [];
      for (const stock of stockData) {
        try {
          const existing = await tx.medicineStock.findFirst({
            where: {
              medicineId: stock.medicineId,
              batchNumber: stock.batchNumber
            }
          });

          if (!existing) {
            const result = await tx.medicineStock.create({
              data: stock
            });
            results.push(result);
          }
        } catch (e) {
          console.log(`Stock entry error: ${e.message}`);
        }
      }
      return results;
    });
    console.log(`✅ Created ${stocks.length} stock entries`);

    console.log('\n🎉 Pharmacy data population completed successfully!');
    console.log(`📊 Summary:
- ${gstSlabs.length} GST slabs
- ${categories.length} medicine categories  
- ${suppliers.length} suppliers
- ${medicines.length} medicines
- ${stocks.length} stock entries`);

  } catch (error) {
    console.error('❌ Error populating pharmacy data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
