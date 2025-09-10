import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/authz";
import { broadcast } from "@/lib/sse";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
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
        doctor: {
          select: { id: true, name: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
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
    const auth = await withAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = params;
    const body = await request.json();

    const data: any = {};
    if (typeof body.status === "string") data.status = body.status;
    if (typeof body.doctorId === "string") data.doctorId = body.doctorId;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No supported fields to update" },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
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
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    try { broadcast('queue-update', { id: appointment.id, status: appointment.status }); } catch {}
    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
