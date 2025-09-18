import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { seedIPDData } from "./ipd-seed";
import { seedPermissionsAndRoles } from "./permissions-seed";
import { seedProblemCategories } from "./problem-categories-seed";

const prisma = new PrismaClient();

export async function comprehensiveSeed() {
  console.log("🌱 Starting comprehensive Hospital Management System seeding...\n");

  try {
    // 1. Hospital Settings
    await seedHospitalSettings();
    
    // 2. Users and Staff
    await seedUsers();
    
    // 3. Medicines
    await seedMedicines();
    
    // 4. Patients
    const patients = await seedPatients();
    
    // 5. Appointment Sessions
    await seedAppointmentSessions();
    
    // 6. Appointments with varied data
    await seedAppointments(patients);
    
    // 7. Consultation fees for all doctors
    await seedConsultationFees();
    
    // 8. Sample prescriptions
    await seedPrescriptions(patients);
    
    // 9. Sample bills
    await seedBills(patients);
    
    // 10. Doctor availability
    await seedDoctorAvailability();
    
    // 11. Sample admissions (IPD)
    await seedSampleAdmissions(patients);
    
    // 12. Sample vitals
    await seedVitals(patients);

    console.log("✅ Comprehensive seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error during comprehensive seeding:", error);
    throw error;
  }
}

async function seedHospitalSettings() {
  console.log("🏥 Seeding hospital settings...");
  
  await prisma.hospitalSettings.upsert({
    where: { id: "hospital-main" },
    update: {},
    create: {
      id: "hospital-main",
      name: "MediCare Hospital & Research Center",
      tagline: "Excellence in Healthcare, Compassion in Care",
      phone: "+91-11-2345-6789",
      email: "info@medicare-hospital.in",
      address: "123 Health Avenue, Medical District, New Delhi - 110001, India",
      vision: "To be the leading healthcare provider in India, delivering world-class medical services with compassion and innovation.",
      mission: "We are committed to providing comprehensive, accessible, and affordable healthcare services to all sections of society while maintaining the highest standards of medical excellence.",
      primaryColor: "#059669", // Emerald green
      secondaryColor: "#0d9488", // Teal
      businessStartTime: "08:00",
      businessEndTime: "20:00",
      lunchBreakStart: "13:30",
      lunchBreakEnd: "14:30",
      tokenPrefix: "MED",
      sessionPrefix: "S",
      maxTokensPerSession: 40,
      allowPublicBooking: true,
      requirePatientDetails: true,
      autoAssignTokens: true,
      enableCarryForward: true,
    }
  });
  
  console.log("✅ Hospital settings seeded");
}

async function seedUsers() {
  console.log("👥 Seeding users and staff...");
  
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const users = [
    // Admin
    {
      email: "admin@medicare-hospital.in",
      name: "System Administrator",
      password: hashedPassword,
      role: "ADMIN",
      department: "Administration",
      specialization: "Hospital Management"
    },
    
    // Doctors
    {
      email: "dr.rajesh@medicare-hospital.in",
      name: "Dr. Rajesh Kumar Sharma",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
      department: "General Medicine",
      specialization: "Internal Medicine & Diabetes Care"
    },
    {
      email: "dr.priya@medicare-hospital.in", 
      name: "Dr. Priya Singh",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
      department: "Pediatrics",
      specialization: "Child Health & Vaccination"
    },
    {
      email: "dr.amit@medicare-hospital.in",
      name: "Dr. Amit Patel",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
      department: "Orthopedics",
      specialization: "Joint Replacement & Sports Injury"
    },
    {
      email: "dr.neha@medicare-hospital.in",
      name: "Dr. Neha Gupta",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
      department: "Gynecology",
      specialization: "Obstetrics & Women's Health"
    },
    {
      email: "dr.arjun@medicare-hospital.in",
      name: "Dr. Arjun Iyer",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
      department: "Cardiology",
      specialization: "Interventional Cardiology"
    },
    {
      email: "dr.kavya@medicare-hospital.in",
      name: "Dr. Kavya Reddy",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR", 
      department: "Dermatology",
      specialization: "Skin & Cosmetic Dermatology"
    },
    {
      email: "dr.vikram@medicare-hospital.in",
      name: "Dr. Vikram Mehta",
      password: await bcrypt.hash("doctor123", 10),
      role: "DOCTOR",
      department: "ENT",
      specialization: "Ear, Nose & Throat Surgery"
    },
    
    // Nurses
    {
      email: "nurse.mary@medicare-hospital.in",
      name: "Mary Williams",
      password: await bcrypt.hash("nurse123", 10),
      role: "NURSE",
      department: "General Ward",
      specialization: "General Nursing Care"
    },
    {
      email: "nurse.sarah@medicare-hospital.in",
      name: "Sarah Johnson", 
      password: await bcrypt.hash("nurse123", 10),
      role: "NURSE",
      department: "ICU",
      specialization: "Critical Care Nursing"
    },
    {
      email: "nurse.david@medicare-hospital.in",
      name: "David Brown",
      password: await bcrypt.hash("nurse123", 10),
      role: "NURSE",
      department: "Pediatric Ward",
      specialization: "Pediatric Nursing"
    },
    
    // Receptionists
    {
      email: "reception@medicare-hospital.in",
      name: "Reception Desk - Main",
      password: await bcrypt.hash("reception123", 10),
      role: "RECEPTIONIST",
      department: "Front Office",
      specialization: "Patient Registration & Appointments"
    },
    {
      email: "reception2@medicare-hospital.in",
      name: "Lisa Anderson",
      password: await bcrypt.hash("reception123", 10),
      role: "RECEPTIONIST", 
      department: "Front Office",
      specialization: "Billing & Discharge"
    }
  ];
  
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        department: user.department,
        specialization: user.specialization,
        isActive: true
      },
      create: user
    });
  }
  
  console.log(`✅ Created ${users.length} users and staff`);
}

async function seedMedicines() {
  console.log("💊 Seeding medicines...");
  
  const medicines = [
    // Common Indian Medicines
    { name: "Dolo 650", genericName: "Paracetamol", category: "Analgesic", dosageForm: "Tablet", strength: "650mg", manufacturer: "Micro Labs" },
    { name: "Crocin 500", genericName: "Paracetamol", category: "Analgesic", dosageForm: "Tablet", strength: "500mg", manufacturer: "GSK" },
    { name: "Combiflam", genericName: "Ibuprofen + Paracetamol", category: "NSAID", dosageForm: "Tablet", strength: "400mg/325mg", manufacturer: "Sanofi" },
    { name: "Azithral 500", genericName: "Azithromycin", category: "Antibiotic", dosageForm: "Tablet", strength: "500mg", manufacturer: "Alembic" },
    { name: "Augmentin 625", genericName: "Amoxicillin + Clavulanate", category: "Antibiotic", dosageForm: "Tablet", strength: "625mg", manufacturer: "GSK" },
    { name: "Pantocid DSR", genericName: "Pantoprazole + Domperidone", category: "PPI", dosageForm: "Capsule", strength: "40mg/30mg", manufacturer: "Sun Pharma" },
    { name: "Shelcal 500", genericName: "Calcium + Vitamin D3", category: "Supplement", dosageForm: "Tablet", strength: "500mg", manufacturer: "Torrent" },
    { name: "Allegra 120", genericName: "Fexofenadine", category: "Antihistamine", dosageForm: "Tablet", strength: "120mg", manufacturer: "Sanofi" },
    { name: "Zerodol SP", genericName: "Aceclofenac + Paracetamol + Serratiopeptidase", category: "NSAID", dosageForm: "Tablet", strength: "100mg/325mg/15mg", manufacturer: "IPCA" },
    { name: "Betadine Gargle", genericName: "Povidone Iodine", category: "Antiseptic", dosageForm: "Solution", strength: "2%", manufacturer: "Mundipharma" },
    { name: "Volini Gel", genericName: "Diclofenac", category: "Topical Analgesic", dosageForm: "Gel", strength: "1.16%", manufacturer: "Ranbaxy" },
    { name: "Calpol 250", genericName: "Paracetamol", category: "Pediatric Analgesic", dosageForm: "Syrup", strength: "250mg/5ml", manufacturer: "GSK" },
    { name: "Zincovit", genericName: "Multivitamin + Zinc", category: "Supplement", dosageForm: "Syrup", strength: "200ml", manufacturer: "Apex Labs" },
    { name: "ORS", genericName: "Oral Rehydration Solution", category: "Electrolyte", dosageForm: "Powder", strength: "21.8g", manufacturer: "Various" },
    { name: "Sinarest", genericName: "Paracetamol + Phenylephrine + Chlorpheniramine", category: "Cold & Flu", dosageForm: "Tablet", strength: "500mg/10mg/2mg", manufacturer: "Centaur" },
    { name: "Pudin Hara", genericName: "Pudina Satva", category: "Digestive", dosageForm: "Liquid", strength: "10ml", manufacturer: "Dabur" },
    { name: "Hajmola", genericName: "Digestive Tablets", category: "Digestive", dosageForm: "Tablet", strength: "Various", manufacturer: "Dabur" },
    { name: "Electral Powder", genericName: "ORS", category: "Electrolyte", dosageForm: "Powder", strength: "21.8g", manufacturer: "FDC" },
    { name: "Wikoryl", genericName: "Paracetamol + Phenylephrine + Chlorpheniramine", category: "Cold & Flu", dosageForm: "Tablet", strength: "325mg/5mg/2mg", manufacturer: "Alembic" },
    { name: "D Cold Total", genericName: "Paracetamol + Phenylephrine + Cetirizine + Caffeine", category: "Cold & Flu", dosageForm: "Tablet", strength: "325mg/5mg/5mg/30mg", manufacturer: "Paras" }
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
        manufacturer: m.manufacturer,
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
      }
    });
  }
  
  console.log(`✅ Created ${medicines.length} medicines`);
}

