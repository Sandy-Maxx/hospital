import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pharmacy/medicines - Get all medicines with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const manufacturer = searchParams.get("manufacturer") || "";
    const requiresPrescription = searchParams.get("requiresPrescription");
    const isActive = searchParams.get("isActive");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { genericName: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { manufacturer: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (manufacturer) {
      where.manufacturer = { contains: manufacturer, mode: "insensitive" };
    }

    if (requiresPrescription !== null && requiresPrescription !== undefined) {
      where.prescriptionRequired = requiresPrescription === "true";
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // Get medicines with related data
    const [medicines, totalCount] = await Promise.all([
      prisma.medicine.findMany({
        where,
        include: {
          category: true,
          gstSlab: true,
          stocks: {
            select: {
              availableQuantity: true,
              expiryDate: true,
              batchNumber: true,
            },
            where: {
              isActive: true,
              availableQuantity: { gt: 0 },
            },
            orderBy: { expiryDate: "asc" },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder as "asc" | "desc",
        },
      }),
      prisma.medicine.count({ where }),
    ]);

    // Calculate total stock for each medicine
    const medicinesWithStock = medicines.map(medicine => {
      const totalStock = medicine.stocks.reduce(
        (sum, stock) => sum + stock.availableQuantity, 
        0
      );
      
      const nearestExpiry = medicine.stocks.length > 0 
        ? medicine.stocks[0].expiryDate 
        : null;

      return {
        ...medicine,
        totalStock,
        nearestExpiry,
        stockStatus: totalStock === 0 ? 'OUT_OF_STOCK' : 
                     totalStock < 10 ? 'LOW_STOCK' : 'IN_STOCK',
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      medicines: medicinesWithStock,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacy/medicines - Create new medicine
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'name', 'genericName', 'brand', 'manufacturer', 
      'strength', 'dosageForm', 'unitType', 'categoryId', 
      'gstSlabId', 'mrp', 'purchasePrice'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Calculate margin percentage based on MRP vs purchase price
    const marginPercentage = data.purchasePrice > 0 
      ? ((data.mrp - data.purchasePrice) / data.purchasePrice) * 100 
      : 0;

    const medicine = await prisma.medicine.create({
      data: {
        ...data,
        marginPercentage: parseFloat(marginPercentage.toFixed(2)),
        mrp: parseFloat(data.mrp),
        purchasePrice: parseFloat(data.purchasePrice),
        isActive: data.isActive ?? true,
        prescriptionRequired: data.prescriptionRequired ?? true,
      },
      include: {
        category: true,
        gstSlab: true,
      },
    });

    return NextResponse.json({ medicine }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating medicine:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Medicine with this barcode already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create medicine" },
      { status: 500 }
    );
  }
}

// PUT /api/pharmacy/medicines - Update medicine
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    // Recalculate margin percentage if prices are updated
    if (updateData.purchasePrice || updateData.mrp) {
      const currentMedicine = await prisma.medicine.findUnique({
        where: { id },
        select: { purchasePrice: true, mrp: true },
      });

      if (!currentMedicine) {
        return NextResponse.json(
          { error: "Medicine not found" },
          { status: 404 }
        );
      }

      const purchasePrice = updateData.purchasePrice ?? currentMedicine.purchasePrice;
      const mrp = updateData.mrp ?? currentMedicine.mrp;
      
      updateData.marginPercentage = purchasePrice > 0 
        ? parseFloat(((mrp - purchasePrice) / purchasePrice * 100).toFixed(2))
        : 0;
    }

    // Convert string numbers to proper types
    if (updateData.mrp) updateData.mrp = parseFloat(updateData.mrp);
    if (updateData.purchasePrice) updateData.purchasePrice = parseFloat(updateData.purchasePrice);

    const medicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        gstSlab: true,
      },
    });

    return NextResponse.json({ medicine });
  } catch (error: any) {
    console.error("Error updating medicine:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Medicine with this barcode already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update medicine" },
      { status: 500 }
    );
  }
}

// DELETE /api/pharmacy/medicines - Delete medicine (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    // Check if medicine has active stock
    const activeStock = await prisma.medicineStock.findFirst({
      where: {
        medicineId: id,
        isActive: true,
        availableQuantity: { gt: 0 },
      },
    });

    if (activeStock) {
      return NextResponse.json(
        { error: "Cannot delete medicine with active stock. Please clear stock first." },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const medicine = await prisma.medicine.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      message: "Medicine deleted successfully",
      medicine: { id: medicine.id, isActive: medicine.isActive }
    });
  } catch (error: any) {
    console.error("Error deleting medicine:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}
