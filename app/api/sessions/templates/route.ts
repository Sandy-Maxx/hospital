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
      {
        id: "3",
        name: "Evening",
        shortCode: "S3",
        startTime: "17:00",
        endTime: "20:00",
        maxTokens: 30,
        isActive: false,
      },
    ],
  };
}

// GET - Get session templates from hospital settings
export async function GET() {
  try {
    const settings = loadHospitalSettings();
    const activeTemplates =
      settings.sessionTemplates?.filter((template: any) => template.isActive) ||
      [];

    return NextResponse.json({
      success: true,
      templates: activeTemplates,
    });
  } catch (error) {
    console.error("Error fetching session templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch session templates" },
      { status: 500 },
    );
  }
}

// POST - Create appointment sessions for a specific date using templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await request.json();

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Load session templates from hospital settings
    const settings = loadHospitalSettings();
    const activeTemplates =
      settings.sessionTemplates?.filter((template: any) => template.isActive) ||
      [];

    if (activeTemplates.length === 0) {
      return NextResponse.json(
        { error: "No active session templates found" },
        { status: 400 },
      );
    }

    const targetDate = new Date(date);

    // Respect weekly schedule
    const dayKey = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][targetDate.getDay()];
    const daySchedule = settings.weeklySchedule?.[dayKey];
    if (!daySchedule || !daySchedule.isOpen) {
      return NextResponse.json(
        { error: "Hospital is closed on the selected date" },
        { status: 400 }
      );
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

    const createdSessions = [] as any[];
    const occupied: Array<{ start: number; end: number; code: string }> = [];
    const templatesSorted = [...activeTemplates].sort((a: any, b: any) => parse(a.startTime) - parse(b.startTime));

    // Create sessions for each active template
    for (const template of templatesSorted) {
      // Validate within hospital day hours
      const tStart = parse(template.startTime);
      const tEnd = parse(template.endTime);
      if (tStart < dayStart || tEnd > dayEnd || tStart >= tEnd) {
        continue;
      }

      // Respect lunch break if configured
      if (hasLunch && lbStart !== null && lbEnd !== null && (Math.max(tStart, lbStart) < Math.min(tEnd, lbEnd))) {
        continue;
      }

      // Check for overlap
      const overlaps = occupied.some((o) => Math.max(o.start, tStart) < Math.min(o.end, tEnd));
      if (overlaps) {
        continue;
      }

      // Check if session already exists for this date and template
      const existingSession = await prisma.appointmentSession.findFirst({
        where: {
          date: targetDate,
          shortCode: template.shortCode,
        },
      });

      if (!existingSession) {
        const newSession = await prisma.appointmentSession.create({
          data: {
            date: targetDate,
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
        occupied.push({ start: tStart, end: tEnd, code: template.shortCode });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdSessions.length} sessions for ${date}`,
      sessions: createdSessions,
    });
  } catch (error) {
    console.error("Error creating sessions from templates:", error);
    return NextResponse.json(
      { error: "Failed to create sessions" },
      { status: 500 },
    );
  }
}
