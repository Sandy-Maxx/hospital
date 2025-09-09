import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patientUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
  idProof: z.string().optional(),
  idNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        consultations: {
          include: {
            doctor: true,
          },
          orderBy: { createdAt: "desc" },
        },
        prescriptions: {
          include: {
            doctor: true,
            consultation: true,
          },
          orderBy: { createdAt: "desc" },
        },
        appointments: {
          include: {
            doctor: true,
          },
          orderBy: { dateTime: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to edit patients
    if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = patientUpdateSchema.parse(body);

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // If phone is being updated, check if another patient has this phone
    if (validatedData.phone && validatedData.phone !== existingPatient.phone) {
      const phoneExists = await prisma.patient.findFirst({
        where: {
          phone: validatedData.phone,
          id: { not: params.id },
        },
      });

      if (phoneExists) {
        return NextResponse.json(
          { error: "Another patient with this phone number already exists" },
          { status: 400 },
        );
      }
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : undefined,
        email: validatedData.email || null,
      },
    });

    return NextResponse.json({ patient: updatedPatient });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating patient:", error);
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete patients
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if patient has any related records
    const [consultationCount, prescriptionCount, appointmentCount] =
      await Promise.all([
        prisma.consultation.count({ where: { patientId: params.id } }),
        prisma.prescription.count({ where: { patientId: params.id } }),
        prisma.appointment.count({ where: { patientId: params.id } }),
      ]);

    if (
      consultationCount > 0 ||
      prescriptionCount > 0 ||
      appointmentCount > 0
    ) {
      return NextResponse.json(
        { error: "Cannot delete patient with existing medical records" },
        { status: 400 },
      );
    }

    await prisma.patient.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
