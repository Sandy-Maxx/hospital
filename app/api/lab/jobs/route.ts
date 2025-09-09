import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

const statePath = path.join(process.cwd(), 'data', 'lab-states.json')
function ensureState() { const dir = path.dirname(statePath); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); if (!fs.existsSync(statePath)) fs.writeFileSync(statePath, '{}') }
function loadStates(): Record<string, any> { ensureState(); try { return JSON.parse(fs.readFileSync(statePath, 'utf8')) } catch { return {} } }
function saveStates(m: Record<string, any>) { ensureState(); fs.writeFileSync(statePath, JSON.stringify(m, null, 2), 'utf8') }
function keyOf(prescriptionId: string, testName: string) { return `${prescriptionId}::${testName.toLowerCase().replace(/\s+/g,'_')}` }

function inferSampleNeeded(name: string) {
  const s = name.toLowerCase()
  const noSample = ['ultra', 'ultrasound', 'x-ray', 'xray', 'scan', 'ecg']
  if (noSample.some(k => s.includes(k))) return false
  return true
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bills = await prisma.bill.findMany({
    include: { patient: true, doctor: true, prescription: true },
    orderBy: { createdAt: 'desc' }
  })

  const states = loadStates()
  const jobs: any[] = []
  for (const b of bills) {
    const pres = b.prescription as any
    if (!pres) continue
    let meds: any = {}
    try { meds = pres.medicines ? JSON.parse(pres.medicines) : {} } catch {}
    const tests = Array.isArray(meds.labTests) ? meds.labTests : []
    for (const t of tests) {
      const id = keyOf(pres.id, t.name)
      const st = states[id] || {}
      // Only include tests that are from paid bills OR explicitly dispatched
      if (b.paymentStatus !== 'PAID' && !st.dispatched) continue
      jobs.push({
        id,
        billId: b.id,
        prescriptionId: pres.id,
        patient: b.patient,
        doctor: b.doctor,
        test: { name: t.name, instructions: t.instructions || '' },
        sampleNeeded: inferSampleNeeded(t.name),
        sampleTaken: !!st.sampleTaken,
        resultUploaded: !!st.resultUploaded,
        sampleType: st.sampleType || '',
        notes: st.notes || ''
      })
    }
  }

  return NextResponse.json({ jobs })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { id, sampleTaken, resultUploaded, sampleType, notes } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const states = loadStates()
  states[id] = { ...(states[id] || {}), ...(sampleTaken !== undefined ? { sampleTaken } : {}), ...(resultUploaded !== undefined ? { resultUploaded } : {}), ...(sampleType !== undefined ? { sampleType } : {}), ...(notes !== undefined ? { notes } : {}) }
  saveStates(states)
  return NextResponse.json({ success: true })
}

