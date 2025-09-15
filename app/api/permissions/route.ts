import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const permissions = await prisma.permission.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { module: "asc" },
        { action: "asc" }
      ]
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
