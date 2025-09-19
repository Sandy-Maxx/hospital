import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import fs from "fs";
import path from "path";

// Base directory for storing admission attachments
const baseDir = path.join(process.cwd(), "public", "uploads", "admissions");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function sanitize(name: string) {
  return name.replace(/[^a-z0-9\-_\.]/gi, "_");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") || "").toLowerCase(); // optional: "ot" | "imaging"

    const admissionDir = path.join(baseDir, params.id);
    const categories = category ? [category] : ["ot", "imaging"]; // list both if not specified

    const items: Array<{ name: string; url: string; category: string }> = [];

    for (const cat of categories) {
      const dir = path.join(admissionDir, cat);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        items.push({ name: file, url: `/uploads/admissions/${params.id}/${cat}/${file}`, category: cat });
      }
    }

    return NextResponse.json({ attachments: items });
  } catch (e) {
    console.error("GET /api/ipd/admissions/[id]/attachments failed", e);
    return NextResponse.json({ error: "Failed to list attachments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const categoryRaw = (form.get("category") as string | null) || "";
    const category = ["ot", "imaging"].includes(categoryRaw.toLowerCase())
      ? categoryRaw.toLowerCase()
      : "misc";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = new Set([
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ]);
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF and images are allowed." }, { status: 400 });
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = (file.name.split(".").pop() || "dat").toLowerCase();
    const filename = `${Date.now()}-${sanitize(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;

    const destDir = path.join(baseDir, params.id, category);
    ensureDir(destDir);
    const destPath = path.join(destDir, filename);

    fs.writeFileSync(destPath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/admissions/${params.id}/${category}/${filename}`,
      filename,
      category,
    });
  } catch (e) {
    console.error("POST /api/ipd/admissions/[id]/attachments failed", e);
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 });
  }
}
