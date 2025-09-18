import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

// GET /api/ipd/ledger?admissionId=...
// Returns transactions and summary totals for an admission
export async function GET(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const admissionId = searchParams.get("admissionId");
    if (!admissionId) return NextResponse.json({ error: "admissionId is required" }, { status: 400 });

    const [admission, txns] = await Promise.all([
      prisma.admission.findUnique({ where: { id: admissionId }, include: { bed: { include: { bedType: true, ward: true } }, patient: true, admittedByUser: true } }),
      prisma.billingTransaction.findMany({ where: { admissionId }, orderBy: { processedAt: "asc" } }),
    ]);

    if (!admission) return NextResponse.json({ error: "Admission not found" }, { status: 404 });

    let totalCharges = 0;
    let totalDeposits = 0;
    let totalPayments = 0;
    let totalRefunds = 0;
    let totalAdjustments = 0;

    for (const t of txns) {
      const amt = Number(t.amount || 0);
      switch ((t.type || '').toUpperCase()) {
        case 'CHARGE': totalCharges += amt; break;
        case 'DEPOSIT': totalDeposits += amt; break;
        case 'PAYMENT': totalPayments += amt; break;
        case 'REFUND': totalRefunds += amt; break;
        case 'ADJUSTMENT': totalAdjustments += amt; break;
        default: break;
      }
    }

    const summary = {
      totalCharges,
      totalDeposits,
      totalPayments,
      totalRefunds,
      totalAdjustments,
      netDue: Math.max(0, totalCharges - (totalDeposits + totalPayments) + totalRefunds - totalAdjustments),
    };

    return NextResponse.json({ admission, transactions: txns, summary });
  } catch (e) {
    console.error('GET /api/ipd/ledger failed', e);
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 });
  }
}

// POST /api/ipd/ledger - Add a transaction to ledger
// body: { admissionId, patientId, type: 'CHARGE'|'DEPOSIT'|'PAYMENT'|'REFUND'|'ADJUSTMENT', amount, description?, reference?, paymentMethod? }
export async function POST(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const session = auth.session;
    const body = await request.json();
    const { admissionId, patientId, type, amount, description, reference, paymentMethod } = body || {};

    if (!admissionId || !type || typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json({ error: 'admissionId, type, amount are required' }, { status: 400 });
    }

    // Verify admission exists
    const adm = await prisma.admission.findUnique({ where: { id: admissionId } });
    if (!adm) return NextResponse.json({ error: 'Admission not found' }, { status: 404 });

    const pid = patientId || adm.patientId;
    if (!pid) return NextResponse.json({ error: 'patientId is required' }, { status: 400 });

    const txn = await prisma.billingTransaction.create({
      data: {
        admissionId,
        billId: null,
        patientId: pid,
        type: String(type).toUpperCase(),
        amount: Number(amount),
        description: description || null,
        reference: reference || null,
        paymentMethod: paymentMethod || null,
        paymentStatus: 'COMPLETED',
        processedBy: session.user.id || 'SYSTEM',
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ transaction: txn }, { status: 201 });
  } catch (e) {
    console.error('POST /api/ipd/ledger failed', e);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

