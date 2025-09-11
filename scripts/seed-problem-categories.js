const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultCategories = [
  {
    name: "General Medicine",
    description: "Common health concerns and general medical issues",
    color: "#3B82F6", // blue
    icon: "stethoscope",
    sortOrder: 1
  },
  {
    name: "Cardiology",
    description: "Heart and cardiovascular related concerns",
    color: "#EF4444", // red
    icon: "heart",
    sortOrder: 2
  },
  {
    name: "ENT (Ear, Nose, Throat)",
    description: "Issues related to ear, nose, and throat",
    color: "#F59E0B", // yellow
    icon: "ear",
    sortOrder: 3
  },
  {
    name: "Orthopedics",
    description: "Bone, joint, and muscle related issues",
    color: "#8B5CF6", // purple
    icon: "bone",
    sortOrder: 4
  },
  {
    name: "Dermatology",
    description: "Skin, hair, and nail related concerns",
    color: "#10B981", // green
    icon: "skin",
    sortOrder: 5
  },
  {
    name: "Gynecology",
    description: "Women's health and reproductive concerns",
    color: "#EC4899", // pink
    icon: "female",
    sortOrder: 6
  },
  {
    name: "Pediatrics",
    description: "Children's health and medical issues",
    color: "#06B6D4", // cyan
    icon: "baby",
    sortOrder: 7
  },
  {
    name: "Ophthalmology",
    description: "Eye and vision related problems",
    color: "#84CC16", // lime
    icon: "eye",
    sortOrder: 8
  },
  {
    name: "Gastroenterology",
    description: "Digestive system and stomach related issues",
    color: "#F97316", // orange
    icon: "stomach",
    sortOrder: 9
  },
  {
    name: "Neurology",
    description: "Nervous system and brain related concerns",
    color: "#6366F1", // indigo
    icon: "brain",
    sortOrder: 10
  },
  {
    name: "Emergency",
    description: "Urgent medical situations requiring immediate attention",
    color: "#DC2626", // red-600
    icon: "emergency",
    sortOrder: 11
  },
  {
    name: "Fever & Infections",
    description: "Fever, cold, flu, and other infectious conditions",
    color: "#F59E0B", // amber
    icon: "thermometer",
    sortOrder: 12
  }
];

async function main() {
  console.log('Seeding problem categories...');
  
  for (const category of defaultCategories) {
    // Check if category already exists
    const existing = await prisma.problemCategory.findUnique({
      where: { name: category.name }
    });
    
    if (!existing) {
      const created = await prisma.problemCategory.create({
        data: category
      });
      console.log(`Created category: ${created.name}`);
    } else {
      console.log(`Category already exists: ${category.name}`);
    }
  }
  
  console.log('Problem categories seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
