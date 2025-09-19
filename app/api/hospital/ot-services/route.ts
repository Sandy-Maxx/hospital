import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/hospital/ot-services - Get all OT services
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const services = await prisma.oTService.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        procedures: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { name: "asc" }
        },
        _count: {
          select: {
            procedures: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching OT services:", error);
    return NextResponse.json(
      { error: "Failed to fetch OT services" },
      { status: 500 }
    );
  }
}

// POST /api/hospital/ot-services - Create new OT service
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
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    if (!data.basePrice || data.basePrice <= 0) {
      return NextResponse.json(
        { error: "Valid base price is required" },
        { status: 400 }
      );
    }

    const service = await prisma.oTService.create({
      data: {
        name: data.name,
        description: data.description || null,
        basePrice: parseFloat(data.basePrice),
        duration: data.duration ? parseInt(data.duration) : 60,
        category: data.category || null,
        department: data.department || null,
        isActive: data.isActive ?? true,
      },
      include: {
        procedures: true
      }
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating OT service:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Service with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create OT service" },
      { status: 500 }
    );
  }
}

// PUT /api/hospital/ot-services - Update OT service
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
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Convert numeric fields
    if (updateData.basePrice) updateData.basePrice = parseFloat(updateData.basePrice);
    if (updateData.duration) updateData.duration = parseInt(updateData.duration);

    const service = await prisma.oTService.update({
      where: { id },
      data: updateData,
      include: {
        procedures: true
      }
    });

    return NextResponse.json({ service });
  } catch (error: any) {
    console.error("Error updating OT service:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Service with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update OT service" },
      { status: 500 }
    );
  }
}

// DELETE /api/hospital/ot-services - Delete OT service (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Check if service has active procedures
    const activeProcedures = await prisma.oTProcedure.count({
      where: {
        serviceId: id,
        isActive: true
      }
    });

    if (activeProcedures > 0) {
      return NextResponse.json(
        { error: "Cannot delete service with active procedures. Please deactivate procedures first." },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const service = await prisma.oTService.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      message: "OT service deleted successfully",
      service: { id: service.id, isActive: service.isActive }
    });
  } catch (error: any) {
    console.error("Error deleting OT service:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete OT service" },
      { status: 500 }
    );
  }
}