async function seedPatients() {
  console.log("🧑‍🤝‍🧑 Seeding patients...");
  
  const patients = [
    { firstName: "Aarav", lastName: "Sharma", phone: "+91-9000000001", email: "aarav.sharma@gmail.com", gender: "MALE", bloodGroup: "O+", dateOfBirth: new Date("1994-07-15"), address: "Dwarka Sector 12, New Delhi - 110075", emergencyContact: "Rohit Sharma - +91-9000000101", allergies: "Penicillin" },
    { firstName: "Ishika", lastName: "Gupta", phone: "+91-9000000002", email: "ishika.gupta@gmail.com", gender: "FEMALE", bloodGroup: "A+", dateOfBirth: new Date("1991-03-22"), address: "Kothrud, Pune, Maharashtra - 411038", emergencyContact: "Anil Gupta - +91-9000000102" },
    { firstName: "Vivaan", lastName: "Reddy", phone: "+91-9000000003", email: "vivaan.reddy@gmail.com", gender: "MALE", bloodGroup: "B+", dateOfBirth: new Date("1989-11-08"), address: "Madhapur, Hyderabad, Telangana - 500081", emergencyContact: "Meera Reddy - +91-9000000103", allergies: "Shellfish" },
    { firstName: "Diya", lastName: "Iyer", phone: "+91-9000000004", email: "diya.iyer@gmail.com", gender: "FEMALE", bloodGroup: "AB+", dateOfBirth: new Date("1996-09-12"), address: "Adyar, Chennai, Tamil Nadu - 600020", emergencyContact: "Arun Iyer - +91-9000000104" },
    { firstName: "Kabir", lastName: "Mehta", phone: "+91-9000000005", email: "kabir.mehta@gmail.com", gender: "MALE", bloodGroup: "O-", dateOfBirth: new Date("1985-12-03"), address: "Vastrapur, Ahmedabad, Gujarat - 380015", emergencyContact: "Neha Mehta - +91-9000000105", allergies: "Sulfa drugs" },
    { firstName: "Aisha", lastName: "Khan", phone: "+91-9000000006", email: "aisha.khan@gmail.com", gender: "FEMALE", bloodGroup: "A-", dateOfBirth: new Date("1992-04-18"), address: "Park Street, Kolkata, West Bengal - 700016", emergencyContact: "Imran Khan - +91-9000000106" },
    { firstName: "Rohit", lastName: "Patil", phone: "+91-9000000007", email: "rohit.patil@gmail.com", gender: "MALE", bloodGroup: "B-", dateOfBirth: new Date("1978-07-25"), address: "FC Road, Pune, Maharashtra - 411005", emergencyContact: "Smita Patil - +91-9000000107", allergies: "Aspirin" },
    { firstName: "Neha", lastName: "Joshi", phone: "+91-9000000008", email: "neha.joshi@gmail.com", gender: "FEMALE", bloodGroup: "AB-", dateOfBirth: new Date("1993-01-30"), address: "Vashi, Navi Mumbai, Maharashtra - 400703", emergencyContact: "Rahul Joshi - +91-9000000108" },
    { firstName: "Arjun", lastName: "Nair", phone: "+91-9000000009", email: "arjun.nair@gmail.com", gender: "MALE", bloodGroup: "O+", dateOfBirth: new Date("1980-10-14"), address: "Kakkanad, Kochi, Kerala - 682030", emergencyContact: "Kavya Nair - +91-9000000109", allergies: "Peanuts" },
    { firstName: "Priya", lastName: "Rao", phone: "+91-9000000010", email: "priya.rao@gmail.com", gender: "FEMALE", bloodGroup: "A+", dateOfBirth: new Date("1987-05-07"), address: "HSR Layout, Bengaluru, Karnataka - 560102", emergencyContact: "Vivek Rao - +91-9000000110" },
    { firstName: "Rahul", lastName: "Verma", phone: "+91-9876543210", email: "rahul.verma@gmail.com", gender: "MALE", bloodGroup: "B+", dateOfBirth: new Date("1991-04-10"), address: "DLF Phase 3, Gurugram, Haryana - 122002", emergencyContact: "Anita Verma - +91-9876500011" },
    { firstName: "Anjali", lastName: "Singh", phone: "+91-9811122233", email: "anjali.singh@gmail.com", gender: "FEMALE", bloodGroup: "O+", dateOfBirth: new Date("1993-09-22"), address: "Powai, Mumbai, Maharashtra - 400076", emergencyContact: "Ravi Singh - +91-9811100000", allergies: "Latex" },
    { firstName: "Rohan", lastName: "Mehta", phone: "+91-9900012345", email: "rohan.mehta@gmail.com", gender: "MALE", bloodGroup: "A+", dateOfBirth: new Date("1987-12-01"), address: "Banjara Hills, Hyderabad, Telangana - 500034", emergencyContact: "Neha Mehta - +91-9900010001" },
    { firstName: "Kavya", lastName: "Nair", phone: "+91-9887788899", email: "kavya.nair@gmail.com", gender: "FEMALE", bloodGroup: "AB+", dateOfBirth: new Date("1996-05-18"), address: "Indiranagar, Bengaluru, Karnataka - 560038", emergencyContact: "Arjun Nair - +91-9887700000" },
    { firstName: "Vivek", lastName: "Rao", phone: "+91-9797979797", email: "vivek.rao@gmail.com", gender: "MALE", bloodGroup: "O-", dateOfBirth: new Date("1982-07-29"), address: "Gachibowli, Hyderabad, Telangana - 500032", emergencyContact: "Sneha Rao - +91-9797900000", allergies: "Codeine" }
  ];
  
  const createdPatients = [];
  for (const patient of patients) {
    const createdPatient = await prisma.patient.upsert({
      where: { phone: patient.phone },
      update: {},
      create: patient
    });
    createdPatients.push(createdPatient);
  }
  
  console.log(`✅ Created ${patients.length} patients`);
  return createdPatients;
}

