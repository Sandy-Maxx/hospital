import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const availabilityDir = path.join(process.cwd(), "data", "availability");

if (!fs.existsSync(availabilityDir)) {
  fs.mkdirSync(availabilityDir, { recursive: true });
}

export interface AvailabilityRule {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
  breakStart?: string; // "12:00"
  breakEnd?: string; // "13:00"
  maxAppointments?: number;
  specialNotes?: string;
  createdAt: string;
  updatedAt: string;
}

function getAvailabilityFilePath(userId: string) {
  return path.join(availabilityDir, `${userId}.json`);
}

function loadAvailability(userId: string): AvailabilityRule[] {
  const filePath = getAvailabilityFilePath(userId);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

function saveAvailability(userId: string, availability: AvailabilityRule[]) {
  const filePath = getAvailabilityFilePath(userId);
  fs.writeFileSync(filePath, JSON.stringify(availability, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");
    const isAdmin = (session.user as any)?.role === "ADMIN";
    
    const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;
    const availability = loadAvailability(userId);

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { availability, userId: targetUserId } = body;
    const isAdmin = (session.user as any)?.role === "ADMIN";
    
    const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;

    // Validate availability data
    if (!Array.isArray(availability)) {
      return NextResponse.json(
        { error: "Invalid availability data" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const processedAvailability: AvailabilityRule[] = availability.map((rule: any, index: number) => ({
      id: rule.id || `${userId}-${rule.dayOfWeek}-${Date.now()}-${index}`,
      userId,
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      isAvailable: rule.isAvailable,
      breakStart: rule.breakStart,
      breakEnd: rule.breakEnd,
      maxAppointments: rule.maxAppointments,
      specialNotes: rule.specialNotes,
      createdAt: rule.createdAt || now,
      updatedAt: now,
    }));

    saveAvailability(userId, processedAvailability);

    return NextResponse.json({ success: true, availability: processedAvailability });
  } catch (error) {
    console.error("Error saving availability:", error);
    return NextResponse.json(
      { error: "Failed to save availability" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("ruleId");
    const targetUserId = searchParams.get("userId");
    const isAdmin = (session.user as any)?.role === "ADMIN";
    
    const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;

    if (!ruleId) {
      return NextResponse.json(
        { error: "Rule ID is required" },
        { status: 400 }
      );
    }

    const availability = loadAvailability(userId);
    const filteredAvailability = availability.filter(rule => rule.id !== ruleId);
    
    saveAvailability(userId, filteredAvailability);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting availability rule:", error);
    return NextResponse.json(
      { error: "Failed to delete availability rule" },
      { status: 500 }
    );
  }
}
