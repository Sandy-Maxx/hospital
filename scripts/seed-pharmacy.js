const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPharmacy() {
  console.log('Starting pharmacy data seeding...');

  try {
    // Create GST Slabs
    console.log('Creating GST slabs...');
    const gstSlabs = await Promise.all([
      prisma.gstSlab.upsert({
        where: { name: '0% GST' },
        update: {},
        create: {
          name: '0% GST',
          rate: 0.0,
          description: 'Essential medicines',
          isActive: true,
        },
      }),
      prisma.gstSlab.upsert({
        where: { name: '5% GST' },
        update: {},
        create: {
          name: '5% GST',
          rate: 5.0,
          description: 'Basic medicines',
          isActive: true,
        },
      }),
      prisma.gstSlab.upsert({
        where: { name: '12% GST' },
        update: {},
        create: {
          name: '12% GST',
          rate: 12.0,
          description: 'Standard medicines',
          isActive: true,
        },
      }),
      prisma.gstSlab.upsert({
        where: { name: '18% GST' },
        update: {},
        create: {
          name: '18% GST',
          rate: 18.0,
          description: 'Premium medicines',
          isActive: true,
        },
      }),
    ]);

    // Create Medicine Categories
    console.log('Creating medicine categories...');
    const categories = await Promise.all([
      prisma.medicineCategory.upsert({
        where: { name: 'Analgesics' },
        update: {},
        create: {
          name: 'Analgesics',
          description: 'Pain relief medications',
          gstRate: 5.0,
          isActive: true,
        },
      }),
      prisma.medicineCategory.upsert({
        where: { name: 'Antibiotics' },
        update: {},
        create: {
          name: 'Antibiotics',
          description: 'Bacterial infection treatment',
          gstRate: 5.0,
          isActive: true,
        },
      }),
      prisma.medicineCategory.upsert({
        where: { name: 'Cardiovascular' },
        update: {},
        create: {
          name: 'Cardiovascular',
          description: 'Heart and blood pressure medications',
          gstRate: 5.0,
          isActive: true,
        },
      }),
      prisma.medicineCategory.upsert({
        where: { name: 'Diabetes' },
        update: {},
        create: {
          name: 'Diabetes',
          description: 'Diabetes management medications',
          gstRate: 5.0,
          isActive: true,
        },
      }),
      prisma.medicineCategory.upsert({
        where: { name: 'Dermatology' },
        update: {},
        create: {
          name: 'Dermatology',
          description: 'Skin care medications',
          gstRate: 5.0,
          isActive: true,
        },
      }),
      prisma.medicineCategory.upsert({
        where: { name: 'Rheumatology' },
        update: {},
        create: {
          name: 'Rheumatology',
          description: 'Joint and bone medications',
          gstRate: 5.0,
          isActive: true,
        },
      }),
    ]);

    // Create Suppliers
    console.log('Creating suppliers...');
    const suppliers = await Promise.all([
      prisma.supplier.upsert({
        where: { name: 'AbbVie India' },
        update: {},
        create: {
          name: 'AbbVie India',
          contactPerson: 'Rajesh Kumar',
          phone: '+91-9876543210',
          email: 'rajesh@abbvie.in',
          address: 'Mumbai, Maharashtra',
          gstNumber: '27ABCDE1234F1Z5',
          creditTerms: 30,
          isActive: true,
        },
      }),
      prisma.supplier.upsert({
        where: { name: 'Galderma' },
        update: {},
        create: {
          name: 'Galderma',
          contactPerson: 'Priya Sharma',
          phone: '+91-9876543211',
          email: 'priya@galderma.com',
          address: 'Delhi, India',
          gstNumber: '07ABCDE1234F1Z6',
          creditTerms: 45,
          isActive: true,
        },
      }),
      prisma.supplier.upsert({
        where: { name: 'Generic Pharma Ltd' },
        update: {},
        create: {
          name: 'Generic Pharma Ltd',
          contactPerson: 'Amit Singh',
          phone: '+91-9876543212',
          email: 'amit@generic.com',
          address: 'Bangalore, Karnataka',
          gstNumber: '29ABCDE1234F1Z7',
          creditTerms: 30,
          isActive: true,
        },
      }),
      prisma.supplier.upsert({
        where: { name: 'Sanofi' },
        update: {},
        create: {
          name: 'Sanofi',
          contactPerson: 'Deepak Patel',
          phone: '+91-9876543213',
          email: 'deepak@sanofi.com',
          address: 'Goa, India',
          gstNumber: '30ABCDE1234F1Z8',
          creditTerms: 60,
          isActive: true,
        },
      }),
    ]);

    // Create Medicines
    console.log('Creating medicines...');
    const analgesicsCategory = categories.find(c => c.name === 'Analgesics');
    const dermatologyCategory = categories.find(c => c.name === 'Dermatology');
    const cardiovascularCategory = categories.find(c => c.name === 'Cardiovascular');
    const rheumatologyCategory = categories.find(c => c.name === 'Rheumatology');
    const gst5 = gstSlabs.find(g => g.rate === 5.0);

    const medicines = await Promise.all([
      prisma.medicine.upsert({
        where: { name: 'Humira' },
        update: {},
        create: {
          name: 'Humira',
          genericName: 'Adalimumab',
          brand: 'Humira',
          manufacturer: 'AbbVie India',
          categoryId: rheumatologyCategory.id,
          gstSlabId: gst5.id,
          dosageForm: 'Injection',
          strength: '40mg/0.8ml',
          unitType: 'Pre-filled syringe',
          mrp: 24485.00,
          purchasePrice: 19500.00,
          marginPercentage: 25.6,
          prescriptionRequired: true,
          isActive: true,
          description: 'TNF blocker for rheumatoid arthritis',
          sideEffects: 'Injection site reactions, increased infection risk',
          contraindications: 'Active infections, live vaccines',
          dosageInstructions: 'Subcutaneous injection every other week',
        },
      }),
      prisma.medicine.upsert({
        where: { name: 'Differin' },
        update: {},
        create: {
          name: 'Differin',
          genericName: 'Adapalene',
          brand: 'Differin',
          manufacturer: 'Galderma',
          categoryId: dermatologyCategory.id,
          gstSlabId: gst5.id,
          dosageForm: 'Gel',
          strength: '0.1%',
          unitType: 'Tube 15g',
          mrp: 285.00,
          purchasePrice: 210.00,
          marginPercentage: 35.7,
          prescriptionRequired: true,
          isActive: true,
          description: 'Topical retinoid for acne treatment',
          sideEffects: 'Skin irritation, dryness, redness',
          contraindications: 'Pregnancy, eczema',
          dosageInstructions: 'Apply thin layer once daily at bedtime',
        },
      }),
      prisma.medicine.upsert({
        where: { name: 'Cordarone' },
        update: {},
        create: {
          name: 'Cordarone',
          genericName: 'Amiodarone HCl',
          brand: 'Cordarone',
          manufacturer: 'Sanofi',
          categoryId: cardiovascularCategory.id,
          gstSlabId: gst5.id,
          dosageForm: 'Tablet',
          strength: '200mg',
          unitType: 'Strip of 10',
          mrp: 125.00,
          purchasePrice: 90.00,
          marginPercentage: 38.9,
          prescriptionRequired: true,
          isActive: true,
          description: 'Antiarrhythmic agent for heart rhythm disorders',
          sideEffects: 'Pulmonary toxicity, liver dysfunction',
          contraindications: 'Severe heart block, severe bradycardia',
          dosageInstructions: 'As directed by physician',
        },
      }),
      prisma.medicine.upsert({
        where: { name: 'Fexofenadine 120mg' },
        update: {},
        create: {
          name: 'Fexofenadine 120mg',
          genericName: 'Fexofenadine',
          brand: 'Unknown',
          manufacturer: 'Generic Pharma Ltd',
          categoryId: analgesicsCategory.id,
          gstSlabId: gst5.id,
          dosageForm: 'Tablet',
          strength: '120mg',
          unitType: 'Strip of 10',
          mrp: 85.00,
          purchasePrice: 65.00,
          marginPercentage: 30.8,
          prescriptionRequired: false,
          isActive: true,
          description: 'Antihistamine for allergic reactions',
          sideEffects: 'Drowsiness, headache',
          contraindications: 'Hypersensitivity',
          dosageInstructions: 'One tablet daily',
        },
      }),
    ]);

    // Create Stock entries
    console.log('Creating medicine stock...');
    const abbvie = suppliers.find(s => s.name === 'AbbVie India');
    const galderma = suppliers.find(s => s.name === 'Galderma');
    const sanofi = suppliers.find(s => s.name === 'Sanofi');
    const generic = suppliers.find(s => s.name === 'Generic Pharma Ltd');

    const humira = medicines.find(m => m.name === 'Humira');
    const differin = medicines.find(m => m.name === 'Differin');
    const cordarone = medicines.find(m => m.name === 'Cordarone');
    const fexo = medicines.find(m => m.name === 'Fexofenadine 120mg');

    const stocks = await Promise.all([
      prisma.medicineStock.create({
        data: {
          medicineId: humira.id,
          supplierId: abbvie.id,
          batchNumber: 'HUM2024001',
          expiryDate: new Date('2025-12-31'),
          quantity: 5,
          availableQuantity: 0,
          purchasePrice: 19500.00,
          mrp: 24485.00,
          manufacturingDate: new Date('2024-01-15'),
          location: 'Cold Storage A1',
          isActive: true,
        },
      }),
      prisma.medicineStock.create({
        data: {
          medicineId: differin.id,
          supplierId: galderma.id,
          batchNumber: 'DIF2024001',
          expiryDate: new Date('2026-06-30'),
          quantity: 50,
          availableQuantity: 0,
          purchasePrice: 210.00,
          mrp: 285.00,
          manufacturingDate: new Date('2024-03-10'),
          location: 'Shelf B2',
          isActive: true,
        },
      }),
      prisma.medicineStock.create({
        data: {
          medicineId: cordarone.id,
          supplierId: sanofi.id,
          batchNumber: 'COR2024001',
          expiryDate: new Date('2026-09-15'),
          quantity: 100,
          availableQuantity: 0,
          purchasePrice: 90.00,
          mrp: 125.00,
          manufacturingDate: new Date('2024-02-20'),
          location: 'Shelf C1',
          isActive: true,
        },
      }),
      prisma.medicineStock.create({
        data: {
          medicineId: fexo.id,
          supplierId: generic.id,
          batchNumber: 'FEX2024001',
          expiryDate: new Date('2025-08-30'),
          quantity: 200,
          availableQuantity: 0,
          purchasePrice: 65.00,
          mrp: 85.00,
          manufacturingDate: new Date('2024-01-05'),
          location: 'Shelf D3',
          isActive: true,
        },
      }),
    ]);

    console.log(`Created ${gstSlabs.length} GST slabs`);
    console.log(`Created ${categories.length} categories`);
    console.log(`Created ${suppliers.length} suppliers`);
    console.log(`Created ${medicines.length} medicines`);
    console.log(`Created ${stocks.length} stock entries`);

    console.log('Pharmacy seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding pharmacy data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedPharmacy()
    .then(() => {
      console.log('Seeding finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedPharmacy };