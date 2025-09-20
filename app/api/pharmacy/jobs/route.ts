import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const statePath = path.join(process.cwd(), "data", "pharmacy-states.json");
function ensureState() {
  const dir = path.dirname(statePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(statePath)) fs.writeFileSync(statePath, "{}");
}
function loadStates(): Record<string, any> {
  ensureState();
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}
function keyOf(prescriptionId: string, medName: string) {
  return `${prescriptionId}::${medName.toLowerCase().replace(/\s+/g, "_")}`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bills = await prisma.bill.findMany({
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      doctor: { select: { id: true, name: true } },
      prescription: { select: { id: true, createdAt: true, medicines: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const states = loadStates();
  const jobs: any[] = [];
  for (const b of bills) {
    const pres = b.prescription as any;
    if (!pres) continue;
    let meds: any = {};
    try { meds = pres.medicines ? JSON.parse(pres.medicines) : {}; } catch {}
    const medList = Array.isArray(meds.medicines) ? meds.medicines : [];
    for (const m of medList) {
      const name = typeof m === 'string' ? m : (m.name || '');
      if (!name) continue;
      const id = keyOf(pres.id, name);
      const st = states[id] || {};
      // Show if bill is PAID or explicitly dispatched
      if (b.paymentStatus !== "PAID" && !st.dispatched) continue;
      jobs.push({
        id,
        billId: b.id,
        prescriptionId: pres.id,
        prescriptionCreatedAt: pres.createdAt,
        patient: b.patient,
        doctor: b.doctor,
        medicine: { name, quantity: (typeof m === 'object' ? (m.quantity || 1) : 1) },
        dispensed: !!st.dispensed,
        dispatched: !!st.dispatched,
        notes: st.notes || "",
      });
    }
  }

  return NextResponse.json({ jobs });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, dispensed, notes } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  ensureState();
  const states = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const prev = states[id] || {};
  states[id] = { ...prev, ...(dispensed !== undefined ? { dispensed } : {}), ...(notes !== undefined ? { notes } : {}) };
  fs.writeFileSync(statePath, JSON.stringify(states, null, 2), "utf8");

  // Optional: post pharmacy ledger CHARGE on first dispense
  try {
    if (dispensed && !prev.dispensed) {
      // id format: prescriptionId::medicine_key
      const [prescriptionId, medKey] = String(id).split("::");
      const medName = (medKey || '').replace(/_/g, ' ');
      if (prescriptionId) {
        const bills = await prisma.bill.findMany({ where: { prescriptionId } });
        if (bills.length) {
          const patientId = bills[0].patientId;
          const adm = await prisma.admission.findFirst({ where: { patientId, status: 'ACTIVE' } });
          if (adm) {
            // Avoid duplicate posting
            const ref = `PHARMACY_DISPENSE:${id}`;
            const existing = await prisma.billingTransaction.findFirst({ where: { admissionId: adm.id, reference: ref } });
            if (!existing) {
              // Try to lookup medicine selling price by name or brand
              const med = await prisma.medicine.findFirst({ where: { OR: [ { name: { equals: medName, mode: 'insensitive' } }, { brand: { equals: medName, mode: 'insensitive' } } ] } });
              // Quantity is not directly stored in state, attempt to read from bill prescription JSON
              let qty = 1;
              try {
                const pres = await prisma.prescription.findUnique({ where: { id: prescriptionId } });
                const obj: any = pres?.medicines ? JSON.parse(pres.medicines as any) : {};
                const meds = Array.isArray(obj?.medicines) ? obj.medicines : [];
                const match = meds.find((m: any) => (m?.name || '').toLowerCase() === medName.toLowerCase());
                if (match?.quantity) qty = Number(match.quantity) || 1;
              } catch {}
              const unit = Number(med?.mrp ?? med?.purchasePrice ?? 0);
              const amount = Number(unit) * qty;
              await prisma.billingTransaction.create({
                data: {
                  admissionId: adm.id,
                  billId: null,
                  patientId,
                  type: 'CHARGE',
                  amount: amount,
                  description: `PHARMACY: ${medName} x ${qty}${unit ? ` @ ₹${unit}` : ''}`.slice(0, 250),
                  reference: ref,
                  paymentMethod: null,
                  paymentStatus: 'COMPLETED',
                  processedBy: (session.user as any).id || 'SYSTEM',
                  processedAt: new Date(),
                },
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Failed to post pharmacy ledger CHARGE on dispense:', e);
  }

  return NextResponse.json({ success: true });
}
