import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const date = searchParams.get("date");

    if (!sessionId && !date) {
      return NextResponse.json(
        { error: "Session ID or date is required" },
        { status: 400 },
      );
    }

    // Get all doctors with DOCTOR role
    const allDoctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        department: true,
        specialization: true,
      },
    });

    if (sessionId) {
      // Get doctors assigned to specific session
      const sessionAssignments = await prisma.doctorSessionAssignment.findMany({
        where: {
          sessionId,
          isActive: true,
        },
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
      });

      // If no specific assignments, return all available doctors
      if (sessionAssignments.length === 0) {
        const sessionDate = await prisma.appointmentSession.findUnique({
          where: { id: sessionId },
          select: { date: true },
        });

        if (sessionDate) {
          const availableDoctors = await getAvailableDoctorsForDate(
            allDoctors,
            sessionDate.date,
          );
          return NextResponse.json({ doctors: availableDoctors });
        }
      }

      // Filter assigned doctors by availability
      const assignedDoctors = sessionAssignments.map(
        (assignment) => assignment.doctor,
      );
      const session = await prisma.appointmentSession.findUnique({
        where: { id: sessionId },
        select: { date: true },
      });

      if (session) {
        const availableDoctors = await getAvailableDoctorsForDate(
          assignedDoctors,
          session.date,
        );
        return NextResponse.json({ doctors: availableDoctors });
      }
    }

    if (date) {
      // Get available doctors for a specific date
      const targetDate = new Date(date);
      const availableDoctors = await getAvailableDoctorsForDate(
        allDoctors,
        targetDate,
      );
      return NextResponse.json({ doctors: availableDoctors });
    }

    return NextResponse.json({ doctors: allDoctors });
  } catch (error) {
    console.error("Error fetching available doctors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function getAvailableDoctorsForDate(doctors: any[], date: Date) {
  const availableDoctors = [];

  for (const doctor of doctors) {
    const isAvailable = await checkDoctorAvailability(doctor.id, date);
    if (isAvailable) {
      availableDoctors.push(doctor);
    }
  }

  return availableDoctors;
}

async function checkDoctorAvailability(
  doctorId: string,
  date: Date,
): Promise<boolean> {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Check for unavailability rules
  const unavailabilityRules = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      isActive: true,
      OR: [
        // Date range rules
        {
          startDate: { lte: date },
          OR: [{ endDate: { gte: date } }, { endDate: null }],
        },
        // Recurring weekday rules
        {
          isRecurring: true,
          weekdays: {
            contains: dayOfWeek.toString(),
          },
        },
      ],
    },
  });

  // If any unavailability rule matches, doctor is not available
  return unavailabilityRules.length === 0;
}
