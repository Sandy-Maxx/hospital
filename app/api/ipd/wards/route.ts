import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const wards = await prisma.ward.findMany({
      where: {
        isActive: true
      },
      include: {
        bedTypes: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            name: true,
            description: true,
            dailyRate: true,
            maxOccupancy: true,
            amenities: true
          }
        },
        beds: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            bedNumber: true,
            status: true,
            admissions: {
              where: {
                status: "ACTIVE"
              },
              select: {
                id: true,
                patient: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              },
              take: 1
            }
          }
        },
        _count: {
          select: {
            beds: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    // Transform the data to include statistics
    const wardsWithStats = wards.map(ward => {
      const totalBeds = ward._count.beds;
      const occupiedBeds = ward.beds.filter(bed => bed.admissions.length > 0).length;
      const availableBeds = ward.beds.filter(bed => bed.status === "AVAILABLE" && bed.admissions.length === 0).length;
      const maintenanceBeds = ward.beds.filter(bed => bed.status === "MAINTENANCE").length;
      const blockedBeds = ward.beds.filter(bed => bed.status === "BLOCKED").length;

      return {
        id: ward.id,
        name: ward.name,
        description: ward.description,
        floor: ward.floor,
        department: ward.department,
        capacity: ward.capacity,
        bedTypes: ward.bedTypes.map(bt => ({
          ...bt,
          amenities: bt.amenities ? JSON.parse(bt.amenities) : []
        })),
        statistics: {
          totalBeds,
          occupiedBeds,
          availableBeds,
          maintenanceBeds,
          blockedBeds,
          occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
        },
        createdAt: ward.createdAt,
        updatedAt: ward.updatedAt
      };
    });

    // Overall hospital statistics
    const overallStats = wardsWithStats.reduce((acc, ward) => ({
      totalBeds: acc.totalBeds + ward.statistics.totalBeds,
      occupiedBeds: acc.occupiedBeds + ward.statistics.occupiedBeds,
      availableBeds: acc.availableBeds + ward.statistics.availableBeds,
      maintenanceBeds: acc.maintenanceBeds + ward.statistics.maintenanceBeds,
      blockedBeds: acc.blockedBeds + ward.statistics.blockedBeds,
    }), {
      totalBeds: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      maintenanceBeds: 0,
      blockedBeds: 0,
    });

    overallStats.occupancyRate = overallStats.totalBeds > 0 
      ? Math.round((overallStats.occupiedBeds / overallStats.totalBeds) * 100) 
      : 0;

    return NextResponse.json({
      wards: wardsWithStats,
      overallStats
    });

  } catch (error) {
    console.error("Error fetching wards:", error);
    return NextResponse.json(
      { error: "Failed to fetch wards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { name, description, floor, department, capacity } = await request.json();

    if (!name || !capacity) {
      return NextResponse.json(
        { error: "Ward name and capacity are required" },
        { status: 400 }
      );
    }

    // Check if ward name already exists
    const existingWard = await prisma.ward.findUnique({
      where: { name }
    });

    if (existingWard) {
      return NextResponse.json(
        { error: "Ward with this name already exists" },
        { status: 400 }
      );
    }

    const ward = await prisma.ward.create({
      data: {
        name,
        description: description || null,
        floor: floor || null,
        department: department || null,
        capacity: parseInt(capacity),
        isActive: true
      }
    });

    return NextResponse.json({
      message: "Ward created successfully",
      ward
    });

  } catch (error) {
    console.error("Error creating ward:", error);
    return NextResponse.json(
      { error: "Failed to create ward" },
      { status: 500 }
    );
  }
}
