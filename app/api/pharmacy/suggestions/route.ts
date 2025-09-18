import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pharmacy/suggestions - Get medicine suggestions for prescriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");
    const includeStock = searchParams.get("includeStock") === "true";
    const prescriptionOnly = searchParams.get("prescriptionOnly");

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Build where clause for search
    const where: any = {
      isActive: true,
      OR: [
        { genericName: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };

    if (prescriptionOnly !== null && prescriptionOnly !== undefined) {
      where.requiresPrescription = prescriptionOnly === "true";
    }

    // Get medicines with stock information if requested
    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        category: {
          select: { name: true, gstRate: true },
        },
        gstSlab: {
          select: { rate: true, description: true },
        },
        ...(includeStock && {
          stocks: {
            select: {
              id: true,
              availableQuantity: true,
              batchNumber: true,
              expiryDate: true,
              purchasePrice: true,
              mrp: true,
              supplier: {
                select: { name: true },
              },
            },
            where: {
              isActive: true,
              availableQuantity: { gt: 0 },
              expiryDate: { gt: new Date() },
            },
            orderBy: { expiryDate: "asc" },
          },
        }),
      },
      take: limit,
      orderBy: [
        { brand: "asc" },
        { genericName: "asc" },
      ],
    });

    // Format suggestions with stock information
    const suggestions = medicines.map(medicine => {
      let totalStock = 0;
      let availableBatches = 0;
      let nearestExpiry = null;
      let stockDetails: any[] = [];

      if (includeStock && medicine.stocks) {
        totalStock = medicine.stocks.reduce(
          (sum, stock) => sum + stock.availableQuantity,
          0
        );
        availableBatches = medicine.stocks.length;
        nearestExpiry = medicine.stocks.length > 0 ? medicine.stocks[0].expiryDate : null;
        
        stockDetails = medicine.stocks.map((stock: any) => ({
          id: stock.id,
          batchNumber: stock.batchNumber,
          availableQuantity: stock.availableQuantity,
          expiryDate: stock.expiryDate,
          sellingPrice: stock.purchasePrice,
          mrp: stock.mrp,
          supplierName: stock.supplier.name,
        }));
      }

      return {
        id: medicine.id,
        genericName: (medicine as any).genericName,
        brandName: (medicine as any).brand,
        manufacturer: (medicine as any).manufacturer,
        composition: (medicine as any).description,
        strength: (medicine as any).strength,
        dosageForm: (medicine as any).dosageForm,
        packSize: (medicine as any).unitType,
        unit: (medicine as any).unitType,
        mrp: (medicine as any).mrp,
        sellingPrice: (medicine as any).purchasePrice ?? (medicine as any).mrp,
        requiresPrescription: (medicine as any).prescriptionRequired,
        category: {
          name: medicine.category.name,
          gstRate: medicine.category.gstRate,
        },
        gstSlab: {
          rate: medicine.gstSlab.rate,
          description: medicine.gstSlab.description,
        },
        // Stock information (only included if includeStock=true)
        ...(includeStock && {
          stockInfo: {
            totalStock,
            availableBatches,
            nearestExpiry,
            stockDetails,
            stockStatus: totalStock === 0 ? 'OUT_OF_STOCK' : 
                         totalStock < 10 ? 'LOW_STOCK' : 'IN_STOCK',
          },
        }),
        // Display format for dropdowns
        displayText: `${(medicine as any).brand} (${(medicine as any).genericName}) - ${(medicine as any).strength}`,
        searchText: `${(medicine as any).brand} ${(medicine as any).genericName} ${(medicine as any).description || ''} ${(medicine as any).manufacturer}`,
      };
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error fetching medicine suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacy/suggestions/pricing - Get pricing information for billing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { medicineIds, quantities } = data;

    if (!medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
      return NextResponse.json(
        { error: "Medicine IDs are required" },
        { status: 400 }
      );
    }

    // Get medicines with stock and pricing information
    const medicines = await prisma.medicine.findMany({
      where: {
        id: { in: medicineIds },
        isActive: true,
      },
      include: {
        category: {
          select: { name: true, gstRate: true },
        },
        gstSlab: {
          select: { rate: true, description: true },
        },
          stocks: {
          select: {
            id: true,
            availableQuantity: true,
            batchNumber: true,
            expiryDate: true,
            purchasePrice: true,
            mrp: true,
          },
          where: {
            isActive: true,
            availableQuantity: { gt: 0 },
            expiryDate: { gt: new Date() },
          },
          orderBy: { expiryDate: "asc" },
        },
      },
    });

    // Calculate pricing for each medicine
    const pricingInfo = medicines.map(medicine => {
      const requestedQuantity = quantities && quantities[medicine.id] ? 
        parseInt(quantities[medicine.id]) : 1;

      // Calculate total available stock
      const totalStock = medicine.stocks.reduce(
        (sum, stock) => sum + stock.availableQuantity,
        0
      );

      // Determine best pricing strategy (FIFO - First In First Out by expiry)
      let remainingQuantity = requestedQuantity;
      let totalCost = 0;
      let totalMrp = 0;
      let batchAllocations = [];

      for (const stock of medicine.stocks) {
        if (remainingQuantity <= 0) break;

        const allocatedQuantity = Math.min(remainingQuantity, stock.availableQuantity);
        const batchCost = allocatedQuantity * (stock as any).purchasePrice;
        const batchMrp = allocatedQuantity * stock.mrp;

        totalCost += batchCost;
        totalMrp += batchMrp;
        remainingQuantity -= allocatedQuantity;

        batchAllocations.push({
          stockId: stock.id,
          batchNumber: stock.batchNumber,
          quantity: allocatedQuantity,
          unitPrice: (stock as any).purchasePrice,
          unitMrp: stock.mrp,
          batchTotal: batchCost,
          expiryDate: stock.expiryDate,
        });
      }

      // Calculate GST
      const gstRate = medicine.gstSlab.rate;
      const gstAmount = (totalCost * gstRate) / 100;
      const finalAmount = totalCost + gstAmount;

      // Calculate savings
      const savings = totalMrp - finalAmount;
      const savingsPercentage = totalMrp > 0 ? ((savings / totalMrp) * 100) : 0;

      return {
        medicineId: medicine.id,
        medicineName: (medicine as any).brand ?? (medicine as any).name,
        genericName: (medicine as any).genericName,
        dosageForm: (medicine as any).dosageForm,
        strength: (medicine as any).strength,
        requestedQuantity,
        availableQuantity: totalStock,
        canFulfill: remainingQuantity === 0,
        shortfall: Math.max(0, remainingQuantity),
        
        // Pricing breakdown
        pricing: {
          subtotal: parseFloat(totalCost.toFixed(2)),
          gstRate,
          gstAmount: parseFloat(gstAmount.toFixed(2)),
          totalAmount: parseFloat(finalAmount.toFixed(2)),
          mrpTotal: parseFloat(totalMrp.toFixed(2)),
          savings: parseFloat(savings.toFixed(2)),
          savingsPercentage: parseFloat(savingsPercentage.toFixed(2)),
        },

        // Batch allocation details
        batchAllocations,

        // Medicine details for billing
        medicineDetails: {
          hsn: (medicine as any).hsn || '',
          category: medicine.category.name,
          manufacturer: (medicine as any).manufacturer,
          requiresPrescription: (medicine as any).prescriptionRequired,
        },
      };
    });

    // Calculate overall totals
    const overallTotals = pricingInfo.reduce(
      (totals, item) => ({
        subtotal: totals.subtotal + item.pricing.subtotal,
        gstAmount: totals.gstAmount + item.pricing.gstAmount,
        totalAmount: totals.totalAmount + item.pricing.totalAmount,
        mrpTotal: totals.mrpTotal + item.pricing.mrpTotal,
        totalSavings: totals.totalSavings + item.pricing.savings,
      }),
      { subtotal: 0, gstAmount: 0, totalAmount: 0, mrpTotal: 0, totalSavings: 0 }
    );

    const overallSavingsPercentage = overallTotals.mrpTotal > 0 ? 
      ((overallTotals.totalSavings / overallTotals.mrpTotal) * 100) : 0;

    return NextResponse.json({
      medicines: pricingInfo,
      totals: {
        ...overallTotals,
        overallSavingsPercentage: parseFloat(overallSavingsPercentage.toFixed(2)),
      },
      canFulfillAll: pricingInfo.every(item => item.canFulfill),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error calculating pricing:", error);
    return NextResponse.json(
      { error: "Failed to calculate pricing" },
      { status: 500 }
    );
  }
}