async function seedAppointmentSessions() {
  console.log("📅 Seeding appointment sessions...");
  
  const sessions = [
    { name: "Morning", shortCode: "S1", startTime: "09:00", endTime: "13:00", maxTokens: 25 },
    { name: "Afternoon", shortCode: "S2", startTime: "14:00", endTime: "18:00", maxTokens: 25 },
    { name: "Evening", shortCode: "S3", startTime: "18:30", endTime: "20:00", maxTokens: 15 }
  ];
  
  // Create sessions for the next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    for (const session of sessions) {
      await prisma.appointmentSession.upsert({
        where: {
          date_shortCode: {
            date,
            shortCode: session.shortCode
          }
        },
        update: {},
        create: {
          date,
          name: session.name,
          shortCode: session.shortCode,
          startTime: session.startTime,
          endTime: session.endTime,
          maxTokens: session.maxTokens,
          currentTokens: 0,
          isActive: true
        }
      });
    }
  }
  
  console.log("✅ Created appointment sessions for next 30 days");
}

async function seedAppointments(patients: any[]) {
  console.log("📋 Seeding appointments...");
  
  const doctors = await prisma.user.findMany({ where: { role: "DOCTOR" } });
  const appointmentTypes = ["CONSULTATION", "FOLLOW_UP", "EMERGENCY", "ROUTINE_CHECKUP"];
  const statuses = ["SCHEDULED", "COMPLETED", "CANCELLED", "ARRIVED", "WAITING", "IN_CONSULTATION"];
  
  for (let i = 0; i < 50; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const type = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate random date within last 15 days or next 15 days
    const baseDate = new Date();
    const randomDays = Math.floor(Math.random() * 30) - 15;
    const appointmentDate = new Date(baseDate.getTime() + randomDays * 24 * 60 * 60 * 1000);
    
    // Random time between 9 AM and 6 PM
    const hours = Math.floor(Math.random() * 9) + 9; // 9-17
    const minutes = Math.random() < 0.5 ? 0 : 30;
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        dateTime: appointmentDate,
        type,
        status,
        notes: `${type} appointment for ${patient.firstName} ${patient.lastName} - ${type === 'EMERGENCY' ? 'Urgent care needed' : 'Routine checkup'}`,
        tokenNumber: `MED-${String(i + 1).padStart(3, '0')}`,
        priority: type === 'EMERGENCY' ? 'HIGH' : 'NORMAL',
        estimatedDuration: type === 'EMERGENCY' ? 60 : 30
      }
    });
  }
  
  console.log("✅ Created 50 sample appointments");
}

