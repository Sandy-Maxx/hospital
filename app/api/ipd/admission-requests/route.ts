import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED, CONVERTED
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");

    const where: any = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    // Look for prescriptions with IPD-related notes
    const prescriptions = await prisma.prescription.findMany({
      where: {
        ...where,
        notes: {
          contains: "IPD ADMISSION REQUEST:" // identify structured entries
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 200
    });

    // Parse latest admission request state from notes
    function parseAdmissionFromNotes(notes: string | null) {
      if (!notes) return null;
      const lines = notes.split(/\n+/);
      const requests: any[] = [];
      const updates: any[] = [];
      for (const line of lines) {
        const reqIdx = line.indexOf("IPD ADMISSION REQUEST:");
        if (reqIdx >= 0) {
          const jsonStr = line.slice(reqIdx + "IPD ADMISSION REQUEST:".length).trim();
          try { requests.push(JSON.parse(jsonStr)); } catch {}
          continue;
        }
        const updIdx = line.indexOf("IPD ADMISSION UPDATE:");
        if (updIdx >= 0) {
          const jsonStr = line.slice(updIdx + "IPD ADMISSION UPDATE:".length).trim();
          try { updates.push(JSON.parse(jsonStr)); } catch {}
          continue;
        }
      }
      if (requests.length === 0) return null;
      // Take the last request as the current request, then apply updates on top
      const base = { ...requests[requests.length - 1] };
      // Apply latest update if matches the same requestedAt
      let lastStatus = base.status || "PENDING";
      let processedAt = null;
      let processedBy = null;
      for (const u of updates) {
        if (!u) continue;
        if (u.status) lastStatus = u.status;
        if (u.processedAt) processedAt = u.processedAt;
        if (u.processedBy) processedBy = u.processedBy;
      }
      return { ...base, status: lastStatus, processedAt, processedBy };
    }

    const all = prescriptions.map(p => {
      const parsed = parseAdmissionFromNotes(p.notes || "");
      if (!parsed) return null;
      return {
        id: p.id,
        patientId: p.patientId,
        doctorId: p.doctorId,
        prescriptionId: p.id,
        wardType: parsed.wardType ?? null,
        bedType: parsed.bedType ?? null,
        urgency: parsed.urgency ?? "NORMAL",
        estimatedStay: parsed.estimatedStay ?? null,
        diagnosis: p.diagnosis || "",
        chiefComplaint: p.symptoms || "",
        notes: p.notes || "",
        status: parsed.status || "PENDING",
        requestedAt: parsed.requestedAt ? new Date(parsed.requestedAt) : p.createdAt,
        processedAt: parsed.processedAt ? new Date(parsed.processedAt) : null,
        processedBy: parsed.processedBy || null,
        patient: p.patient,
        doctor: p.doctor,
        createdAt: p.createdAt
      };
    }).filter(Boolean) as any[];

    const admissionRequests = status ? all.filter(r => r.status === status) : all;

    return NextResponse.json({
      admissionRequests,
      total: admissionRequests.length
    });

  } catch (error) {
    console.error("Error fetching admission requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch admission requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, ["DOCTOR", "ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const {
      patientId,
      prescriptionId,
      wardType,
      bedType,
      urgency = "NORMAL",
      estimatedStay,
      diagnosis,
      chiefComplaint,
      notes
    } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // For now, we'll store the admission request data in the prescription notes
    // This is temporary until we add the proper AdmissionRequest table
    const admissionData = {
      type: "IPD_ADMISSION_REQUEST",
      wardType,
      bedType,
      urgency,
      estimatedStay,
      diagnosis,
      chiefComplaint,
      requestNotes: notes,
      status: "PENDING",
      requestedAt: new Date().toISOString()
    };

    let prescription;
    if (prescriptionId) {
      // Get existing prescription first
      const existingPrescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId }
      });
      
      // Update existing prescription with admission request
      prescription = await prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          notes: `${existingPrescription?.notes || ""}\n\nIPD ADMISSION REQUEST: ${JSON.stringify(admissionData)}`
        }
      });
    } else {
      // Create new prescription with admission request
      prescription = await prisma.prescription.create({
        data: {
          patientId,
          doctorId: authResult.session.user.id,
          medicines: JSON.stringify({ medicines: [], labTests: [], therapies: [] }),
          notes: `IPD ADMISSION REQUEST: ${JSON.stringify(admissionData)}`,
          diagnosis: diagnosis || "",
          symptoms: chiefComplaint || ""
        }
      });
    }

    return NextResponse.json({
      message: "Admission request created successfully",
      admissionRequest: {
        id: prescription.id,
        patientId,
        status: "PENDING",
        createdAt: prescription.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating admission request:", error);
    return NextResponse.json(
      { error: "Failed to create admission request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN", "NURSE", "RECEPTIONIST"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { prescriptionId, status } = await request.json();
    if (!prescriptionId || !status) {
      return NextResponse.json({ error: "prescriptionId and status are required" }, { status: 400 });
    }
    if (!["APPROVED", "REJECTED", "CONVERTED", "AWAITING_DEPOSIT", "DEPOSIT_PAID"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Append an update line into notes so GET can compute latest status
    const existing = await prisma.prescription.findUnique({ where: { id: prescriptionId }, select: { notes: true } });
    const updateEntry = {
      status,
      processedAt: new Date().toISOString(),
      processedBy: { id: authResult.session.user.id, name: authResult.session.user.name, role: authResult.session.user.role }
    };

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        notes: `${existing?.notes || ""}\nIPD ADMISSION UPDATE: ${JSON.stringify(updateEntry)}`
      }
    });

    return NextResponse.json({ message: "Admission request updated" });
  } catch (e) {
    console.error("Error updating admission request:", e);
    return NextResponse.json({ error: "Failed to update admission request" }, { status: 500 });
  }
}
