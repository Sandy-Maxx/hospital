import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const active = searchParams.get("active");

    let whereClause: any = {};

    if (date) {
      const targetDate = new Date(date);
      whereClause.date = targetDate;

      // Auto-create sessions if none exist for this date
      const existingSessions = await prisma.appointmentSession.findMany({
        where: { date: targetDate },
      });

      if (existingSessions.length === 0) {
        // Create default sessions
        const defaultSessions = [
          {
            date: targetDate,
            name: "Morning",
            shortCode: "S1",
            startTime: "09:00",
            endTime: "13:00",
            maxTokens: 50,
            currentTokens: 0,
            isActive: true,
          },
          {
            date: targetDate,
            name: "Afternoon",
            shortCode: "S2",
            startTime: "14:00",
            endTime: "17:00",
            maxTokens: 40,
            currentTokens: 0,
            isActive: true,
          },
        ];

        for (const sessionData of defaultSessions) {
          try {
            await prisma.appointmentSession.create({
              data: sessionData,
            });
          } catch (error) {
            // Ignore duplicate errors
            console.log("Session may already exist:", error);
          }
        }
      }
    }

    if (active === "true") {
      whereClause.isActive = true;
    }

    const sessions = await prisma.appointmentSession.findMany({
      where: whereClause,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch sessions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
