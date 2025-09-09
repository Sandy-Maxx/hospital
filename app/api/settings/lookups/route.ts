import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "hospital-settings.json");

function readSettings(): any {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function writeSettings(s: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(s, null, 2), "utf8");
}

export async function GET() {
  const s = readSettings();
  // ensure arrays
  if (!Array.isArray(s.departments)) s.departments = [];
  if (!Array.isArray(s.designations)) s.designations = [];
  return NextResponse.json({
    departments: s.departments,
    designations: s.designations,
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const s = readSettings();
    if (Array.isArray(body.departments)) s.departments = body.departments;
    if (Array.isArray(body.designations)) s.designations = body.designations;
    writeSettings(s);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
