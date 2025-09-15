import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");
    const status = searchParams.get("status"); // AVAILABLE, OCCUPIED, MAINTENANCE, BLOCKED
    const bedType = searchParams.get("bedType");

    // Build filter conditions
    const where: any = {
      isActive: true
    };

    if (wardId) where.wardId = wardId;
    if (status) where.status = status;
    if (bedType) {
      where.bedType = {
        name: bedType
      };
    }

    const beds = await prisma.bed.findMany({
      where,
      include: {
        ward: {
          select: {
            id: true,
            name: true,
            floor: true,
            department: true
          }
        },
        bedType: {
          select: {
            id: true,
            name: true,
            description: true,
            dailyRate: true,
            amenities: true,
            maxOccupancy: true
          }
        },
        admissions: {
          where: {
            status: "ACTIVE"
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                gender: true
              }
            },
            admittedByUser: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          take: 1,
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: [
        { ward: { name: "asc" } },
        { bedNumber: "asc" }
      ]
    });

    // Transform the data to include current admission info
    const bedsWithStatus = beds.map(bed => ({
      id: bed.id,
      bedNumber: bed.bedNumber,
      status: bed.status,
      notes: bed.notes,
      ward: bed.ward,
      bedType: {
        ...bed.bedType,
        amenities: bed.bedType.amenities ? JSON.parse(bed.bedType.amenities) : []
      },
      currentAdmission: bed.admissions[0] || null,
      isOccupied: bed.admissions.length > 0,
      createdAt: bed.createdAt,
      updatedAt: bed.updatedAt
    }));

    return NextResponse.json({ beds: bedsWithStatus });

  } catch (error) {
    console.error("Error fetching beds:", error);
    return NextResponse.json(
      { error: "Failed to fetch beds" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { bedId, status, notes } = await request.json();

    if (!bedId || !status) {
      return NextResponse.json(
        { error: "Bed ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "BLOCKED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid bed status" },
        { status: 400 }
      );
    }

    const updatedBed = await prisma.bed.update({
      where: { id: bedId },
      data: {
        status,
        notes: notes || null,
        updatedAt: new Date()
      },
      include: {
        ward: true,
        bedType: true
      }
    });

    return NextResponse.json({ 
      message: "Bed status updated successfully",
      bed: updatedBed
    });

  } catch (error) {
    console.error("Error updating bed:", error);
    return NextResponse.json(
      { error: "Failed to update bed status" },
      { status: 500 }
    );
  }
}
