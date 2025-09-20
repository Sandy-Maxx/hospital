import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

// GET /api/ot/requests
export async function GET(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const admissionId = searchParams.get("admissionId");
    const patientId = searchParams.get("patientId");
    const from = searchParams.get("from"); // ISO date
    const to = searchParams.get("to");     // ISO date

    const where: any = {};
    if (status) where.status = status;
    if (admissionId) where.admissionId = admissionId;
    if (patientId) where.patientId = patientId;

    // Date range filters: if status=DONE, filter on performedAt; otherwise on createdAt
    if (from || to) {
      const range: any = {};
      if (from) range.gte = new Date(from);
      if (to) range.lte = new Date(to);
      if (status === 'DONE') {
        where.performedAt = range;
      } else {
        where.createdAt = range;
      }
    }

    const requests = await prisma.otRequest.findMany({
      where,
      orderBy: status === 'DONE' ? { performedAt: "desc" } : { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (e) {
    console.error("GET /api/ot/requests failed", e);
    return NextResponse.json({ error: "Failed to fetch OT requests" }, { status: 500 });
  }
}

// POST /api/ot/requests
export async function POST(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const { admissionId, patientId, doctorId, procedureId, customName, priority, notes, requestedBasePrice } = body;
    if (!admissionId || !patientId || !doctorId) {
      return NextResponse.json({ error: "admissionId, patientId, doctorId required" }, { status: 400 });
    }
    if (!procedureId && !customName) {
      return NextResponse.json({ error: "procedureId or customName required" }, { status: 400 });
    }

    const rec = await prisma.otRequest.create({
      data: {
        admissionId,
        patientId,
        doctorId,
        procedureId: procedureId || null,
        customName: customName || null,
        priority: priority || null,
        notes: notes || null,
        requestedBasePrice: procedureId ? null : (requestedBasePrice ? Number(requestedBasePrice) : null),
        status: "PENDING",
      },
    });
    return NextResponse.json({ request: rec }, { status: 201 });
  } catch (e) {
    console.error("POST /api/ot/requests failed", e);
    return NextResponse.json({ error: "Failed to create OT request" }, { status: 500 });
  }
}

// PUT /api/ot/requests
export async function PUT(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id, status, scheduledAt, notes } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const data: any = {};
    if (status) data.status = status;
    if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
    if (notes !== undefined) data.notes = notes;

    const upd = await prisma.otRequest.update({ where: { id }, data });
    return NextResponse.json({ request: upd });
  } catch (e) {
    console.error("PUT /api/ot/requests failed", e);
    return NextResponse.json({ error: "Failed to update OT request" }, { status: 500 });
  }
}
