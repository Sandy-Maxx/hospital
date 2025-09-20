/*
  Seed only new IPD request features so you can visually inspect queues and report.
  Usage: node scripts/seed-ipd-requests.js
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find an ACTIVE admission to attach requests to
  const admission = await prisma.admission.findFirst({ where: { status: 'ACTIVE' }, include: { patient: true, admittedByUser: true } });
  if (!admission) {
    console.log('No ACTIVE admissions found. Create an admission first.');
    return;
  }

  // Pick any existing OT/Imaging procedures if present
  const otProc = await prisma.oTProcedure.findFirst({ where: { isActive: true } });
  const imProc = await prisma.imagingProcedure.findFirst({ where: { isActive: true } });

  // Create one OT request
  const ot = await prisma.otRequest.create({
    data: {
      admissionId: admission.id,
      patientId: admission.patientId,
      doctorId: admission.admittedBy,
      procedureId: otProc ? otProc.id : null,
      customName: otProc ? null : 'Demo Appendectomy',
      requestedBasePrice: otProc ? null : 5000,
      priority: 'NORMAL',
      notes: 'Seeded demo OT request',
      status: 'PENDING',
    },
  });

  // Create one Imaging request
  const im = await prisma.imagingRequest.create({
    data: {
      admissionId: admission.id,
      patientId: admission.patientId,
      doctorId: admission.admittedBy,
      procedureId: imProc ? imProc.id : null,
      customName: imProc ? null : 'Demo Chest X-Ray',
      requestedBasePrice: imProc ? null : 600,
      priority: 'NORMAL',
      notes: 'Seeded demo Imaging request',
      status: 'PENDING',
    },
  });

  console.log('Seeded OT request:', ot.id);
  console.log('Seeded Imaging request:', im.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
