import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status"); // ACTIVE, DISCHARGED

    const where: any = {};
    if (id) where.id = id;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, gender: true } },
        bed: { include: { ward: true, bedType: true } },
        admittedByUser: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (id) {
      const admission = admissions[0];
      if (!admission) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ admission });
    }

    return NextResponse.json({ admissions });
  } catch (e) {
    console.error("GET /api/ipd/admissions failed", e);
    return NextResponse.json({ error: "Failed to fetch admissions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { patientId, bedId, doctorId, diagnosis, chiefComplaint, estimatedStay } = await request.json();
    if (!patientId || !bedId || !doctorId) {
      return NextResponse.json({ error: "patientId, bedId, doctorId required" }, { status: 400 });
    }

    // Ensure bed exists and is available
    const bed = await prisma.bed.findUnique({ where: { id: bedId }, include: { bedType: true, ward: true } });
    if (!bed) return NextResponse.json({ error: "Invalid bed" }, { status: 400 });

    // Create admission
    const admission = await prisma.admission.create({
      data: {
        patientId,
        bedId,
        admittedBy: doctorId,
        diagnosis: diagnosis || null,
        chiefComplaint: chiefComplaint || null,
        estimatedStay: estimatedStay ? Number(estimatedStay) : null,
        status: "ACTIVE",
      },
      include: {
        bed: { include: { ward: true, bedType: true } },
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        admittedByUser: { select: { id: true, name: true, role: true } },
      },
    });

    // Set bed as occupied
    await prisma.bed.update({ where: { id: bedId }, data: { status: "OCCUPIED" } });

    return NextResponse.json({ admission });
  } catch (e) {
    console.error("POST /api/ipd/admissions failed", e);
    return NextResponse.json({ error: "Failed to create admission" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "NURSE", "RECEPTIONIST", "DOCTOR"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id, status, dischargeNotes } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

    if (status === "DISCHARGED") {
      // Set discharge date and free the bed
      const adm = await prisma.admission.findUnique({ where: { id }, include: { bed: true } });
      if (!adm) return NextResponse.json({ error: "Not found" }, { status: 404 });

      await prisma.admission.update({ where: { id }, data: { status, dischargeDate: new Date(), dischargeNotes: dischargeNotes || null } });
      await prisma.bed.update({ where: { id: adm.bedId }, data: { status: "AVAILABLE" } });
      return NextResponse.json({ message: "Discharged" });
    }

    const upd = await prisma.admission.update({ where: { id }, data: { status } });
    return NextResponse.json({ admission: upd });
  } catch (e) {
    console.error("PUT /api/ipd/admissions failed", e);
    return NextResponse.json({ error: "Failed to update admission" }, { status: 500 });
  }
}

