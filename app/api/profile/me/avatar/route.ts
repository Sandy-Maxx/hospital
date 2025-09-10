import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "public", "uploads", "users");

function ensureUserDir(userId: string) {
  const dir = path.join(uploadDir, userId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function saveDataUrl(filePath: string, dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error("Invalid dataUrl");
  const buffer = Buffer.from(match[2], "base64");
  fs.writeFileSync(filePath, buffer);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");
  const isAdmin = (session.user as any)?.role === "ADMIN";
  const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;
  
  const filePath = path.join(uploadDir, userId, "avatar.png");
  
  if (fs.existsSync(filePath)) {
    return NextResponse.json({
      avatarUrl: `/uploads/users/${userId}/avatar.png?t=${Date.now()}`,
    });
  }
  
  return NextResponse.json({ avatarUrl: null });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const dataUrl = body?.dataUrl as string;
  const targetUserId =
    (session.user as any).role === "ADMIN" && body?.userId
      ? String(body.userId)
      : session.user.id;
  const dir = ensureUserDir(targetUserId);
  const filePath = path.join(dir, "avatar.png");
  saveDataUrl(filePath, dataUrl);
  return NextResponse.json({
    avatarUrl: `/uploads/users/${targetUserId}/avatar.png?t=${Date.now()}`,
  });
}
