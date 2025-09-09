import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "audit-logs.json");

function ensure() {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]", "utf8");
}

function readAll(): any[] {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return [];
  }
}

function writeAll(list: any[]) {
  ensure();
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf8");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("targetUserId");
  const actorId = searchParams.get("actorId");
  const list = readAll();
  const filtered = list
    .filter(
      (l: any) =>
        (!targetUserId || l.targetUserId === targetUserId) &&
        (!actorId || l.actorId === actorId),
    )
    .sort(
      (a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  return NextResponse.json({ logs: filtered });
}
