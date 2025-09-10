import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const routinesDir = path.join(process.cwd(), "data", "doctor-routines");

function ensureDir() {
  if (!fs.existsSync(routinesDir)) fs.mkdirSync(routinesDir, { recursive: true });
}

function routinePath(doctorId: string) {
  ensureDir();
  return path.join(routinesDir, `${doctorId}.json`);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId") || session.user.id;

    if (!doctorId) return NextResponse.json({ error: "doctorId required" }, { status: 400 });

    const file = routinePath(doctorId);
    if (!fs.existsSync(file)) {
      return NextResponse.json({ routine: {} });
    }
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return NextResponse.json({ routine: data });
  } catch (e) {
    console.error("Failed to load routine", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const doctorId = body.doctorId || session.user.id;
    const routine = body.routine || {};

    // Allow only ADMIN or the doctor themselves
    if (session.user.role !== "ADMIN" && doctorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Basic validation: routine should be an object with weekday keys
    const validDays = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const isValid = Object.keys(routine).every((k) => validDays.includes(k));
    if (!isValid) return NextResponse.json({ error: "Invalid routine" }, { status: 400 });

    const file = routinePath(doctorId);
    fs.writeFileSync(file, JSON.stringify(routine, null, 2));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Failed to save routine", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

