import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/hospital/ot-procedures - Get all OT procedures
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};
    if (serviceId) where.serviceId = serviceId;
    if (!includeInactive) where.isActive = true;

    const procedures = await prisma.oTProcedure.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            department: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ procedures });
  } catch (error) {
    console.error("Error fetching OT procedures:", error);
    return NextResponse.json(
      { error: "Failed to fetch OT procedures" },
      { status: 500 }
    );
  }
}

// POST /api/hospital/ot-procedures - Create new OT procedure
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    if (!data.name) {
      return NextResponse.json(
        { error: "Procedure name is required" },
        { status: 400 }
      );
    }

    if (!data.price || data.price <= 0) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = await prisma.oTService.findUnique({
      where: { id: data.serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 400 }
      );
    }

    const procedure = await prisma.oTProcedure.create({
      data: {
        serviceId: data.serviceId,
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        price: parseFloat(data.price),
        duration: data.duration ? parseInt(data.duration) : 60,
        complexity: data.complexity || "MEDIUM",
        anesthesia: data.anesthesia || null,
        billingDefaults: data.billingDefaults ? data.billingDefaults : null,
        isActive: data.isActive ?? true,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            department: true
          }
        }
      }
    });

    return NextResponse.json({ procedure }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating OT procedure:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Procedure with this name already exists for this service" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create OT procedure" },
      { status: 500 }
    );
  }
}

// PUT /api/hospital/ot-procedures - Update OT procedure
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
        { error: "Procedure ID is required" },
        { status: 400 }
      );
    }

    // Convert numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.duration) updateData.duration = parseInt(updateData.duration);
    // billingDefaults can be a JSON object; leave as-is if provided
    const procedure = await prisma.oTProcedure.update({
      where: { id },
      data: updateData,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            department: true
          }
        }
      }
    });

    return NextResponse.json({ procedure });
  } catch (error: any) {
    console.error("Error updating OT procedure:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Procedure not found" },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Procedure with this name already exists for this service" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update OT procedure" },
      { status: 500 }
    );
  }
}

// DELETE /api/hospital/ot-procedures - Delete OT procedure (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Procedure ID is required" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const procedure = await prisma.oTProcedure.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      message: "OT procedure deleted successfully",
      procedure: { id: procedure.id, isActive: procedure.isActive }
    });
  } catch (error: any) {
    console.error("Error deleting OT procedure:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Procedure not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete OT procedure" },
      { status: 500 }
    );
  }
}