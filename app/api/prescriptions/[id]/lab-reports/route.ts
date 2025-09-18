import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const baseDir = path.join(process.cwd(), "public", "uploads", "reports");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function sanitize(name: string) {
  return name.replace(/[^a-z0-9\-_\.]/gi, "_");
}
function saveDataUrl(filePath: string, dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error("Invalid dataUrl");
  const buffer = Buffer.from(match[2], "base64");
  fs.writeFileSync(filePath, buffer);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dir = path.join(baseDir, params.id);
  const items: any[] = [];
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      items.push({ name: f, url: `/uploads/reports/${params.id}/${f}` });
    }
  }
  return NextResponse.json({ reports: items });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Allow ADMIN, DOCTOR, and NURSE to upload
  if (!["ADMIN", "DOCTOR", "NURSE"].includes((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { testName, dataUrl, fileName } = body;
  if (!dataUrl)
    return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
  const dir = path.join(baseDir, params.id);
  ensureDir(dir);
  const safeName = sanitize(
    fileName || `${sanitize(testName || "report")}-${Date.now()}.pdf`,
  );
  const target = path.join(dir, safeName);
  saveDataUrl(target, dataUrl);
  // If this prescription is linked to an active IPD admission, post a CHARGE to the ledger for LAB report
  try {
    // find a paid bill for this prescription to get patient and doctor info
    const { prisma } = await import("@/lib/prisma");
    const bills = await prisma.bill.findMany({ where: { prescriptionId: params.id } });
    // Find an active admission for the bill's patient
    if (bills.length) {
      const patientId = bills[0].patientId;
      const adm = await prisma.admission.findFirst({ where: { patientId, status: 'ACTIVE' } });
      if (adm) {
        await prisma.billingTransaction.create({
          data: {
            admissionId: adm.id,
            billId: null,
            patientId: patientId,
            type: 'CHARGE',
            amount: 0, // zero by default; pricing can be set elsewhere
            description: `LAB: ${testName || safeName}`,
            reference: `LAB_REPORT:${safeName}`,
            paymentMethod: null,
            paymentStatus: 'COMPLETED',
            processedBy: (session.user as any).id || 'SYSTEM',
            processedAt: new Date(),
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed to post lab ledger CHARGE:', e);
  }
  return NextResponse.json({
    success: true,
    url: `/uploads/reports/${params.id}/${safeName}`,
  });
}
