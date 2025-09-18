import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default users
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hospital.com" },
    update: {},
    create: {
      email: "admin@hospital.com",
      name: "System Administrator",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: "doctor@hospital.com" },
    update: {},
    create: {
      email: "doctor@hospital.com",
      name: "Dr. Smith",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: "reception@hospital.com" },
    update: {},
    create: {
      email: "reception@hospital.com",
      name: "Reception Desk",
      password: await bcrypt.hash("reception123", 10),
      role: "RECEPTIONIST",
    },
  });

  // Create sample medicines
  const medicines = [
    {
      name: "Paracetamol",
      genericName: "Acetaminophen",
      category: "Analgesic",
      dosageForm: "Tablet",
      strength: "500mg",
    },
    {
      name: "Amoxicillin",
      genericName: "Amoxicillin",
      category: "Antibiotic",
      dosageForm: "Capsule",
      strength: "250mg",
    },
    {
      name: "Ibuprofen",
      genericName: "Ibuprofen",
      category: "NSAID",
      dosageForm: "Tablet",
      strength: "400mg",
    },
    {
      name: "Cough Syrup",
      genericName: "Dextromethorphan",
      category: "Antitussive",
      dosageForm: "Syrup",
      strength: "100ml",
    },
    {
      name: "Aspirin",
      genericName: "Acetylsalicylic acid",
      category: "Analgesic",
      dosageForm: "Tablet",
      strength: "75mg",
    },
  ];

  for (const m of medicines) {
    // First ensure category exists
    const category = await prisma.medicineCategory.upsert({
      where: { name: m.category },
      update: {},
      create: { name: m.category, description: null, gstRate: 5.0 },
    });

    // Ensure GST slab exists
    const gstSlab = await prisma.gstSlab.upsert({
      where: { name: "5% GST" },
      update: {},
      create: { name: "5% GST", rate: 5.0, description: "Default slab" },
    });

    // Create medicine with proper foreign key references
    await prisma.medicine.upsert({
      where: { name: m.name },
      update: {},
      create: {
        name: m.name,
        genericName: m.genericName,
        brand: m.name,
        manufacturer: "Generic Manufacturer",
        categoryId: category.id,
        gstSlabId: gstSlab.id,
        dosageForm: m.dosageForm,
        strength: m.strength,
        unitType: "Unit",
        mrp: 100,
        purchasePrice: 80,
        marginPercentage: 20,
        prescriptionRequired: true,
        isActive: true,
      },
    });
  }

  // Create more doctors and staff
  const additionalStaff = [
    {
      email: "dr.sarah@hospital.com",
      name: "Dr. Sarah Johnson",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
    },
    {
      email: "dr.michael@hospital.com",
      name: "Dr. Michael Chen",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
    },
    {
      email: "dr.james@hospital.com",
      name: "Dr. James Wilson",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
    },
    {
      email: "dr.emily@hospital.com",
      name: "Dr. Emily Rodriguez",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
    },
    {
      email: "nurse.mary@hospital.com",
      name: "Mary Williams",
      password: await bcrypt.hash("nurse123", 10),
      role: "NURSE",
    },
    {
      email: "nurse.david@hospital.com",
      name: "David Brown",
      password: await bcrypt.hash("nurse123", 10),
      role: "NURSE",
    },
    {
      email: "reception2@hospital.com",
      name: "Lisa Anderson",
      password: await bcrypt.hash("reception123", 10),
      role: "RECEPTIONIST",
    },
  ];

  for (const staff of additionalStaff) {
    await prisma.user.upsert({
      where: { email: staff.email },
      update: {},
      create: staff,
    });
  }

  // Create comprehensive sample patients (Indian focus)
  const patients = [
    { firstName: "Aarav", lastName: "Sharma", phone: "+91-9000000001", email: "aarav.sharma@example.in", gender: "MALE", bloodGroup: "O+", dateOfBirth: new Date("1994-07-15"), address: "Dwarka Sector 12, New Delhi", emergencyContact: "Rohit Sharma - +91-9000000101" },
    { firstName: "Ishika", lastName: "Gupta", phone: "+91-9000000002", email: "ishika.gupta@example.in", gender: "FEMALE", bloodGroup: "A+", dateOfBirth: new Date("1991-03-22"), address: "Kothrud, Pune, Maharashtra", emergencyContact: "Anil Gupta - +91-9000000102" },
    { firstName: "Vivaan", lastName: "Reddy", phone: "+91-9000000003", email: "vivaan.reddy@example.in", gender: "MALE", bloodGroup: "B+", dateOfBirth: new Date("1989-11-08"), address: "Madhapur, Hyderabad, Telangana", emergencyContact: "Meera Reddy - +91-9000000103" },
    { firstName: "Diya", lastName: "Iyer", phone: "+91-9000000004", email: "diya.iyer@example.in", gender: "FEMALE", bloodGroup: "AB+", dateOfBirth: new Date("1996-09-12"), address: "Adyar, Chennai, Tamil Nadu", emergencyContact: "Arun Iyer - +91-9000000104" },
    { firstName: "Kabir", lastName: "Mehta", phone: "+91-9000000005", email: "kabir.mehta@example.in", gender: "MALE", bloodGroup: "O-", dateOfBirth: new Date("1985-12-03"), address: "Vastrapur, Ahmedabad, Gujarat", emergencyContact: "Neha Mehta - +91-9000000105" },
    { firstName: "Aisha", lastName: "Khan", phone: "+91-9000000006", email: "aisha.khan@example.in", gender: "FEMALE", bloodGroup: "A-", dateOfBirth: new Date("1992-04-18"), address: "Park Street, Kolkata, West Bengal", emergencyContact: "Imran Khan - +91-9000000106" },
    { firstName: "Rohit", lastName: "Patil", phone: "+91-9000000007", email: "rohit.patil@example.in", gender: "MALE", bloodGroup: "B-", dateOfBirth: new Date("1978-07-25"), address: "FC Road, Pune, Maharashtra", emergencyContact: "Smita Patil - +91-9000000107" },
    { firstName: "Neha", lastName: "Joshi", phone: "+91-9000000008", email: "neha.joshi@example.in", gender: "FEMALE", bloodGroup: "AB-", dateOfBirth: new Date("1993-01-30"), address: "Vashi, Navi Mumbai, Maharashtra", emergencyContact: "Rahul Joshi - +91-9000000108" },
    { firstName: "Arjun", lastName: "Nair", phone: "+91-9000000009", email: "arjun.nair@example.in", gender: "MALE", bloodGroup: "O+", dateOfBirth: new Date("1980-10-14"), address: "Kakkanad, Kochi, Kerala", emergencyContact: "Kavya Nair - +91-9000000109" },
    { firstName: "Priya", lastName: "Rao", phone: "+91-9000000010", email: "priya.rao@example.in", gender: "FEMALE", bloodGroup: "A+", dateOfBirth: new Date("1987-05-07"), address: "HSR Layout, Bengaluru, Karnataka", emergencyContact: "Vivek Rao - +91-9000000110" },
  ];

  const createdPatients = [];
  for (const patient of patients) {
    const createdPatient = await prisma.patient.upsert({
      where: { phone: patient.phone },
      update: {},
      create: patient,
    });
    createdPatients.push(createdPatient);
  }

  // Augment with Indian dataset (users, patients, medicines) - upsert-only
  const indianDoctors = [
    {
      email: "dr.rajesh@hospital.com",
      name: "Dr. Rajesh Kumar",
      role: "DOCTOR",
      department: "General Medicine",
      specialization: "Internal Medicine",
      password: await bcrypt.hash("doctor123", 10),
    },
    {
      email: "dr.priya@hospital.com",
      name: "Dr. Priya Sharma",
      role: "DOCTOR",
      department: "Pediatrics",
      specialization: "Child Health",
      password: await bcrypt.hash("doctor123", 10),
    },
    {
      email: "dr.amit@hospital.com",
      name: "Dr. Amit Patel",
      role: "DOCTOR",
      department: "Orthopedics",
      specialization: "Joint Replacement",
      password: await bcrypt.hash("doctor123", 10),
    },
    {
      email: "dr.neha@hospital.com",
      name: "Dr. Neha Gupta",
      role: "DOCTOR",
      department: "Gynecology",
      specialization: "Obstetrics & Gynae",
      password: await bcrypt.hash("doctor123", 10),
    },
    {
      email: "dr.arjun@hospital.com",
      name: "Dr. Arjun Iyer",
      role: "DOCTOR",
      department: "Cardiology",
      specialization: "Interventional Cardiology",
      password: await bcrypt.hash("doctor123", 10),
    },
  ];

  for (const doc of indianDoctors) {
    await prisma.user.upsert({ where: { email: doc.email }, update: {
      name: doc.name, department: doc.department, specialization: doc.specialization, isActive: true,
    }, create: doc });
  }

  const indianMeds = [
    { name: "Dolo 650", genericName: "Paracetamol", category: "Analgesic", dosageForm: "Tablet", strength: "650mg" },
    { name: "Crocin Advance", genericName: "Paracetamol", category: "Analgesic", dosageForm: "Tablet", strength: "500mg" },
    { name: "Combiflam", genericName: "Ibuprofen + Paracetamol", category: "NSAID", dosageForm: "Tablet", strength: "400mg/325mg" },
    { name: "Azithral 500", genericName: "Azithromycin", category: "Antibiotic", dosageForm: "Tablet", strength: "500mg" },
    { name: "Augmentin 625", genericName: "Amoxicillin + Clavulanate", category: "Antibiotic", dosageForm: "Tablet", strength: "625mg" },
    { name: "Pantocid DSR", genericName: "Pantoprazole + Domperidone", category: "PPI", dosageForm: "Capsule", strength: "40mg/30mg" },
    { name: "Shelcal 500", genericName: "Calcium + Vitamin D3", category: "Supplement", dosageForm: "Tablet", strength: "500mg" },
    { name: "Allegra 120", genericName: "Fexofenadine", category: "Antihistamine", dosageForm: "Tablet", strength: "120mg" },
    { name: "Zerodol SP", genericName: "Aceclofenac + Paracetamol + Serratiopeptidase", category: "NSAID", dosageForm: "Tablet", strength: "100mg/325mg/15mg" },
    { name: "Betadine Gargle", genericName: "Povidone Iodine", category: "Antiseptic", dosageForm: "Solution", strength: "2%" },
  ];
  for (const med of indianMeds) {
    // First ensure category exists
    const category = await prisma.medicineCategory.upsert({
      where: { name: med.category },
      update: {},
      create: { name: med.category, description: null, gstRate: 5.0 },
    });

    // Ensure GST slab exists
    const gstSlab = await prisma.gstSlab.upsert({
      where: { name: "5% GST" },
      update: {},
      create: { name: "5% GST", rate: 5.0, description: "Default slab" },
    });

    // Create medicine with proper foreign key references
    await prisma.medicine.upsert({
      where: { name: med.name },
      update: {},
      create: {
        name: med.name,
        genericName: med.genericName,
        brand: med.name,
        manufacturer: "Generic Manufacturer",
        categoryId: category.id,
        gstSlabId: gstSlab.id,
        dosageForm: med.dosageForm,
        strength: med.strength,
        unitType: "Unit",
        mrp: 100,
        purchasePrice: 80,
        marginPercentage: 20,
        prescriptionRequired: true,
        isActive: true,
      }
    });
  }

  const indianPatients = [
    { firstName: "Rahul", lastName: "Verma", phone: "+91-9876543210", email: "rahul.verma@example.in", gender: "MALE", bloodGroup: "B+", dateOfBirth: new Date("1991-04-10"), address: "DLF Phase 3, Gurugram, Haryana", emergencyContact: "Anita Verma - +91-9876500011" },
    { firstName: "Anjali", lastName: "Singh", phone: "+91-9811122233", email: "anjali.singh@example.in", gender: "FEMALE", bloodGroup: "O+", dateOfBirth: new Date("1993-09-22"), address: "Powai, Mumbai, Maharashtra", emergencyContact: "Ravi Singh - +91-9811100000" },
    { firstName: "Rohan", lastName: "Mehta", phone: "+91-9900012345", email: "rohan.mehta@example.in", gender: "MALE", bloodGroup: "A+", dateOfBirth: new Date("1987-12-01"), address: "Banjara Hills, Hyderabad, Telangana", emergencyContact: "Neha Mehta - +91-9900010001" },
    { firstName: "Kavya", lastName: "Nair", phone: "+91-9887788899", email: "kavya.nair@example.in", gender: "FEMALE", bloodGroup: "AB+", dateOfBirth: new Date("1996-05-18"), address: "Indiranagar, Bengaluru, Karnataka", emergencyContact: "Arjun Nair - +91-9887700000" },
    { firstName: "Vivek", lastName: "Rao", phone: "+91-9797979797", email: "vivek.rao@example.in", gender: "MALE", bloodGroup: "O-", dateOfBirth: new Date("1982-07-29"), address: "Gachibowli, Hyderabad, Telangana", emergencyContact: "Sneha Rao - +91-9797900000" },
  ];
  for (const p of indianPatients) {
    const cp = await prisma.patient.upsert({ where: { phone: p.phone }, update: {}, create: p });
    createdPatients.push(cp);
  }

  // Seed General consultation fees for all doctors
  const allDoctors = await prisma.user.findMany({ where: { role: "DOCTOR", isActive: true } });
  for (const d of allDoctors) {
    const fee = 400 + Math.floor(Math.random() * 6) * 100; // 400,500,...,900
    await prisma.doctorConsultationFee.upsert({
      where: { doctorId_consultationType: { doctorId: d.id, consultationType: "GENERAL" } },
      update: { fee, isActive: true },
      create: { doctorId: d.id, consultationType: "GENERAL", fee, isActive: true },
    });
  }

  // Create sample appointments
  const appointmentTypes = [
    "CONSULTATION",
    "FOLLOW_UP",
    "EMERGENCY",
    "ROUTINE_CHECKUP",
  ];
  const appointmentStatuses = [
    "SCHEDULED",
    "COMPLETED",
    "CANCELLED",
    "IN_PROGRESS",
  ];

  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
  });

  const appointments = [];
  for (let i = 0; i < 25; i++) {
    const randomPatient =
      createdPatients[Math.floor(Math.random() * createdPatients.length)];
    const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
    const randomType =
      appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
    const randomStatus =
      appointmentStatuses[
        Math.floor(Math.random() * appointmentStatuses.length)
      ];

    // Generate random date within last 30 days or next 30 days
    const baseDate = new Date();
    const randomDays = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
    const appointmentDate = new Date(
      baseDate.getTime() + randomDays * 24 * 60 * 60 * 1000,
    );

    // Random time between 9 AM and 5 PM
    const hours = Math.floor(Math.random() * 8) + 9; // 9-16 (9 AM - 4 PM)
    const minutes = Math.random() < 0.5 ? 0 : 30; // 0 or 30 minutes
    appointmentDate.setHours(hours, minutes, 0, 0);

    appointments.push({
      patientId: randomPatient.id,
      doctorId: randomDoctor.id,
      dateTime: appointmentDate,
      type: randomType,
      status: randomStatus,
      notes: `${randomType.toLowerCase()} appointment for ${randomPatient.firstName} ${randomPatient.lastName}`,
    });
  }

  for (const appointment of appointments) {
    await prisma.appointment.create({
      data: appointment,
    });
  }

  // Create a handful of Indian-style prescriptions (pending billing)
  const sampleBundles = [
    {
      medicines: [
        { name: "Dolo 650", dosage: "1 tablet", frequency: "twice daily", duration: "5 days", instructions: "After food" },
        { name: "Pantocid DSR", dosage: "1 capsule", frequency: "once daily", duration: "10 days", instructions: "Before breakfast" },
      ],
      labTests: [ { name: "CBC", instructions: "Fasting not required" } ],
      therapies: [],
    },
    {
      medicines: [
        { name: "Azithral 500", dosage: "1 tablet", frequency: "once daily", duration: "3 days", instructions: "After food" },
        { name: "Allegra 120", dosage: "1 tablet", frequency: "once daily", duration: "7 days", instructions: "Night" },
      ],
      labTests: [ { name: "LFT", instructions: "Overnight fasting" } ],
      therapies: [],
    },
  ];

  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  for (let i = 0; i < 8; i++) {
    const pt = pick(createdPatients);
    const doc = pick(allDoctors);
    const bundle = pick(sampleBundles);
    await prisma.prescription.create({
      data: {
        patientId: pt.id,
        doctorId: doc.id,
        medicines: JSON.stringify(bundle),
        notes: "Seeded prescription",
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("👤 Default users created:");
  console.log("   Admin: admin@hospital.com / admin123");
  console.log("   Doctor: doctor@hospital.com / doctor123");
  console.log("   Receptionist: reception@hospital.com / reception123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
