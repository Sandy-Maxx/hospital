import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const departmentsPath = path.join(process.cwd(), "data", "departments.json");

function readDepartments() {
  try {
    const raw = fs.readFileSync(departmentsPath, "utf8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeDepartments(list: any[]) {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(departmentsPath, JSON.stringify(list, null, 2));
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const items = readDepartments();
    const idx = items.findIndex((d: any) => d.id === id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const allowed = ["name", "code", "isActive", "sortOrder", "color", "icon"];
    const updated = { ...items[idx] };
    for (const key of allowed) {
      if (key in body) (updated as any)[key] = body[key];
    }
    updated.updatedAt = new Date().toISOString();
    items[idx] = updated;
    writeDepartments(items);
    return NextResponse.json({ success: true, department: updated });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const items = readDepartments();
    const idx = items.findIndex((d: any) => d.id === id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    items.splice(idx, 1);
    writeDepartments(items);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
