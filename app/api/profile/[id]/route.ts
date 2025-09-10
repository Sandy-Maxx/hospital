import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseDir = path.join(process.cwd(), "data", "user-profiles");

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const id = params.id;
  
  try {
    // First try to get user from database
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    if (user) {
      // Start with database user data
      let profileData = {
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        fullName: user.name || '',
        email: user.email,
        role: user.role,
        department: user.department || '',
        specialization: user.specialization || '',
        phone: '',
        bio: '',
        profileImage: '',
        experience: [],
        availability: {},
        qualifications: [],
        designation: {},
      };
      
      // Try to merge with file system data if available
      const file = path.join(baseDir, `${id}.json`);
      if (fs.existsSync(file)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(file, "utf8"));
          profileData = { ...profileData, ...fileData };
          // Ensure database data takes precedence for key fields
          profileData.fullName = user.name || profileData.fullName;
          profileData.email = user.email;
          profileData.role = user.role;
          profileData.department = user.department || profileData.department;
          profileData.specialization = user.specialization || profileData.specialization;
        } catch (error) {
          console.warn('Failed to parse file profile data:', error);
        }
      }
      
      return NextResponse.json(profileData);
    }
    
    // Fallback to file system if user not found in database
    const file = path.join(baseDir, `${id}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      return NextResponse.json(data);
    }
    
    return NextResponse.json({});
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = params.id;
  const body = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const dir = baseDir;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(baseDir, `${id}.json`);
  const before = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : {};
  fs.writeFileSync(file, JSON.stringify(body, null, 2), "utf8");
  // audit
  try {
    const afile = path.join(process.cwd(), "data", "audit-logs.json");
    const adir = path.dirname(afile);
    if (!fs.existsSync(adir)) fs.mkdirSync(adir, { recursive: true });
    const list = fs.existsSync(afile)
      ? JSON.parse(fs.readFileSync(afile, "utf8"))
      : [];
    const changedKeys = Array.from(
      new Set([...Object.keys(before || {}), ...Object.keys(body || {})]),
    ).filter((k) => JSON.stringify(before?.[k]) !== JSON.stringify(body?.[k]));
    list.push({
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      actorId: session.user.id,
      targetUserId: id,
      action: "PROFILE_UPDATE",
      changedKeys,
      at: new Date().toISOString(),
    });
    fs.writeFileSync(afile, JSON.stringify(list, null, 2), "utf8");
  } catch {}
  return NextResponse.json({ success: true });
}
