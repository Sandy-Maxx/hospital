import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session as any)?.user?.role as string | undefined;
    const userId = (session as any)?.user?.id as string | undefined;

    if (
      !session ||
      !userId ||
      !role ||
      !["ADMIN", "RECEPTIONIST"].includes(role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { doctorId, reason } = await request.json();

    if (!doctorId) {
      return NextResponse.json(
        { error: "doctorId is required" },
        { status: 400 },
      );
    }

    // Validate target doctor
    const targetDoctor = await prisma.user.findFirst({
      where: { id: doctorId, role: "DOCTOR", isActive: true },
      select: { id: true, name: true },
    });
    if (!targetDoctor) {
      return NextResponse.json(
        { error: "Target doctor not found or inactive" },
        { status: 400 },
      );
    }

    // Fetch current appointment
    const current = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, doctorId: true },
    });
    if (!current) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Update appointment doctor
    const updated = await prisma.appointment.update({
      where: { id },
      data: { doctorId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        doctor: { select: { id: true, name: true, department: true } },
      },
    });

    // Log the reassignment for audit
    await prisma.appointmentAssignmentLog.create({
      data: {
        appointmentId: id,
        fromDoctorId: current.doctorId ?? null,
        toDoctorId: doctorId,
        changedBy: userId,
        reason: reason || "Reassignment from receptionist dashboard",
      },
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Error assigning doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
