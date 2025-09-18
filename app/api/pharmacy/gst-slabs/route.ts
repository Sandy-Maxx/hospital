import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pharmacy/gst-slabs - Get all GST slabs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const slabs = await prisma.gstSlab.findMany({
      where,
      orderBy: { rate: "asc" },
      include: {
        _count: {
          select: {
            medicines: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      slabs,
      totalCount: slabs.length
    });
  } catch (error) {
    console.error("Error fetching GST slabs:", error);
    return NextResponse.json(
      { error: "Failed to fetch GST slabs" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacy/gst-slabs - Create new GST slab
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || data.rate === undefined) {
      return NextResponse.json(
        { error: "Name and rate are required" },
        { status: 400 }
      );
    }

    const slab = await prisma.gstSlab.create({
      data: {
        name: data.name.trim(),
        rate: parseFloat(data.rate),
        description: data.description?.trim() || null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ slab }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating GST slab:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "GST slab with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create GST slab" },
      { status: 500 }
    );
  }
}

// PUT /api/pharmacy/gst-slabs - Update GST slab
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
        { error: "GST slab ID is required" },
        { status: 400 }
      );
    }

    const slab = await prisma.gstSlab.update({
      where: { id },
      data: {
        ...updateData,
        name: updateData.name?.trim(),
        rate: updateData.rate ? parseFloat(updateData.rate) : undefined,
        description: updateData.description?.trim() || null,
      },
    });

    return NextResponse.json({ slab });
  } catch (error: any) {
    console.error("Error updating GST slab:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "GST slab not found" },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "GST slab with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update GST slab" },
      { status: 500 }
    );
  }
}

// DELETE /api/pharmacy/gst-slabs - Delete GST slab (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "GST slab ID is required" },
        { status: 400 }
      );
    }

    // Check if GST slab has associated medicines
    const medicineCount = await prisma.medicine.count({
      where: {
        gstSlabId: id,
        isActive: true,
      },
    });

    if (medicineCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete GST slab with associated medicines. Please reassign medicines first." },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const slab = await prisma.gstSlab.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      message: "GST slab deleted successfully",
      slab: { id: slab.id, isActive: slab.isActive }
    });
  } catch (error: any) {
    console.error("Error deleting GST slab:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "GST slab not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete GST slab" },
      { status: 500 }
    );
  }
}