async function seedConsultationFees() {
  console.log("💰 Seeding consultation fees...");
  
  const doctors = await prisma.user.findMany({ where: { role: "DOCTOR" } });
  const consultationTypes = ["GENERAL", "SPECIALIST", "EMERGENCY"];
  
  for (const doctor of doctors) {
    for (const type of consultationTypes) {
      const baseFee = type === "GENERAL" ? 500 : type === "SPECIALIST" ? 800 : 1000;
      const fee = baseFee + Math.floor(Math.random() * 5) * 100;
      
      await prisma.doctorConsultationFee.upsert({
        where: {
          doctorId_consultationType: {
            doctorId: doctor.id,
            consultationType: type
          }
        },
        update: { fee, isActive: true },
        create: {
          doctorId: doctor.id,
          consultationType: type,
          fee,
          isActive: true
        }
      });
    }
  }
  
  console.log("✅ Set consultation fees for all doctors");
}

async function seedPrescriptions(patients: any[]) {
  console.log("📝 Seeding prescriptions...");
  
  const doctors = await prisma.user.findMany({ where: { role: "DOCTOR" } });
  
  const samplePrescriptions = [
    {
      medicines: [
        { name: "Dolo 650", dosage: "1 tablet", frequency: "twice daily", duration: "5 days", instructions: "After meals" },
        { name: "Pantocid DSR", dosage: "1 capsule", frequency: "once daily", duration: "10 days", instructions: "Before breakfast" }
      ],
      symptoms: "Fever, headache, body ache",
      diagnosis: "Viral fever",
      notes: "Rest, plenty of fluids. Follow up if fever persists beyond 5 days."
    },
    {
      medicines: [
        { name: "Azithral 500", dosage: "1 tablet", frequency: "once daily", duration: "3 days", instructions: "After food" },
        { name: "Allegra 120", dosage: "1 tablet", frequency: "once daily", duration: "7 days", instructions: "At bedtime" }
      ],
      symptoms: "Cough, cold, running nose",
      diagnosis: "Upper respiratory tract infection",
      notes: "Avoid cold foods and drinks. Steam inhalation twice daily."
    }
  ];
  
  for (let i = 0; i < 20; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const prescription = samplePrescriptions[Math.floor(Math.random() * samplePrescriptions.length)];
    
    await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        medicines: JSON.stringify(prescription.medicines),
        symptoms: prescription.symptoms,
        diagnosis: prescription.diagnosis,
        notes: prescription.notes,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
      }
    });
  }
  
  console.log("✅ Created 20 sample prescriptions");
}

