import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

let DOCTORS_CACHE: { data: any; timestamp: number } | null = null;
const DOCTORS_TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["ADMIN", "RECEPTIONIST", "DOCTOR"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    if (DOCTORS_CACHE && now - DOCTORS_CACHE.timestamp < DOCTORS_TTL) {
      return NextResponse.json(DOCTORS_CACHE.data);
    }

    const doctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        specialization: true,
      },
      orderBy: { name: "asc" },
    });

    const payload = { doctors };
    DOCTORS_CACHE = { data: payload, timestamp: now };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
