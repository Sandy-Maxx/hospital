import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const statePath = path.join(process.cwd(), 'data', 'lab-states.json')
function ensureState() { const dir = path.dirname(statePath); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); if (!fs.existsSync(statePath)) fs.writeFileSync(statePath, '{}') }
function loadStates(): Record<string, any> { ensureState(); try { return JSON.parse(fs.readFileSync(statePath, 'utf8')) } catch { return {} } }
function saveStates(m: Record<string, any>) { ensureState(); fs.writeFileSync(statePath, JSON.stringify(m, null, 2), 'utf8') }

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const prescriptionId = searchParams.get('prescriptionId')
  if (!prescriptionId) return NextResponse.json({ error: 'Missing prescriptionId' }, { status: 400 })
  const states = loadStates()
  const key = `${prescriptionId}::__bundle_meta`
  return NextResponse.json(states[key] || { link: null, sends: [] })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { prescriptionId, link, send } = body as { prescriptionId?: string; link?: { url: string; passcode: string; expiresAt?: string }; send?: { channel: string; to?: string; at?: string } }
  if (!prescriptionId) return NextResponse.json({ error: 'Missing prescriptionId' }, { status: 400 })
  const states = loadStates()
  const key = `${prescriptionId}::__bundle_meta`
  const current = states[key] || { link: null, sends: [] as any[] }
  const next = { ...current }
  if (link) next.link = link
  if (send) next.sends = [...(current.sends || []), { ...send, at: send.at || new Date().toISOString() }]
  states[key] = next
  saveStates(states)
  return NextResponse.json({ success: true })
}

