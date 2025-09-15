import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const roles = await prisma.customRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: {
          where: {
            isActive: true
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    const rolesWithStats = roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      isSystem: role.isSystem,
      permissions: role.permissions.map(rp => rp.permission),
      userCount: role.users.length,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }));

    return NextResponse.json({ roles: rolesWithStats });

  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { name, displayName, description, permissions } = await request.json();

    if (!name || !displayName || !permissions || permissions.length === 0) {
      return NextResponse.json(
        { error: "Name, display name, and permissions are required" },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existingRole = await prisma.customRole.findUnique({
      where: { name }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 400 }
      );
    }

    // Create role and assign permissions in a transaction
    const role = await prisma.$transaction(async (tx) => {
      // Create role
      const newRole = await tx.customRole.create({
        data: {
          name,
          displayName,
          description: description || null,
          isActive: true,
          isSystem: false
        }
      });

      // Assign permissions
      for (const permissionId of permissions) {
        await tx.rolePermission.create({
          data: {
            roleId: newRole.id,
            permissionId
          }
        });
      }

      return newRole;
    });

    return NextResponse.json({
      message: "Role created successfully",
      role
    });

  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}
