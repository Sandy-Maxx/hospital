import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSessionSchema = z.object({
  name: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxTokens: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  doctorId: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await prisma.appointmentSession.findUnique({
      where: { id: params.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        appointments: {
          select: {
            id: true,
            status: true,
            tokenNumber: true,
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            tokenNumber: "asc",
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSessionSchema.parse(body);

    // Check if session exists
    const existingSession = await prisma.appointmentSession.findUnique({
      where: { id: params.id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
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

    const updatedSession = await prisma.appointmentSession.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if session has appointments
    const sessionWithAppointments = await prisma.appointmentSession.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          where: {
            status: {
              notIn: ["CANCELLED", "COMPLETED"],
            },
          },
        },
      },
    });

    if (!sessionWithAppointments) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (sessionWithAppointments.appointments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete session with active appointments" },
        { status: 400 },
      );
    }

    await prisma.appointmentSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
