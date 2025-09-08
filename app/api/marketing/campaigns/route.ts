import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { sendEmail, sendSMS, sendWhatsApp, sendPush } from '@/lib/notify/senders'

const STORE_PATH = path.join(process.cwd(), 'data', 'marketing-campaigns.json')

type Campaign = {
  id: string
  name: string
  message: string
  messageHtml?: string | null
  channels: { email?: boolean; sms?: boolean; whatsapp?: boolean; push?: boolean }
  audience: any
  scheduledAt: string | null
  status: 'SCHEDULED' | 'SENT' | 'CANCELLED'
  createdAt: string
  updatedAt?: string
  result?: { sent: number; failed: number; total: number }
}

function loadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return []
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveStore(campaigns: any[]) {
  const dir = path.dirname(STORE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(STORE_PATH, JSON.stringify(campaigns, null, 2), 'utf8')
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function selectAudience(audience: any) {
  const allPatients = await prisma.patient.findMany()
  const now = new Date()
  // Base set is all
  let selected = allPatients

  // Build date range based on selector
  const periodToMs = (period: string) => {
    const n = parseInt(period)
    if (period.endsWith('d')) return n * 24 * 60 * 60 * 1000
    if (period.endsWith('m')) return n * 30 * 24 * 60 * 60 * 1000
    if (period.endsWith('y')) return n * 365 * 24 * 60 * 60 * 1000
    return 0
  }

  const selector: string = audience?.selector || 'ALL'
  const period: string = audience?.period || '' // e.g., '30d', '90d', '365d'

  const havePeriod = !!period
  const since = havePeriod ? new Date(now.getTime() - periodToMs(period)) : null

  if (selector === 'VISITED_LAST_PERIOD' && havePeriod && since) {
    const appts = await prisma.appointment.findMany({
      where: { dateTime: { gte: since, lte: now } },
      select: { patientId: true },
    })
    const visitedIds = new Set(appts.map(a => a.patientId))
    selected = allPatients.filter(p => visitedIds.has(p.id))
  } else if (selector === 'NO_VISIT_LAST_PERIOD' && havePeriod && since) {
    const appts = await prisma.appointment.findMany({
      where: { dateTime: { gte: since, lte: now } },
      select: { patientId: true },
    })
    const visitedIds = new Set(appts.map(a => a.patientId))
    selected = allPatients.filter(p => !visitedIds.has(p.id))
  } else if (selector === 'BOOKED_NOT_VISITED_LAST_PERIOD' && havePeriod && since) {
    // Booked but not visited: appointments in range with non-completed statuses
    const appts = await prisma.appointment.findMany({
      where: {
        dateTime: { gte: since, lte: now },
        status: { in: ['SCHEDULED','ARRIVED','WAITING','NO_SHOW'] },
      },
      select: { patientId: true },
    })
    const targetIds = new Set(appts.map(a => a.patientId))
    selected = allPatients.filter(p => targetIds.has(p.id))
  } else if (selector === 'CANCELLED_LAST_PERIOD' && havePeriod && since) {
    const appts = await prisma.appointment.findMany({
      where: {
        dateTime: { gte: since, lte: now },
        status: 'CANCELLED',
      },
      select: { patientId: true },
    })
    const targetIds = new Set(appts.map(a => a.patientId))
    selected = allPatients.filter(p => targetIds.has(p.id))
  } else if (selector === 'CONDITION_MATCH') {
    const rawConditions: string[] = Array.isArray(audience?.conditions) ? audience.conditions : []
    const terms = rawConditions.map(s => s.trim()).filter(Boolean)
    if (terms.length > 0) {
      // Match against prescriptions and consultations diagnosis/symptoms/notes
      const pres = await prisma.prescription.findMany({
        where: {
          ...(havePeriod && since ? { createdAt: { gte: since, lte: now } } : {}),
          OR: [
            ...terms.map(t => ({ diagnosis: { contains: t, mode: 'insensitive' as const } })),
            ...terms.map(t => ({ symptoms: { contains: t, mode: 'insensitive' as const } })),
            ...terms.map(t => ({ notes: { contains: t, mode: 'insensitive' as const } })),
          ],
        },
        select: { patientId: true },
      })
      const cons = await prisma.consultation.findMany({
        where: {
          ...(havePeriod && since ? { createdAt: { gte: since, lte: now } } : {}),
          OR: [
            ...terms.map(t => ({ diagnosis: { contains: t, mode: 'insensitive' as const } })),
            ...terms.map(t => ({ notes: { contains: t, mode: 'insensitive' as const } })),
            ...terms.map(t => ({ chiefComplaint: { contains: t, mode: 'insensitive' as const } })),
          ],
        },
        select: { patientId: true },
      })
      const ids = new Set<string>([...pres.map(p => p.patientId), ...cons.map(c => c.patientId)])
      selected = allPatients.filter(p => ids.has(p.id))
    }
  }

  // Age/Gender filters
  selected = selected.filter(p => {
    if (audience?.gender && p.gender && p.gender !== audience.gender) return false
    if ((audience?.minAge || audience?.maxAge) && p.dateOfBirth) {
      const today = new Date()
      const dob = new Date(p.dateOfBirth)
      let age = today.getFullYear() - dob.getFullYear()
      const m = today.getMonth() - dob.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
      if (audience.minAge && age < parseInt(audience.minAge)) return false
      if (audience.maxAge && age > parseInt(audience.maxAge)) return false
    }
    return true
  })

  return selected
}

function loadHospitalName() {
  try {
    const fs = require('fs') as typeof import('fs')
    const path = require('path') as typeof import('path')
    const settingsPath = path.join(process.cwd(), 'data', 'hospital-settings.json')
    const raw = fs.readFileSync(settingsPath, 'utf8')
    const json = JSON.parse(raw)
    return json?.name || 'Hospital'
  } catch { return 'Hospital' }
}

function applyPersonalization(htmlOrText: string, p: any) {
  const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim()
  let out = (htmlOrText || '')
  out = out.replace(/\{\{\s*PATIENT_NAME\s*\}\}/g, fullName || 'Patient')
  out = out.replace(/\{\{\s*HOSPITAL_NAME\s*\}\}/g, loadHospitalName())
  out = out.replace(/\{\{\s*DOCTOR_NAME\s*\}\}/g, '')
  out = out.replace(/\{\{\s*APPOINTMENT_DATE\s*\}\}/g, '')
  out = out.replace(/\{\{\s*LAB_RESULTS_LINK\s*\}\}/g, '')
  out = out.replace(/\{\{\s*PRESCRIPTION_PASSCODE\s*\}\}/g, '')
  return out
}

async function deliverCampaign(c: Campaign) {
  // Build audience from DB (Patients). Apply the simplest filters.
  const targets = await selectAudience(c.audience)

  let sent = 0, failed = 0
  for (const p of targets) {
    const phone = p.phone
    const email = (p as any).email
    try {
      const baseHtml = c.messageHtml || c.message
      const html = applyPersonalization(baseHtml, p)
      const text = stripHtml(html)
      if (c.channels?.email && email) await sendEmail(email, c.name || 'Campaign', html)
      if (c.channels?.sms && phone) await sendSMS(phone, text)
      if (c.channels?.whatsapp && phone) await sendWhatsApp(phone, text)
      if (c.channels?.push) await sendPush(p.id, c.name || 'Campaign', text)
      sent++
    } catch {
      failed++
    }
  }
  return { sent, failed, total: targets.length }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const campaigns = loadStore()
  const providerStatus = {
    emailConfigured: !!process.env.EMAIL_SMTP_URL,
    smsConfigured: !!process.env.SMS_API_KEY,
    whatsappConfigured: !!process.env.WHATSAPP_API_KEY,
  }
  return NextResponse.json({ campaigns, providerStatus })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, message, messageHtml, channels, audience, scheduledAt } = body
  if (!message && !messageHtml) return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  if (!channels) return NextResponse.json({ error: 'Channels are required' }, { status: 400 })

  const campaigns = loadStore() as Campaign[]
  const campaign: Campaign = {
    id: `cmp_${Date.now()}`,
    name: name || 'Campaign',
    message: messageHtml || message,
    messageHtml: messageHtml || null,
    channels: channels || {},
    audience: audience || { selector: 'ALL' },
    scheduledAt: scheduledAt || null,
    status: 'SCHEDULED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  campaigns.unshift(campaign)

  // If scheduledAt is not set or is in the past, send immediately
  let result: any = null
  if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
    result = await deliverCampaign(campaign)
    campaign.status = 'SENT'
    ;(campaign as any).result = result
  }

  saveStore(campaigns)
  return NextResponse.json({ campaign, result })
}

