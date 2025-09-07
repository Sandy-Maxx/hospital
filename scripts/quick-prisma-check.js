const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  try {
    const bills = await p.bill.findMany({
      take: 1,
      include: { patient: { select: { firstName: true, lastName: true, phone: true } } }
    })
    console.log('bills sample:', bills)

    const prescriptions = await p.prescription.findMany({
      take: 1,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        doctor: { select: { id: true, name: true, department: true, specialization: true } },
        consultation: { include: { appointment: { select: { id: true, tokenNumber: true, type: true } } } }
      }
    })
    console.log('prescriptions sample:', prescriptions)
  } catch (e) {
    console.error('Query error:', e)
  } finally {
    await p.$disconnect()
  }
}

main()

