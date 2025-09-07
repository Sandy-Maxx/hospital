const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    const d = new Date(todayStr)
    const sessions = await p.appointmentSession.findMany({
      where: { date: d },
      orderBy: [{ startTime: 'asc' }]
    })
    console.log('today', todayStr, 'sessions count', sessions.length)
    console.table(sessions.map(s => ({ id: s.id, name: s.name, shortCode: s.shortCode, date: s.date.toISOString().slice(0,10), startTime: s.startTime, endTime: s.endTime, currentTokens: s.currentTokens, isActive: s.isActive })))

    if (sessions.length) {
      const apps = await p.appointment.findMany({
        where: { sessionId: { in: sessions.map(s => s.id) } },
        select: { id: true, tokenNumber: true, status: true, sessionId: true }
      })
      console.log('appointments linked to sessions:', apps.length)
    }
  } catch (e) {
    console.error(e)
  } finally {
    await p.$disconnect()
  }
}

main()

