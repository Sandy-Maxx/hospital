import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23,59,59,999);
  return x;
}

// POST /api/ipd/ledger/bed-charge
// body?: { admissionId?: string }
// If admissionId provided, posts today's bed charge for that admission.
// Else, posts for all ACTIVE admissions.
export async function POST(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "NURSE", "RECEPTIONIST"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const session = auth.session;
    const body = await request.json().catch(() => ({}));
    const { admissionId } = body || {};

    const today = new Date();
    const gte = startOfDay(today);
    const lt = endOfDay(today);

    const admissions = admissionId
      ? await prisma.admission.findMany({ where: { id: admissionId, status: "ACTIVE" }, include: { bed: { include: { bedType: true } }, patient: true } })
      : await prisma.admission.findMany({ where: { status: "ACTIVE" }, include: { bed: { include: { bedType: true } }, patient: true } });

    const results: Array<{ admissionId: string; posted: boolean; amount: number }> = [];

    for (const adm of admissions) {
      const rate = Number(adm.bed?.bedType?.dailyRate || 0);
      // Skip if no rate defined
      if (rate <= 0) { results.push({ admissionId: adm.id, posted: false, amount: 0 }); continue; }

      // Check if already posted today
      const existing = await prisma.billingTransaction.findFirst({
        where: {
          admissionId: adm.id,
          type: 'CHARGE',
          description: { contains: 'BED_DAILY' },
          processedAt: { gte, lte: lt },
        },
      });
      if (existing) { results.push({ admissionId: adm.id, posted: false, amount: 0 }); continue; }

      await prisma.billingTransaction.create({
        data: {
          admissionId: adm.id,
          billId: null,
          patientId: adm.patientId,
          type: 'CHARGE',
          amount: rate,
          description: `BED_DAILY ${today.toISOString().slice(0,10)} @ ₹${rate}`,
          reference: 'AUTO:BED_DAILY',
          paymentMethod: null,
          paymentStatus: 'COMPLETED',
          processedBy: session.user.id || 'SYSTEM',
          processedAt: new Date(),
        }
      });

      results.push({ admissionId: adm.id, posted: true, amount: rate });
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error('POST /api/ipd/ledger/bed-charge failed', e);
    return NextResponse.json({ error: 'Failed to post bed charges' }, { status: 500 });
  }
}

