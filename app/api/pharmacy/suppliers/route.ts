import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pharmacy/suppliers - Get all suppliers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [suppliers, totalCount] = await Promise.all([
      prisma.supplier.findMany({
        where,
        select: {
          id: true,
          name: true,
          contactPerson: true,
          phone: true,
          email: true,
          address: true,
          gstNumber: true,
          creditTerms: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              stocks: {
                where: { isActive: true }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.supplier.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      suppliers,
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
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacy/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        gstNumber: data.gstNumber || null,
        creditTerms: data.creditTerms ? parseInt(data.creditTerms) : 30,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supplier:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Supplier with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}

// PUT /api/pharmacy/suppliers - Update supplier
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
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // Convert creditTerms to number if provided
    if (updateData.creditTerms) {
      updateData.creditTerms = parseInt(updateData.creditTerms);
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ supplier });
  } catch (error: any) {
    console.error("Error updating supplier:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Supplier with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

// DELETE /api/pharmacy/suppliers - Delete supplier (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // Check if supplier has active stock
    const activeStock = await prisma.medicineStock.findFirst({
      where: {
        supplierId: id,
        isActive: true,
        availableQuantity: { gt: 0 },
      },
    });

    if (activeStock) {
      return NextResponse.json(
        { error: "Cannot delete supplier with active stock. Please clear stock first." },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      message: "Supplier deleted successfully",
      supplier: { id: supplier.id, isActive: supplier.isActive }
    });
  } catch (error: any) {
    console.error("Error deleting supplier:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}