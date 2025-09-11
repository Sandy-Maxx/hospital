import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const settingsPath = path.join(process.cwd(), "data", "hospital-settings.json");
const departmentsPath = path.join(process.cwd(), "data", "departments.json");

function readSettings(): any {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {
    return {};
  }
}

function readDepartmentsList(): string[] {
  try {
    const raw = fs.readFileSync(departmentsPath, "utf8");
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr.map((d: any) => (typeof d === 'string' ? d : d?.name)).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

function writeSettings(s: any) {
  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2), "utf8");
}

let __lookups_cache: { data: any; at: number } | null = null;
const LOOKUPS_TTL_MS = 60_000;

export async function GET() {
  const now = Date.now();
  if (__lookups_cache && now - __lookups_cache.at < LOOKUPS_TTL_MS) {
    return NextResponse.json(__lookups_cache.data);
  }
  const s = readSettings();
  // ensure arrays
  const deptFromFile = readDepartmentsList();
  if (!Array.isArray(s.designations)) s.designations = [];
  const resp = {
    departments: deptFromFile,
    designations: s.designations,
  };
  __lookups_cache = { data: resp, at: now };
  return NextResponse.json(resp);
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
