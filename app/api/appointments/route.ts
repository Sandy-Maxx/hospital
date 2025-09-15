import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiCache } from "@/lib/api-cache";
import { broadcast } from "@/lib/sse";
import { withAuth } from "@/lib/authz";
import { z } from "zod";
import fs from "fs";
import path from "path";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  sessionId: z.string().min(1, "Session is required"),
  dateTime: z.string().min(1, "Date and time is required"),
  type: z
    .enum(["CONSULTATION", "FOLLOW_UP", "EMERGENCY", "ROUTINE_CHECKUP"])
    .default("CONSULTATION"),
  notes: z.string().optional(),
});

// Load hospital settings
function loadHospitalSettings() {
  try {
    const settingsPath = path.join(
      process.cwd(),
      "data",
      "hospital-settings.json",
    );
    const settingsData = fs.readFileSync(settingsPath, "utf8");
    return JSON.parse(settingsData);
  } catch (error) {
    console.error("Error loading hospital settings:", error);
    return {
      tokenPrefix: "T",
      sessionPrefix: "S",
    };
  }
}

// Generate token number for appointment
async function generateTokenNumber(sessionId: string): Promise<string> {
  const session = await prisma.appointmentSession.findUnique({
    where: { id: sessionId },
    include: {
      appointments: {
        where: {
          status: { notIn: ["CANCELLED"] },
        },
        orderBy: { tokenNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  // Load hospital settings for token prefix
  const settings = loadHospitalSettings();
  const tokenPrefix = settings.tokenPrefix || "T";

  // Generate next token number
  const lastToken = session.appointments[0]?.tokenNumber;
  let nextNumber = 1;

  if (lastToken) {
    // Extract trailing number from token (supports old style with dashes and new concatenated style)
    // Examples: "MED-M-015" => 15, "CREM001" => 1, "CRE-LE-099" => 99
    const match = lastToken.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // New unified format: {tokenPrefix}{sessionShortCode}{number}
  const tokenNumber = `${tokenPrefix}${session.shortCode}${nextNumber
    .toString()
    .padStart(3, "0")}`;
  return tokenNumber;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof NextResponse) return auth;
    const session = auth.session;

    const { searchParams } = new URL(request.url);

    const cacheKey = request.url;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
    const date = searchParams.get("date");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};

    // Date filtering: supports either single-day (date) or range (from,to or dateFrom,dateTo)
    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1); // Include the end date
      where.dateTime = {
        gte: startDate,
        lt: endDate,
      };
    } else if (from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      endDate.setDate(endDate.getDate() + 1); // Include the end date
      where.dateTime = {
        gte: startDate,
        lt: endDate,
      };
    } else if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.dateTime = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (status) {
      const statusArray = status.split(",");
      where.status = {
        in: statusArray,
      };
    }

    if (type) {
      const typeArray = type.split(",");
      where.type = {
        in: typeArray,
      };
    }

    // If user is a doctor, only show their appointments
    if (session.user.role === "DOCTOR") {
      where.doctorId = session.user.id;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dateTime: "asc" }],
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
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    const result = {
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
    apiCache.set(cacheKey, result, 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof NextResponse) return auth;
    const session = auth.session;

    const body = await request.json();
    const validatedData = appointmentSchema.parse(body);

    // Check if doctor exists
    const doctor = await prisma.user.findFirst({
      where: {
        id: validatedData.doctorId,
        role: "DOCTOR",
        isActive: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 400 });
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 400 });
    }

    // Check for conflicting appointments
    const appointmentDateTime = new Date(validatedData.dateTime);
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: validatedData.doctorId,
        dateTime: appointmentDateTime,
        status: {
          not: "CANCELLED",
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: "Doctor is not available at this time" },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: validatedData.patientId,
        doctorId: validatedData.doctorId,
        sessionId: validatedData.sessionId,
        dateTime: new Date(validatedData.dateTime),
        type: validatedData.type,
        notes: validatedData.notes,
        tokenNumber: await generateTokenNumber(validatedData.sessionId),
        status: "SCHEDULED",
      },
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
          },
        },
      },
    });

    // Update session currentTokens to keep counts accurate
    await prisma.appointmentSession.update({
      where: { id: validatedData.sessionId },
      data: { currentTokens: { increment: 1 } },
    });

    // Notify listeners (queue/dashboard) of new appointment
    try { broadcast('queue-update', { id: appointment.id, status: appointment.status }); } catch {}
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
