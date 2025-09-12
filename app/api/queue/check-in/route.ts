import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/sse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokenNumber = (body?.tokenNumber || "").toString().trim();
    const doctorId = (body?.doctorId || "").toString().trim();

    if (!tokenNumber || !doctorId) {
      return NextResponse.json(
        { success: false, error: "Missing tokenNumber or doctorId" },
        { status: 400 },
      );
    }

    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 2);

    const appointment = await prisma.appointment.findFirst({
      where: {
        tokenNumber,
        doctorId,
        dateTime: { gte: windowStart, lt: windowEnd },
        status: { in: ["SCHEDULED", "ARRIVED", "WAITING", "IN_CONSULTATION"] },
      },
      include: { session: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found for this doctor/token" },
        { status: 404 },
      );
    }

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        atDoor: { set: true },
        atDoorAt: { set: new Date() },
      } as any,
    });

    const sameQueue = await prisma.appointment.findMany({
      where: {
        doctorId,
        sessionId: appointment.sessionId,
        status: { in: ["SCHEDULED", "ARRIVED", "WAITING", "IN_CONSULTATION"] },
      },
      orderBy: [{ tokenNumber: "asc" }],
    });

    const atDoorList = sameQueue.filter((a: any) => (a as any).atDoor);
    const notDoorList = sameQueue.filter((a: any) => !(a as any).atDoor);
    const ordered = [...atDoorList, ...notDoorList];
    const position = Math.max(1, ordered.findIndex((a) => a.id === appointment.id) + 1);

    try {
      broadcast("queue-update", { id: appointment.id, atDoor: true });
    } catch {}

    return NextResponse.json({ success: true, queuePosition: position });
  } catch (error) {
    console.error("Door check-in error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

