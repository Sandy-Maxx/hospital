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

  for (const medicine of medicines) {
    await prisma.medicine.upsert({
      where: { name: medicine.name },
      update: {},
      create: medicine,
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

  // Create comprehensive sample patients
  const patients = [
    {
      firstName: "John",
      lastName: "Doe",
      phone: "+1-555-0101",
      email: "john.doe@email.com",
      gender: "MALE",
      bloodGroup: "O+",
      dateOfBirth: new Date("1985-06-15"),
      address: "123 Main St, Springfield, IL 62701",
      emergencyContact: "Jane Doe - +1-555-0102",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      phone: "+1-555-0103",
      email: "jane.smith@email.com",
      gender: "FEMALE",
      bloodGroup: "A+",
      dateOfBirth: new Date("1990-03-22"),
      address: "456 Oak Ave, Springfield, IL 62702",
      emergencyContact: "Robert Smith - +1-555-0104",
    },
    {
      firstName: "Michael",
      lastName: "Johnson",
      phone: "+1-555-0105",
      email: "michael.j@email.com",
      gender: "MALE",
      bloodGroup: "B+",
      dateOfBirth: new Date("1978-11-08"),
      address: "789 Pine Rd, Springfield, IL 62703",
      emergencyContact: "Sarah Johnson - +1-555-0106",
    },
    {
      firstName: "Emily",
      lastName: "Davis",
      phone: "+1-555-0107",
      email: "emily.davis@email.com",
      gender: "FEMALE",
      bloodGroup: "AB+",
      dateOfBirth: new Date("1995-09-12"),
      address: "321 Elm St, Springfield, IL 62704",
      emergencyContact: "Mark Davis - +1-555-0108",
    },
    {
      firstName: "Robert",
      lastName: "Wilson",
      phone: "+1-555-0109",
      email: "robert.wilson@email.com",
      gender: "MALE",
      bloodGroup: "O-",
      dateOfBirth: new Date("1965-12-03"),
      address: "654 Maple Dr, Springfield, IL 62705",
      emergencyContact: "Linda Wilson - +1-555-0110",
    },
    {
      firstName: "Sarah",
      lastName: "Brown",
      phone: "+1-555-0111",
      email: "sarah.brown@email.com",
      gender: "FEMALE",
      bloodGroup: "A-",
      dateOfBirth: new Date("1988-04-18"),
      address: "987 Cedar Ln, Springfield, IL 62706",
      emergencyContact: "Tom Brown - +1-555-0112",
    },
    {
      firstName: "David",
      lastName: "Miller",
      phone: "+1-555-0113",
      email: "david.miller@email.com",
      gender: "MALE",
      bloodGroup: "B-",
      dateOfBirth: new Date("1972-07-25"),
      address: "147 Birch St, Springfield, IL 62707",
      emergencyContact: "Anna Miller - +1-555-0114",
    },
    {
      firstName: "Lisa",
      lastName: "Garcia",
      phone: "+1-555-0115",
      email: "lisa.garcia@email.com",
      gender: "FEMALE",
      bloodGroup: "AB-",
      dateOfBirth: new Date("1993-01-30"),
      address: "258 Walnut Ave, Springfield, IL 62708",
      emergencyContact: "Carlos Garcia - +1-555-0116",
    },
    {
      firstName: "James",
      lastName: "Martinez",
      phone: "+1-555-0117",
      email: "james.martinez@email.com",
      gender: "MALE",
      bloodGroup: "O+",
      dateOfBirth: new Date("1980-10-14"),
      address: "369 Spruce Rd, Springfield, IL 62709",
      emergencyContact: "Maria Martinez - +1-555-0118",
    },
    {
      firstName: "Amanda",
      lastName: "Taylor",
      phone: "+1-555-0119",
      email: "amanda.taylor@email.com",
      gender: "FEMALE",
      bloodGroup: "A+",
      dateOfBirth: new Date("1987-05-07"),
      address: "741 Ash Blvd, Springfield, IL 62710",
      emergencyContact: "Kevin Taylor - +1-555-0120",
    },
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
    await prisma.medicine.upsert({ where: { name: med.name }, update: {}, create: med });
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
