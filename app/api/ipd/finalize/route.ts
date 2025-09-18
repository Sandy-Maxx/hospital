import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

// POST /api/ipd/finalize
// body: { admissionId: string }
// Creates a final bill from ledger for the admission and returns the bill.
export async function POST(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "RECEPTIONIST"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { admissionId } = await request.json();
    if (!admissionId) return NextResponse.json({ error: 'admissionId required' }, { status: 400 });

    const admission = await prisma.admission.findUnique({ where: { id: admissionId }, include: { patient: true, bed: { include: { bedType: true } }, admittedByUser: true } });
    if (!admission) return NextResponse.json({ error: 'Admission not found' }, { status: 404 });

    // Sum ledger entries
    const txns = await prisma.billingTransaction.findMany({ where: { admissionId } });
    let totalCharges = 0, totalDeposits = 0, totalPayments = 0, totalRefunds = 0, totalAdjustments = 0;
    for (const t of txns) {
      const amt = Number(t.amount || 0);
      switch ((t.type || '').toUpperCase()) {
        case 'CHARGE': totalCharges += amt; break;
        case 'DEPOSIT': totalDeposits += amt; break;
        case 'PAYMENT': totalPayments += amt; break;
        case 'REFUND': totalRefunds += amt; break;
        case 'ADJUSTMENT': totalAdjustments += amt; break;
      }
    }
    const netDue = Math.max(0, totalCharges - (totalDeposits + totalPayments) + totalRefunds - totalAdjustments);

    // Create a final bill with a single item representing net charges for the admission.
    // Note: We do not include deposits as items; they are accounted for in netDue.
    const billNumber = `FINAL-${Date.now()}`;
    const bill = await prisma.bill.create({
      data: {
        billNumber,
        patientId: admission.patientId,
        doctorId: admission.admittedBy,
        consultationFee: 0,
        totalAmount: totalCharges,
        cgst: 0,
        sgst: 0,
        discountAmount: 0,
        finalAmount: totalCharges,
        paymentStatus: netDue === 0 ? 'PAID' : 'PENDING',
        paidAmount: totalDeposits + totalPayments, // what has already been paid/deposited
        balanceAmount: netDue,
        notes: `Final bill for admission ${admissionId}`,
        createdBy: auth.session.user.id || 'SYSTEM',
      },
    });

    await prisma.billItem.create({
      data: {
        billId: bill.id,
        itemType: 'OTHER',
        itemName: 'IPD Admission Charges (ledger summary)',
        quantity: 1,
        unitPrice: totalCharges,
        totalPrice: totalCharges,
        gstRate: 0,
      },
    });

    return NextResponse.json({ bill });
  } catch (e) {
    console.error('POST /api/ipd/finalize failed', e);
    return NextResponse.json({ error: 'Failed to finalize' }, { status: 500 });
  }
}

