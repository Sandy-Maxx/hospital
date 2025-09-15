import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await withAuth(request, ["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = params.id;

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const roles = userRoles.map(userRole => ({
      id: userRole.role.id,
      name: userRole.role.name,
      displayName: userRole.role.displayName,
      description: userRole.role.description,
      permissions: userRole.role.permissions.map(rp => rp.permission),
      assignedAt: userRole.createdAt
    }));

    return NextResponse.json({ roles });

  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await withAuth(request, ["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;
  const { session } = authResult;

  try {
    const userId = params.id;
    const { roleId } = await request.json();

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if role exists
    const role = await prisma.customRole.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Check if user already has this role
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "User already has this role" },
        { status: 400 }
      );
    }

    // Assign role to user
    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy: session.user.id,
        isActive: true
      },
      include: {
        role: true
      }
    });

    return NextResponse.json({
      message: "Role assigned successfully",
      userRole: {
        id: userRole.id,
        role: userRole.role,
        assignedAt: userRole.createdAt
      }
    });

  } catch (error) {
    console.error("Error assigning role to user:", error);
    return NextResponse.json(
      { error: "Failed to assign role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await withAuth(request, ["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

    // Remove role assignment
    const deletedUserRole = await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    return NextResponse.json({
      message: "Role removed successfully",
      deletedUserRole
    });

  } catch (error) {
    console.error("Error removing role from user:", error);
    return NextResponse.json(
      { error: "Failed to remove role" },
      { status: 500 }
    );
  }
}
