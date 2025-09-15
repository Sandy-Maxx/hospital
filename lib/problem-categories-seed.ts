import { prisma } from "./prisma";

export const PROBLEM_CATEGORIES_SEED = [
  // General & Primary Care
  {
    name: "General Consultation",
    description: "General health concerns, routine check-ups, basic medical advice",
    color: "#10B981", // green
    icon: "user-doctor", // FontAwesome icon name
    sortOrder: 1
  },
  {
    name: "Fever & Flu",
    description: "Fever, flu symptoms, cold, cough, seasonal infections",
    color: "#EF4444", // red
    icon: "thermometer",
    sortOrder: 2
  },
  {
    name: "Headache & Migraine",
    description: "Headache, migraine, tension headaches, cluster headaches",
    color: "#8B5CF6", // purple
    icon: "head-side-cough",
    sortOrder: 3
  },
  
  // Specialist Consultations
  {
    name: "Heart & Cardiology",
    description: "Chest pain, heart problems, blood pressure, cardiac concerns",
    color: "#DC2626", // red
    icon: "heart-pulse",
    sortOrder: 10
  },
  {
    name: "Respiratory Issues",
    description: "Breathing problems, asthma, chest congestion, lung issues",
    color: "#0EA5E9", // blue
    icon: "lungs",
    sortOrder: 11
  },
  {
    name: "Digestive Problems",
    description: "Stomach pain, indigestion, acid reflux, digestive disorders",
    color: "#F59E0B", // amber
    icon: "stomach",
    sortOrder: 12
  },
  {
    name: "Skin & Dermatology",
    description: "Skin rashes, allergies, dermatitis, skin infections",
    color: "#F97316", // orange
    icon: "hand-dots",
    sortOrder: 13
  },
  {
    name: "Eye Problems",
    description: "Vision issues, eye pain, redness, eye infections",
    color: "#06B6D4", // cyan
    icon: "eye",
    sortOrder: 14
  },
  {
    name: "Ear, Nose & Throat",
    description: "ENT issues, sore throat, ear pain, nasal congestion",
    color: "#84CC16", // lime
    icon: "ear-listen",
    sortOrder: 15
  },
  
  // Orthopedic & Pain
  {
    name: "Joint & Bone Pain",
    description: "Arthritis, joint pain, bone fractures, orthopedic issues",
    color: "#78716C", // stone
    icon: "bone",
    sortOrder: 20
  },
  {
    name: "Back & Neck Pain",
    description: "Spinal issues, neck pain, back pain, posture problems",
    color: "#A855F7", // purple
    icon: "person-walking",
    sortOrder: 21
  },
  {
    name: "Sports Injury",
    description: "Athletic injuries, muscle strains, sports-related trauma",
    color: "#059669", // emerald
    icon: "person-running",
    sortOrder: 22
  },
  
  // Women's Health
  {
    name: "Women's Health",
    description: "Gynecological issues, reproductive health, pregnancy concerns",
    color: "#EC4899", // pink
    icon: "venus",
    sortOrder: 30
  },
  {
    name: "Pregnancy Care",
    description: "Prenatal care, pregnancy complications, maternity health",
    color: "#F472B6", // pink
    icon: "baby",
    sortOrder: 31
  },
  
  // Children's Health
  {
    name: "Child Health",
    description: "Pediatric concerns, child growth, development issues",
    color: "#22D3EE", // cyan
    icon: "child",
    sortOrder: 40
  },
  {
    name: "Vaccination",
    description: "Immunizations, vaccine schedules, booster shots",
    color: "#16A34A", // green
    icon: "syringe",
    sortOrder: 41
  },
  
  // Mental Health
  {
    name: "Mental Health",
    description: "Anxiety, depression, stress management, psychological support",
    color: "#7C3AED", // violet
    icon: "brain",
    sortOrder: 50
  },
  {
    name: "Sleep Disorders",
    description: "Insomnia, sleep apnea, sleep-related issues",
    color: "#1E40AF", // blue
    icon: "moon",
    sortOrder: 51
  },
  
  // Emergency & Urgent
  {
    name: "Emergency",
    description: "Urgent medical conditions requiring immediate attention",
    color: "#DC2626", // red
    icon: "truck-medical",
    sortOrder: 100
  },
  {
    name: "Accident & Trauma",
    description: "Injuries from accidents, cuts, wounds, emergency trauma",
    color: "#B91C1C", // red
    icon: "house-medical-circle-exclamation",
    sortOrder: 101
  },
  
  // Chronic Conditions
  {
    name: "Diabetes Care",
    description: "Diabetes management, blood sugar monitoring, diabetic complications",
    color: "#0D9488", // teal
    icon: "droplet",
    sortOrder: 60
  },
  {
    name: "Hypertension",
    description: "High blood pressure management and monitoring",
    color: "#DC2626", // red
    icon: "gauge-high",
    sortOrder: 61
  },
  
  // Lifestyle & Preventive
  {
    name: "Health Checkup",
    description: "Routine health screening, preventive care, wellness visits",
    color: "#059669", // emerald
    icon: "clipboard-check",
    sortOrder: 70
  },
  {
    name: "Lifestyle Counseling",
    description: "Diet advice, exercise guidance, lifestyle modifications",
    color: "#7C2D12", // amber
    icon: "apple-whole",
    sortOrder: 71
  },
  {
    name: "Weight Management",
    description: "Obesity treatment, weight loss programs, nutrition counseling",
    color: "#C2410C", // orange
    icon: "weight-scale",
    sortOrder: 72
  },
  
  // Other
  {
    name: "Follow-up Visit",
    description: "Post-treatment follow-ups, progress monitoring, medication review",
    color: "#6366F1", // indigo
    icon: "calendar-check",
    sortOrder: 80
  },
  {
    name: "Lab Results Discussion",
    description: "Review test results, discuss treatment plans based on reports",
    color: "#0891B2", // cyan
    icon: "flask",
    sortOrder: 81
  },
  {
    name: "Other Concerns",
    description: "Other medical concerns not listed above",
    color: "#6B7280", // gray
    icon: "circle-question",
    sortOrder: 999
  }
];

export async function seedProblemCategories() {
  console.log("🏥 Seeding problem categories...");
  
  try {
    // Use upsert to avoid duplicates
    for (const category of PROBLEM_CATEGORIES_SEED) {
      await prisma.problemCategory.upsert({
        where: { name: category.name },
        update: {
          description: category.description,
          color: category.color,
          icon: category.icon,
          sortOrder: category.sortOrder,
          isActive: true
        },
        create: category
      });
    }
    
    console.log(`✅ Successfully seeded ${PROBLEM_CATEGORIES_SEED.length} problem categories`);
  } catch (error) {
    console.error("❌ Error seeding problem categories:", error);
    throw error;
  }
}

if (require.main === module) {
  seedProblemCategories()
    .then(() => {
      console.log("✅ Problem categories seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Problem categories seeding failed:", error);
      process.exit(1);
    });
}
