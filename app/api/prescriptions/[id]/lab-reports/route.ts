import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const baseDir = path.join(process.cwd(), 'public', 'uploads', 'reports')

function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }
function sanitize(name: string) { return name.replace(/[^a-z0-9\-_\.]/gi, '_') }
function saveDataUrl(filePath: string, dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/)
  if (!match) throw new Error('Invalid dataUrl')
  const buffer = Buffer.from(match[2], 'base64')
  fs.writeFileSync(filePath, buffer)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dir = path.join(baseDir, params.id)
  const items: any[] = []
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      items.push({ name: f, url: `/uploads/reports/${params.id}/${f}` })
    }
  }
  return NextResponse.json({ reports: items })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Allow ADMIN, DOCTOR, and NURSE to upload
  if (!['ADMIN', 'DOCTOR', 'NURSE'].includes((session.user as any).role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { testName, dataUrl, fileName } = body
  if (!dataUrl) return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 })
  const dir = path.join(baseDir, params.id)
  ensureDir(dir)
  const safeName = sanitize(fileName || `${sanitize(testName || 'report')}-${Date.now()}.pdf`)
  const target = path.join(dir, safeName)
  saveDataUrl(target, dataUrl)
  return NextResponse.json({ success: true, url: `/uploads/reports/${params.id}/${safeName}` })
}

