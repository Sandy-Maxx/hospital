import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Load hospital settings to get session templates
function loadHospitalSettings() {
  try {
    const settingsPath = path.join(
      process.cwd(),
      "data",
      "hospital-settings.json",
    );
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading hospital settings:", error);
  }

  // Return default session templates if file doesn't exist
  return {
    sessionTemplates: [
      {
        id: "1",
        name: "Morning",
        shortCode: "S1",
        startTime: "09:00",
        endTime: "13:00",
        maxTokens: 50,
        isActive: true,
      },
      {
        id: "2",
        name: "Afternoon",
        shortCode: "S2",
        startTime: "14:00",
        endTime: "17:00",
        maxTokens: 40,
        isActive: true,
      },
    ],
  };
}

// Auto-create sessions for a date if they don't exist
async function ensureSessionsExist(date: Date) {
  const settings = loadHospitalSettings();
  const activeTemplates =
    settings.sessionTemplates?.filter((template: any) => template.isActive) ||
    [];

  // First, clean up any sessions that don't match current templates
  const validShortCodes = activeTemplates.map((t: any) => t.shortCode);
  await prisma.appointmentSession.deleteMany({
    where: {
      date: date,
      shortCode: {
        notIn: validShortCodes,
      },
    },
  });

  const createdSessions = [];

  for (const template of activeTemplates) {
    const existingSession = await prisma.appointmentSession.findFirst({
      where: {
        date: date,
        shortCode: template.shortCode,
      },
    });

    if (!existingSession) {
      const newSession = await prisma.appointmentSession.create({
        data: {
          date: date,
          name: template.name,
          shortCode: template.shortCode,
          startTime: template.startTime,
          endTime: template.endTime,
          maxTokens: template.maxTokens,
          currentTokens: 0,
          isActive: true,
        },
      });
      createdSessions.push(newSession);
    } else {
      // Update existing session with current template values
      await prisma.appointmentSession.update({
        where: { id: existingSession.id },
        data: {
          name: template.name,
          startTime: template.startTime,
          endTime: template.endTime,
          maxTokens: template.maxTokens,
          isActive: template.isActive,
        },
      });
    }
  }

  return createdSessions;
}
import { z } from "zod";

const sessionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  name: z.string().min(1, "Session name is required"),
  shortCode: z.string().min(1, "Short code is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  maxTokens: z.number().min(1, "Max tokens must be at least 1").default(50),
  doctorId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const doctorId = searchParams.get("doctorId");

    let whereClause: any = {};

    if (date) {
      const targetDate = new Date(date);
      whereClause.date = targetDate;

      // Auto-create sessions for the requested date if they don't exist
      await ensureSessionsExist(targetDate);
    }

    // Note: doctorId filtering removed due to schema changes

    const sessions = await prisma.appointmentSession.findMany({
      where: whereClause,
      include: {
        appointments: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
            doctor: {
              select: {
                id: true,
                name: true,
              },
            },
            session: {
              select: {
                id: true,
                name: true,
                shortCode: true,
                date: true,
                startTime: true,
                endTime: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        doctorAssignments: {
          where: { isActive: true },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                department: true,
                specialization: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sessionSchema.parse(body);

    // Check if session already exists for this date and shortCode
    const existingSession = await prisma.appointmentSession.findUnique({
      where: {
        date_shortCode: {
          date: new Date(validatedData.date),
          shortCode: validatedData.shortCode,
        },
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "Session with this short code already exists for this date" },
        { status: 400 },
      );
    }

    // Validate doctor if provided
    if (validatedData.doctorId) {
      const doctor = await prisma.user.findFirst({
        where: {
          id: validatedData.doctorId,
          role: "DOCTOR",
          isActive: true,
        },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 400 },
        );
      }
    }

    const newSession = await prisma.appointmentSession.create({
      data: {
        date: new Date(validatedData.date),
        name: validatedData.name,
        shortCode: validatedData.shortCode,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        maxTokens: validatedData.maxTokens,
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
