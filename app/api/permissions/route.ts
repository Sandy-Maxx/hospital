import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS_SEED } from "@/lib/permissions-seed";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Auto-sync: ensure all code-defined permissions exist in DB
    for (const perm of PERMISSIONS_SEED) {
      await prisma.permission.upsert({
        where: { name: `${perm.module}.${perm.action}` },
        update: {
          displayName: perm.displayName,
          description: perm.description,
          module: perm.module,
          action: perm.action,
          isActive: true,
        },
        create: {
          name: `${perm.module}.${perm.action}`,
          displayName: perm.displayName,
          description: perm.description,
          module: perm.module,
          action: perm.action,
          isActive: true,
        },
      });
    }

    const permissions = await prisma.permission.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { module: "asc" },
        { action: "asc" },
      ],
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
