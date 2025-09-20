import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/authz";

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    const where = patientId ? { patientId } : {};

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        consultation: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
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
    const {
      patientId,
      consultationId,
      appointmentId,
      medicines,
      labTests,
      therapies,
      symptoms,
      diagnosis,
      notes,
      vitals,
      quickNotes,
      soapNotes,
    } = body;

    // Determine doctor for this prescription
    let doctorId: string | null = null;
    if (appointmentId) {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
      if (!appt)
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 },
        );
      doctorId = appt.doctorId;
    } else {
      const doctor = await prisma.user.findUnique({
        where: { email: session.user.email! },
      });
      if (!doctor)
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 },
        );
      doctorId = doctor.id;
    }

    // Validate required fields
    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Prepare prescription data
    const prescriptionCreateData: any = {
      patientId,
      doctorId: doctorId!,
      symptoms,
      diagnosis,
      notes,
      vitals: vitals ? JSON.stringify(vitals) : null,
      medicines: JSON.stringify({
        medicines: medicines || [],
        labTests: labTests || [],
        therapies: therapies || [],
        ...(quickNotes ? { quickNotes } : {}),
        ...(soapNotes ? { soapNotes } : {}),
      }),
    };

    // Link to consultation by appointment if provided (create or reuse)
    let finalConsultationId = consultationId || null;
    if (!finalConsultationId && appointmentId) {
      // upsert consultation for appointment
      const existing = await prisma.consultation.findUnique({
        where: { appointmentId: appointmentId },
      });
      if (existing) {
        finalConsultationId = existing.id;
        await prisma.consultation.update({
          where: { id: existing.id },
          data: {
            chiefComplaint: symptoms || existing.chiefComplaint,
            history: "",
            examination: vitals ? JSON.stringify(vitals) : existing.examination,
            diagnosis: diagnosis || existing.diagnosis,
            treatment: notes || existing.treatment,
          },
        });
      } else {
        const create = await prisma.consultation.create({
          data: {
            appointmentId: appointmentId,
            patientId: patientId,
            doctorId: doctorId!,
            chiefComplaint: symptoms || "",
            history: "",
            examination: vitals ? JSON.stringify(vitals) : null,
            diagnosis: diagnosis || "",
            treatment: notes || "",
          },
        });
        finalConsultationId = create.id;
      }
    }
    if (finalConsultationId) {
      prescriptionCreateData.consultationId = finalConsultationId;
    }

    const prescription = await prisma.prescription.create({
      data: prescriptionCreateData,
      include: {
        patient: true,
        doctor: true,
        consultation: true,
      },
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof NextResponse) return auth;
    const session = auth.session;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json();
    const data: any = {};

    // Fetch existing to enable safe merges
    const existingPresc = await prisma.prescription.findUnique({ where: { id }, select: { notes: true, medicines: true } });

    if (typeof body.symptoms === "string") data.symptoms = body.symptoms;
    if (typeof body.diagnosis === "string") data.diagnosis = body.diagnosis;
    // Only update vitals when explicitly provided (avoid unintended resets)
    if (body.vitals !== undefined) data.vitals = JSON.stringify(body.vitals);

    // Merge notes while preserving IPD admission lines
    if (typeof body.notes === "string") {
      const currentNotes = existingPresc?.notes || "";
      const lines = currentNotes.split(/\n+/).filter(Boolean);
      const ipdLines = lines.filter(l => l.startsWith("IPD ADMISSION REQUEST:") || l.startsWith("IPD ADMISSION UPDATE:"));
      const baseNote = body.notes.trim();
      data.notes = [baseNote, ...ipdLines].filter(Boolean).join("\n");
    }

    if (
      body.medicines !== undefined ||
      body.labTests !== undefined ||
      body.therapies !== undefined ||
      body.quickNotes !== undefined ||
      body.soapNotes !== undefined ||
      body.status !== undefined
    ) {
      // Merge with existing medicines JSON to avoid clobbering when only status is sent
      const existing = await prisma.prescription.findUnique({
        where: { id },
        select: { medicines: true },
      });
      let current: any = {};
      try {
        current = existing?.medicines ? JSON.parse(existing.medicines) : {};
      } catch {}

      const payload: any = { ...current };
      if (body.medicines !== undefined) payload.medicines = body.medicines;
      if (body.labTests !== undefined) payload.labTests = body.labTests;
      if (body.therapies !== undefined) payload.therapies = body.therapies;
      if (body.quickNotes !== undefined) payload.quickNotes = body.quickNotes;
      if (body.soapNotes !== undefined) payload.soapNotes = body.soapNotes;
      if (body.status !== undefined) payload.status = body.status;

      data.medicines = JSON.stringify(payload);
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data,
      include: { patient: true, doctor: true, consultation: true },
    });

    return NextResponse.json({ prescription: updated });
  } catch (error) {
    console.error("Error updating prescription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.prescription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
