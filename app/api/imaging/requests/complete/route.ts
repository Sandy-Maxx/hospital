import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

async function postLedgerBase(admissionId: string, patientId: string, amount: number, description: string, reference: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ipd/ledger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admissionId, patientId, type: 'CHARGE', amount, description, reference })
  });
  return res;
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id, performedById } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const reqRec = await prisma.imagingRequest.findUnique({ where: { id } });
    if (!reqRec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (reqRec.status === 'DONE' || reqRec.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    let base = 0;
    let code = 'CUSTOM';
    let name = reqRec.customName || 'Custom';
    if (reqRec.procedureId) {
      const proc = await prisma.imagingProcedure.findUnique({ where: { id: reqRec.procedureId } });
      if (!proc) return NextResponse.json({ error: 'Procedure missing' }, { status: 400 });
      base = Number(proc.price || 0);
      code = proc.code || 'NA';
      name = proc.name;
    } else {
      if (!reqRec.requestedBasePrice || reqRec.requestedBasePrice <= 0) {
        return NextResponse.json({ error: 'requestedBasePrice required for custom' }, { status: 400 });
      }
      base = Number(reqRec.requestedBasePrice);
    }

    const ledger = await postLedgerBase(reqRec.admissionId, reqRec.patientId, base, `Imaging Base - ${name}`, `IMAGING:${code}:BASE`);
    if (!ledger.ok) {
      const err = await ledger.json().catch(()=>({}));
      return NextResponse.json({ error: err.error || 'Ledger post failed' }, { status: 500 });
    }

    const upd = await prisma.imagingRequest.update({
      where: { id },
      data: { status: 'DONE', performedAt: new Date(), performedById: performedById || null, basePriceUsed: base },
    });

    return NextResponse.json({ request: upd });
  } catch (e) {
    console.error('POST /api/imaging/requests/complete failed', e);
    return NextResponse.json({ error: 'Failed to complete request' }, { status: 500 });
  }
}
