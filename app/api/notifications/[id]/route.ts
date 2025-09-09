import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "notifications.json");

function readAll() {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeAll(list: any[]) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf8");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  const body = await request.json().catch(() => ({}));
  const { isRead } = body || {};
  const all = readAll();
  const idx = all.findIndex((n: any) => n.id === id);
  if (idx === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  all[idx].isRead = typeof isRead === "boolean" ? isRead : true;
  writeAll(all);
  return NextResponse.json(all[idx]);
}
