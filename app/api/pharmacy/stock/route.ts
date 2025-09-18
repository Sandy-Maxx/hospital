import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pharmacy/stock - Get stock with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const medicineId = searchParams.get("medicineId");
    const supplierId = searchParams.get("supplierId");
    const lowStock = searchParams.get("lowStock") === "true";
    const nearExpiry = searchParams.get("nearExpiry") === "true";
    const expired = searchParams.get("expired") === "true";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (medicineId) {
      where.medicineId = medicineId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (lowStock) {
      where.availableQuantity = { lte: 10 };
    }

    if (nearExpiry) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiryDate = { lte: thirtyDaysFromNow };
    }

    if (expired) {
      where.expiryDate = { lte: new Date() };
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: "insensitive" } },
        { medicine: { 
          OR: [
            { genericName: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
          ]
        }},
      ];
    }

    const [stocks, totalCount] = await Promise.all([
      prisma.medicineStock.findMany({
        where,
        select: {
          id: true,
          medicineId: true,
          supplierId: true,
          batchNumber: true,
          expiryDate: true,
          quantity: true,
          availableQuantity: true,
          purchasePrice: true,
          mrp: true,
          manufacturingDate: true,
          location: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          medicine: {
            select: {
              id: true,
              genericName: true,
              brand: true,
              manufacturer: true,
              dosageForm: true,
              strength: true,
              category: { select: { name: true } },
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { expiryDate: "asc" },
          { medicine: { brand: "asc" } },
        ],
      }),
      prisma.medicineStock.count({ where }),
    ]);

    // Add stock status for each item
    const stocksWithStatus = stocks.map(stock => {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      let status = 'NORMAL';
      let alerts = [];

      if (stock.expiryDate <= now) {
        status = 'EXPIRED';
        alerts.push('EXPIRED');
      } else if (stock.expiryDate <= thirtyDaysFromNow) {
        status = 'NEAR_EXPIRY';
        alerts.push('EXPIRING_SOON');
      }

      if (stock.availableQuantity === 0) {
        status = 'OUT_OF_STOCK';
        alerts.push('OUT_OF_STOCK');
      } else if (stock.availableQuantity <= 10) {
        if (status === 'NORMAL') status = 'LOW_STOCK';
        alerts.push('LOW_STOCK');
      }

      return {
        ...stock,
        status,
        alerts,
        daysUntilExpiry: Math.ceil((stock.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      stocks: stocksWithStatus,
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
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacy/stock - Add new stock (purchase entry)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "PHARMACIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'medicineId', 'batchNumber', 'supplierId', 'quantity', 
      'purchasePrice', 'mrp', 'expiryDate'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate dates
    const manufacturingDate = data.manufacturingDate ? new Date(data.manufacturingDate) : null;
    const expiryDate = new Date(data.expiryDate);
    const now = new Date();

    if (expiryDate <= now) {
      return NextResponse.json(
        { error: "Cannot add expired stock" },
        { status: 400 }
      );
    }

    if (manufacturingDate && manufacturingDate >= expiryDate) {
      return NextResponse.json(
        { error: "Manufacturing date must be before expiry date" },
        { status: 400 }
      );
    }

    // Check if batch already exists for this medicine
    const existingBatch = await prisma.medicineStock.findFirst({
      where: {
        medicineId: data.medicineId,
        batchNumber: data.batchNumber,
        isActive: true,
      },
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: "Batch number already exists for this medicine" },
        { status: 400 }
      );
    }

    // Create stock entry
    const stock = await prisma.$transaction(async (prisma) => {
      // Create stock
      const newStock = await prisma.medicineStock.create({
        data: {
          medicineId: data.medicineId,
          batchNumber: data.batchNumber,
          supplierId: data.supplierId,
          quantity: parseInt(data.quantity),
          availableQuantity: parseInt(data.quantity),
          purchasePrice: parseFloat(data.purchasePrice),
          mrp: parseFloat(data.mrp),
          manufacturingDate,
          expiryDate,
          location: data.location || null,
        },
        include: {
          medicine: {
            select: {
              id: true,
              genericName: true,
              brand: true,
              manufacturer: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Note: Stock transactions would be handled by a separate StockTransaction model if needed

      return newStock;
    });

    return NextResponse.json({ stock }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding stock:", error);
    return NextResponse.json(
      { error: "Failed to add stock" },
      { status: 500 }
    );
  }
}

// PUT /api/pharmacy/stock - Update stock (adjustments)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "PHARMACIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, adjustmentType, quantity, reason, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Stock ID is required" },
        { status: 400 }
      );
    }

    const currentStock = await prisma.medicineStock.findUnique({
      where: { id },
      include: {
        medicine: { select: { genericName: true, brand: true } },
      },
    });

    if (!currentStock) {
      return NextResponse.json(
        { error: "Stock not found" },
        { status: 404 }
      );
    }

    // Handle stock adjustments
    if (adjustmentType && quantity !== undefined) {
      const adjustmentQty = parseInt(quantity);
      let newAvailableQuantity = currentStock.availableQuantity;

      if (adjustmentType === 'INCREASE') {
        newAvailableQuantity += adjustmentQty;
      } else if (adjustmentType === 'DECREASE') {
        newAvailableQuantity = Math.max(0, newAvailableQuantity - adjustmentQty);
      } else if (adjustmentType === 'SET') {
        newAvailableQuantity = Math.max(0, adjustmentQty);
      }

      const updatedStock = await prisma.$transaction(async (prisma) => {
        // Update stock
        const stock = await prisma.medicineStock.update({
          where: { id },
          data: {
            availableQuantity: newAvailableQuantity,
            ...updateData,
          },
          include: {
            medicine: {
              select: {
                id: true,
                genericName: true,
                brand: true,
                manufacturer: true,
              },
            },
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Note: Stock adjustment transactions would be logged separately if needed

        return stock;
      });

      return NextResponse.json({ stock: updatedStock });
    }

    // Regular update without quantity adjustment
    const stock = await prisma.medicineStock.update({
      where: { id },
      data: updateData,
      include: {
        medicine: {
          select: {
            id: true,
            genericName: true,
            brand: true,
            manufacturer: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ stock });
  } catch (error: any) {
    console.error("Error updating stock:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Stock not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
