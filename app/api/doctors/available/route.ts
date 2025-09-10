import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";

export const dynamic = 'force-dynamic';

const fsExists = (p: string) => {
  try { return fs.existsSync(p); } catch { return false; }
};
const fsRead = async (p: string) => fs.readFileSync(p, "utf8");

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
          const session = await prisma.appointmentSession.findUnique({ where: { id: sessionId }, select: { shortCode: true, date: true } });
          if (session) {
            const availableDoctors = await getAvailableDoctorsForSession(
              allDoctors,
              session.date,
              session.shortCode,
            );
            return NextResponse.json({ doctors: availableDoctors });
          }
        }
      }

      // Filter assigned doctors by availability
      const assignedDoctors = sessionAssignments.map(
        (assignment) => assignment.doctor,
      );
      const session = await prisma.appointmentSession.findUnique({
        where: { id: sessionId },
        select: { date: true, shortCode: true },
      });

      if (session) {
        const availableDoctors = await getAvailableDoctorsForSession(
          assignedDoctors,
          session.date,
          session.shortCode,
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
  const availableDoctors = [] as any[];
  for (const doctor of doctors) {
    const isAvailable = await checkDoctorAvailability(doctor.id, date);
    if (isAvailable) availableDoctors.push(doctor);
  }
  return availableDoctors;
}

async function getAvailableDoctorsForSession(doctors: any[], date: Date, sessionShortCode: string) {
  const availableDoctors = [] as any[];
  for (const doctor of doctors) {
    const isAvailable = await checkDoctorAvailability(doctor.id, date, sessionShortCode);
    if (isAvailable) availableDoctors.push(doctor);
  }
  return availableDoctors;
}

async function checkDoctorAvailability(
  doctorId: string,
  date: Date,
  sessionShortCode?: string,
): Promise<boolean> {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Weekly routine check (if configured): require working day and matching session if provided
  try {
    const filePath = `${process.cwd()}\\data\\doctor-routines\\${doctorId}.json`;
    if (fsExists(filePath)) {
      const raw = await fsRead(filePath);
      const routine = JSON.parse(raw);
      const dayKey = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][dayOfWeek];
      const dayRule = routine?.[dayKey];
      if (!dayRule || dayRule.isWorking === false) return false;
      if (sessionShortCode && Array.isArray(dayRule.sessions)) {
        if (!dayRule.sessions.includes(sessionShortCode)) return false;
      }
    }
  } catch {}

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
