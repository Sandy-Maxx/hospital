import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Test API to debug pharmacy setup
export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing pharmacy setup...");
    
    // Test database connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection:", dbTest);

    // Check if tables exist
    const tablesCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('gst_slabs', 'medicine_categories', 'suppliers', 'medicines', 'medicine_stock')
    `;
    console.log("📋 Tables check:", tablesCheck);

    // Check GST Slabs
    const gstCount = await prisma.gstSlab.count();
    console.log(`📊 GST Slabs count: ${gstCount}`);

    // Check Medicine Categories
    const catCount = await prisma.medicineCategory.count();
    console.log(`📂 Categories count: ${catCount}`);

    // Check Suppliers
    const supCount = await prisma.supplier.count();
    console.log(`🏪 Suppliers count: ${supCount}`);

    // Check Medicines
    const medCount = await prisma.medicine.count();
    console.log(`💊 Medicines count: ${medCount}`);

    // Check Stock
    const stockCount = await prisma.medicineStock.count();
    console.log(`📦 Stock count: ${stockCount}`);

    // Sample data fetch
    const sampleMedicines = await prisma.medicine.findMany({
      take: 3,
      include: {
        category: true,
        gstSlab: true
      }
    });
    console.log("🔬 Sample medicines:", sampleMedicines);

    return NextResponse.json({
      status: "success",
      database: {
        connected: true,
        tables: tablesCheck
      },
      counts: {
        gstSlabs: gstCount,
        categories: catCount,
        suppliers: supCount,
        medicines: medCount,
        stock: stockCount
      },
      sampleData: sampleMedicines,
      message: "Pharmacy module test completed successfully"
    });

  } catch (error: any) {
    console.error("❌ Pharmacy test failed:", error);
    return NextResponse.json({
      status: "error",
      error: error.message,
      details: error.code || "Unknown error",
      message: "Pharmacy module test failed"
    }, { status: 500 });
  }
}
