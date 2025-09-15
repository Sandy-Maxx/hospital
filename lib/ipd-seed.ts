import { prisma } from "./prisma";

export const IPD_SEED_DATA = {
  wards: [
    {
      name: "General Ward",
      description: "General medical care for stable patients",
      floor: "Ground Floor",
      department: "General Medicine",
      capacity: 20,
      bedTypes: [
        {
          name: "General",
          description: "Basic bed with essential amenities",
          dailyRate: 800,
          amenities: JSON.stringify(["Bed", "Mattress", "Pillow", "Blanket", "Side Table"]),
          maxOccupancy: 1
        }
      ]
    },
    {
      name: "Semi-Private Ward",
      description: "Semi-private rooms with enhanced comfort",
      floor: "First Floor",
      department: "General Medicine",
      capacity: 12,
      bedTypes: [
        {
          name: "Semi-Private",
          description: "Shared room with 2 beds, better amenities",
          dailyRate: 1500,
          amenities: JSON.stringify([
            "Bed", "Mattress", "Pillow", "Blanket", "Side Table", 
            "Reading Light", "TV", "Attached Bathroom", "AC"
          ]),
          maxOccupancy: 1
        }
      ]
    },
    {
      name: "Private Ward",
      description: "Private single rooms with premium amenities",
      floor: "Second Floor", 
      department: "General Medicine",
      capacity: 8,
      bedTypes: [
        {
          name: "Private",
          description: "Private room with luxury amenities",
          dailyRate: 2500,
          amenities: JSON.stringify([
            "King Size Bed", "Premium Mattress", "Pillow", "Blanket", "Side Table",
            "Reading Light", "LED TV", "Private Bathroom", "AC", "Mini Fridge",
            "Sofa", "Wardrobe", "WiFi"
          ]),
          maxOccupancy: 1
        }
      ]
    },
    {
      name: "ICU",
      description: "Intensive Care Unit for critical patients",
      floor: "Ground Floor",
      department: "Critical Care",
      capacity: 6,
      bedTypes: [
        {
          name: "ICU",
          description: "Critical care bed with life support systems",
          dailyRate: 5000,
          amenities: JSON.stringify([
            "ICU Bed", "Ventilator", "Cardiac Monitor", "IV Stands",
            "Oxygen Supply", "Defibrillator", "Central AC"
          ]),
          maxOccupancy: 1
        }
      ]
    },
    {
      name: "Pediatric Ward",
      description: "Specialized care for children",
      floor: "First Floor",
      department: "Pediatrics",
      capacity: 10,
      bedTypes: [
        {
          name: "Pediatric",
          description: "Child-friendly beds with family accommodation",
          dailyRate: 1200,
          amenities: JSON.stringify([
            "Child Bed", "Mattress", "Colorful Bedding", "Side Table",
            "Play Area", "TV with Cartoons", "Attendant Bed", "AC"
          ]),
          maxOccupancy: 1
        }
      ]
    },
    {
      name: "Maternity Ward",
      description: "Specialized care for mothers and newborns",
      floor: "Second Floor",
      department: "Obstetrics & Gynecology",
      capacity: 8,
      bedTypes: [
        {
          name: "Maternity",
          description: "Comfortable beds for pre and post-delivery care",
          dailyRate: 2000,
          amenities: JSON.stringify([
            "Adjustable Bed", "Baby Cot", "Mattress", "Pillows", "Blanket",
            "Side Table", "Private Bathroom", "AC", "Baby Care Equipment"
          ]),
          maxOccupancy: 2 // Mother and baby
        }
      ]
    }
  ]
};

export async function seedIPDData() {
  console.log("🏥 Seeding IPD (Ward & Bed) data...");
  
  try {
    for (const wardData of IPD_SEED_DATA.wards) {
      // Create or update ward
      const ward = await prisma.ward.upsert({
        where: { name: wardData.name },
        update: {
          description: wardData.description,
          floor: wardData.floor,
          department: wardData.department,
          capacity: wardData.capacity,
          isActive: true
        },
        create: {
          name: wardData.name,
          description: wardData.description,
          floor: wardData.floor,
          department: wardData.department,
          capacity: wardData.capacity,
          isActive: true
        }
      });

      console.log(`✅ Ward: ${ward.name}`);

      // Create bed types
      for (const bedTypeData of wardData.bedTypes) {
        const bedType = await prisma.bedType.upsert({
          where: {
            wardId_name: {
              wardId: ward.id,
              name: bedTypeData.name
            }
          },
          update: {
            description: bedTypeData.description,
            dailyRate: bedTypeData.dailyRate,
            amenities: bedTypeData.amenities,
            maxOccupancy: bedTypeData.maxOccupancy,
            isActive: true
          },
          create: {
            wardId: ward.id,
            name: bedTypeData.name,
            description: bedTypeData.description,
            dailyRate: bedTypeData.dailyRate,
            amenities: bedTypeData.amenities,
            maxOccupancy: bedTypeData.maxOccupancy,
            isActive: true
          }
        });

        console.log(`  ✅ Bed Type: ${bedType.name}`);

        // Generate beds for this type
        const bedsToCreate = Math.floor(wardData.capacity / wardData.bedTypes.length);
        
        for (let i = 1; i <= bedsToCreate; i++) {
          const bedNumber = `${ward.name.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`;
          
          await prisma.bed.upsert({
            where: { bedNumber },
            update: {
              wardId: ward.id,
              bedTypeId: bedType.id,
              status: "AVAILABLE",
              isActive: true
            },
            create: {
              wardId: ward.id,
              bedTypeId: bedType.id,
              bedNumber,
              status: "AVAILABLE",
              isActive: true
            }
          });
        }

        console.log(`  ✅ Created ${bedsToCreate} beds for ${bedType.name}`);
      }
    }

    console.log("✅ IPD data seeded successfully!");
    
    // Show summary
    const totalWards = await prisma.ward.count();
    const totalBedTypes = await prisma.bedType.count();
    const totalBeds = await prisma.bed.count();
    
    console.log(`📊 Summary: ${totalWards} wards, ${totalBedTypes} bed types, ${totalBeds} beds`);
    
  } catch (error) {
    console.error("❌ Error seeding IPD data:", error);
    throw error;
  }
}

if (require.main === module) {
  seedIPDData()
    .then(() => {
      console.log("✅ IPD seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ IPD seeding failed:", error);
      process.exit(1);
    });
}