async function seedBills(patients: any[]) {
  console.log("💳 Seeding bills...");
  
  const doctors = await prisma.user.findMany({ where: { role: "DOCTOR" } });
  const receptionists = await prisma.user.findMany({ where: { role: "RECEPTIONIST" } });
  
  for (let i = 0; i < 15; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const receptionist = receptionists[0] || doctors[0];
    
    const consultationFee = 500 + Math.floor(Math.random() * 5) * 100;
    const totalAmount = consultationFee;
    const cgst = totalAmount * 0.09;
    const sgst = totalAmount * 0.09;
    const finalAmount = totalAmount + cgst + sgst;
    
    await prisma.bill.create({
      data: {
        billNumber: `MED-B-${String(i + 1).padStart(4, '0')}`,
        patientId: patient.id,
        doctorId: doctor.id,
        consultationFee,
        totalAmount,
        cgst,
        sgst,
        finalAmount,
        paymentStatus: Math.random() > 0.3 ? "PAID" : "PENDING",
        paymentMethod: Math.random() > 0.5 ? "UPI" : "CASH",
        paidAmount: Math.random() > 0.3 ? finalAmount : 0,
        balanceAmount: Math.random() > 0.3 ? 0 : finalAmount,
        createdBy: receptionist.id,
        notes: "Consultation fee"
      }
    });
  }
  
  console.log("✅ Created 15 sample bills");
}

async function seedDoctorAvailability() {
  console.log("📅 Seeding doctor availability...");
  
  const doctors = await prisma.user.findMany({ where: { role: "DOCTOR" } });
  
  // Add some random leave/unavailability for doctors
  for (const doctor of doctors.slice(0, 3)) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 10));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);
    
    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctor.id,
        type: "LEAVE",
        startDate,
        endDate,
        reason: "Personal leave",
        isRecurring: false,
        isActive: true
      }
    });
  }
  
  console.log("✅ Created doctor availability records");
}

async function seedSampleAdmissions(patients: any[]) {
  console.log("🏥 Seeding sample admissions...");
  
  const beds = await prisma.bed.findMany({ 
    where: { status: "AVAILABLE" },
    take: 5 
  });
  const doctors = await prisma.user.findMany({ where: { role: "DOCTOR" } });
  
  for (let i = 0; i < Math.min(5, beds.length); i++) {
    const bed = beds[i];
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    
    // Create admission
    await prisma.admission.create({
      data: {
        patientId: patient.id,
        bedId: bed.id,
        admittedBy: doctor.id,
        admissionDate: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
        admissionType: Math.random() > 0.5 ? "EMERGENCY" : "PLANNED",
        diagnosis: "Requires observation and treatment",
        chiefComplaint: "Patient reported severe symptoms",
        admissionNotes: "Patient admitted for comprehensive treatment and monitoring",
        estimatedStay: Math.floor(Math.random() * 7) + 1
      }
    });
    
    // Update bed status to occupied
    await prisma.bed.update({
      where: { id: bed.id },
      data: { status: "OCCUPIED" }
    });
  }
  
  console.log("✅ Created 5 sample admissions");
}

async function seedVitals(patients: any[]) {
  console.log("🩺 Seeding patient vitals...");
  
  for (let i = 0; i < 30; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    
    await prisma.vital.create({
      data: {
        patientId: patient.id,
        temperature: 98.0 + Math.random() * 4, // 98-102°F
        bloodPressure: `${110 + Math.floor(Math.random() * 30)}/${70 + Math.floor(Math.random() * 20)}`,
        heartRate: 60 + Math.floor(Math.random() * 40), // 60-100 bpm
        weight: 50 + Math.random() * 40, // 50-90 kg
        height: 150 + Math.random() * 30, // 150-180 cm
        notes: "Routine vital signs check",
        recordedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      }
    });
  }
  
  console.log("✅ Created 30 vital sign records");
}

// Main execution
if (require.main === module) {
  comprehensiveSeed()
    .then(async () => {
      // Also seed IPD, permissions, and problem categories
      await seedIPDData();
      await seedPermissionsAndRoles();  
      await seedProblemCategories();
      
      console.log("🎉 All seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
