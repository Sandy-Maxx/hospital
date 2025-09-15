import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { 
      wardId, 
      name, 
      description, 
      dailyRate, 
      maxOccupancy, 
      amenities 
    } = await request.json();

    if (!wardId || !name || !dailyRate) {
      return NextResponse.json(
        { error: "Ward ID, name, and daily rate are required" },
        { status: 400 }
      );
    }

    // Verify ward exists
    const ward = await prisma.ward.findUnique({
      where: { id: wardId }
    });

    if (!ward) {
      return NextResponse.json(
        { error: "Ward not found" },
        { status: 404 }
      );
    }

    // Check if bed type name already exists in this ward
    const existingBedType = await prisma.bedType.findUnique({
      where: {
        wardId_name: {
          wardId,
          name
        }
      }
    });

    if (existingBedType) {
      return NextResponse.json(
        { error: "Bed type with this name already exists in this ward" },
        { status: 400 }
      );
    }

    const bedType = await prisma.bedType.create({
      data: {
        wardId,
        name,
        description: description || null,
        dailyRate: parseFloat(dailyRate),
        maxOccupancy: parseInt(maxOccupancy) || 1,
        amenities: JSON.stringify(amenities || []),
        isActive: true
      }
    });

    return NextResponse.json({
      message: "Bed type created successfully",
      bedType: {
        ...bedType,
        amenities: JSON.parse(bedType.amenities || "[]")
      }
    });

  } catch (error) {
    console.error("Error creating bed type:", error);
    return NextResponse.json(
      { error: "Failed to create bed type" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");

    const where: any = {
      isActive: true
    };

    if (wardId) {
      where.wardId = wardId;
    }

    const bedTypes = await prisma.bedType.findMany({
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
        beds: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: [
        { ward: { name: "asc" } },
        { name: "asc" }
      ]
    });

    const bedTypesWithStats = bedTypes.map(bedType => ({
      id: bedType.id,
      name: bedType.name,
      description: bedType.description,
      dailyRate: bedType.dailyRate,
      maxOccupancy: bedType.maxOccupancy,
      amenities: JSON.parse(bedType.amenities || "[]"),
      ward: bedType.ward,
      statistics: {
        totalBeds: bedType.beds.length,
        availableBeds: bedType.beds.filter(bed => bed.status === "AVAILABLE").length,
        occupiedBeds: bedType.beds.filter(bed => bed.status === "OCCUPIED").length
      },
      createdAt: bedType.createdAt,
      updatedAt: bedType.updatedAt
    }));

    return NextResponse.json({ bedTypes: bedTypesWithStats });

  } catch (error) {
    console.error("Error fetching bed types:", error);
    return NextResponse.json(
      { error: "Failed to fetch bed types" },
      { status: 500 }
    );
  }
}
