import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/authz";
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

  // Respect hospital weekly schedule (open/close days and hours)
  const dayKey = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][date.getDay()];
  const daySchedule = settings.weeklySchedule?.[dayKey];
  if (!daySchedule || !daySchedule.isOpen) {
    // Closed day: do not create any sessions
    return [];
  }
  const parse = (t: string) => {
    const [h, m] = (t || "0:0").split(":").map((n: string) => parseInt(n, 10));
    return h * 60 + m;
  };
  const dayStart = parse(daySchedule.startTime || settings.businessStartTime || "09:00");
  const dayEnd = parse(daySchedule.endTime || settings.businessEndTime || "17:00");
  const hasLunch = settings.lunchBreakStart && settings.lunchBreakEnd;
  const lbStart = hasLunch ? parse(settings.lunchBreakStart) : null;
  const lbEnd = hasLunch ? parse(settings.lunchBreakEnd) : null;
  
  // Check if business hours cross midnight
  const businessCrossesMidnight = dayEnd <= dayStart;

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

  const createdSessions = [] as any[];
  // Track occupied intervals to avoid overlaps
  const occupied: Array<{ start: number; end: number; code: string }> = [];

  // Sort templates by start time for consistent overlap detection
  const templatesSorted = [...activeTemplates].sort(
    (a: any, b: any) => parse(a.startTime) - parse(b.startTime)
  );

  for (const template of templatesSorted) {
    const tStart = parse(template.startTime);
    let tEnd = parse(template.endTime);

    const isCrossMidnight = tEnd <= tStart; // e.g., 19:00 -> 02:00

    // Validate session times against business hours
    let isValid = false;
    
    if (!businessCrossesMidnight) {
      // Normal business hours (e.g., 9:00 to 17:00)
      if (!isCrossMidnight) {
        // Normal session within same day
        isValid = tStart >= dayStart && tEnd <= dayEnd;
      } else {
        // Cross-midnight session in normal business hours - not supported
        isValid = false;
      }
    } else {
      // Business hours cross midnight (e.g., 9:00 to 00:59 next day)
      if (!isCrossMidnight) {
        // Same-day session: valid if within start-to-midnight OR midnight-to-end
        isValid = (tStart >= dayStart && tEnd <= 24*60) || (tStart >= 0 && tEnd <= dayEnd);
      } else {
        // Cross-midnight session: start should be after dayStart, end should be before dayEnd
        isValid = tStart >= dayStart && tEnd <= dayEnd;
        // Normalize end for overlap comparisons (add 24h)
        tEnd = tEnd + 24 * 60;
      }
    }
    
    if (!isValid) {
      continue;
    }
    
    // Respect lunch break if configured (only for same-day sessions)
    if (!isCrossMidnight && hasLunch && lbStart !== null && lbEnd !== null) {
      if (Math.max(tStart, lbStart) < Math.min(tEnd, lbEnd)) {
        continue;
      }
    }

    // Check overlap with already created/updated sessions for the day
    const overlaps = occupied.some((o) => {
      const aStart = tStart;
      const aEnd = tEnd;
      const bStart = o.start;
      const bEnd = o.end;
      return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
    });
    if (overlaps) {
      continue;
    }

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
      // Update existing session with current template values (if valid)
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

    occupied.push({ start: tStart, end: tEnd, code: template.shortCode });
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
    // Allow public access for fetching sessions (no auth required for GET)
    // Only restrict POST/PUT/DELETE operations
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const doctorId = searchParams.get("doctorId");

    let whereClause: any = {};

    if (date) {
      const targetDate = new Date(date);
      whereClause.date = targetDate;

      // Auto-create sessions for the requested date if they don't exist
      await ensureSessionsExist(targetDate);

      // Also ensure previous day's sessions exist to include cross-midnight sessions
      const prevDate = new Date(targetDate);
      prevDate.setDate(targetDate.getDate() - 1);
      await ensureSessionsExist(prevDate);
    }

    // Note: doctorId filtering removed due to schema changes

    // Fetch today's sessions
    const sessionsToday = await prisma.appointmentSession.findMany({
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

    let sessions = sessionsToday;

    // If date provided, also include cross-midnight sessions that started the previous day
    if (date) {
      const targetDate = new Date(date);
      const prevDate = new Date(targetDate);
      prevDate.setDate(targetDate.getDate() - 1);

      const prevDaySessions = await prisma.appointmentSession.findMany({
        where: {
          date: prevDate,
        },
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

      // Filter prev day sessions that cross midnight (endTime <= startTime)
      const crosses = prevDaySessions.filter((s) => {
        const [sh, sm] = s.startTime.split(":").map((n) => parseInt(n, 10));
        const [eh, em] = s.endTime.split(":").map((n) => parseInt(n, 10));
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        return end <= start; // crosses midnight
      });

      // Merge: include previous day's cross-midnight sessions
      sessions = [...crosses, ...sessionsToday];
    }

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
    const auth = await withAuth(request, ["ADMIN", "RECEPTIONIST"]);
    if (auth instanceof NextResponse) return auth;

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
