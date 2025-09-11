import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getOverallUrgencyLevel } from "@/lib/problem-categories";
import fs from "fs";
import path from "path";

const bookingSchema = z.object({
  // Patient information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  // Appointment details
  sessionId: z.string().min(1, "Session ID is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  type: z
    .enum(["CONSULTATION", "FOLLOW_UP", "EMERGENCY"])
    .default("CONSULTATION"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "EMERGENCY"]).default("NORMAL"),
  notes: z.string().optional(),
  problemCategories: z.array(z.string()).min(1, "At least one health concern must be selected"),
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

// Generate next token number for session
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
    // Extract trailing number from token (supports both old dashed and new concatenated styles)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    // Check if public booking is enabled
    const settings = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/settings/hospital`,
    );
    const settingsData = await settings.json();

    if (!settingsData.allowPublicBooking) {
      return NextResponse.json(
        { error: "Public booking is currently disabled" },
        { status: 403 },
      );
    }

    // Validate session exists and is active
    const session = await prisma.appointmentSession.findUnique({
      where: { id: validatedData.sessionId },
    });

    if (!session || !session.isActive) {
      return NextResponse.json(
        { error: "Session not found or inactive" },
        { status: 400 },
      );
    }

    // Verify the selected doctor exists and is available
    const selectedDoctor = await prisma.user.findUnique({
      where: {
        id: validatedData.doctorId,
        role: "DOCTOR",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!selectedDoctor) {
      return NextResponse.json(
        { error: "Selected doctor not found or inactive" },
        { status: 400 },
      );
    }

    // Check if doctor is available for this session date
    const sessionDateStr = session.date.toISOString().split("T")[0];
    const unavailabilityRules = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: validatedData.doctorId,
        isActive: true,
        startDate: { lte: new Date(sessionDateStr) },
        OR: [{ endDate: null }, { endDate: { gte: new Date(sessionDateStr) } }],
      },
    });

    if (unavailabilityRules.length > 0) {
      return NextResponse.json(
        { error: "Selected doctor is not available for this date" },
        { status: 400 },
      );
    }

    // Check if session is in the future
    const sessionDate = new Date(session.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sessionDate < today) {
      return NextResponse.json(
        { error: "Cannot book appointments for past dates" },
        { status: 400 },
      );
    }

    // Check if session is full
    if (session.currentTokens >= session.maxTokens) {
      return NextResponse.json(
        { error: "Session is full. Please select another session." },
        { status: 400 },
      );
    }

    // Check for existing patient or create new one
    let patient = await prisma.patient.findFirst({
      where: {
        phone: validatedData.phone,
      },
    });

    if (!patient) {
      // Create new patient
      patient = await prisma.patient.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          email: validatedData.email,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : null,
          gender: validatedData.gender,
        },
      });
    } else {
      // Update existing patient with new information
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email || patient.email,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : patient.dateOfBirth,
          gender: validatedData.gender || patient.gender,
        },
      });
    }

    // Check for duplicate appointment on same session
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        sessionId: validatedData.sessionId,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        {
          error: "You already have an appointment in this session",
          tokenNumber: existingAppointment.tokenNumber,
        },
        { status: 400 },
      );
    }

    // Auto-adjust priority based on problem categories
    const categoryBasedPriority = getOverallUrgencyLevel(validatedData.problemCategories);
    const finalPriority = categoryBasedPriority === 'EMERGENCY' ? 'EMERGENCY' :
                         categoryBasedPriority === 'HIGH' ? 'HIGH' : 
                         validatedData.priority;

    // Generate token number
    const tokenNumber = await generateTokenNumber(validatedData.sessionId);

    // Prepare notes with problem categories
    const problemCategoriesNote = `Health Concerns: ${validatedData.problemCategories.join(', ')}`;
    const finalNotes = validatedData.notes 
      ? `${problemCategoriesNote}\n\n${validatedData.notes}`
      : problemCategoriesNote;

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: selectedDoctor.id,
        sessionId: validatedData.sessionId,
        dateTime: new Date(session.date), // Will be updated when session starts
        type: validatedData.type,
        priority: finalPriority,
        notes: finalNotes,
        tokenNumber: tokenNumber,
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
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update session current tokens count
    await prisma.appointmentSession.update({
      where: { id: validatedData.sessionId },
      data: {
        currentTokens: { increment: 1 },
      },
    });

    return NextResponse.json(
      {
        message: "Appointment booked successfully",
        appointment,
        tokenNumber,
        sessionInfo: {
          name: session.name,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error booking public appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
