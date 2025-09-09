import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }

const baseDir = path.join(process.cwd(), 'data', 'user-profiles')

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const file = path.join(baseDir, `${session.user.id}.json`)
  try {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'))
      return NextResponse.json(data)
    }
    return NextResponse.json({})
  } catch { return NextResponse.json({}) }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  ensureDir(baseDir)
  const file = path.join(baseDir, `${session.user.id}.json`)

  const readExisting = () => { try { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {} } catch { return {} } }
  const writeAudit = (before: any, after: any) => {
    try {
      const afile = path.join(process.cwd(), 'data', 'audit-logs.json')
      const dir = path.dirname(afile)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const list = fs.existsSync(afile) ? JSON.parse(fs.readFileSync(afile, 'utf8')) : []
      const changedKeys = Array.from(new Set([...Object.keys(before||{}), ...Object.keys(after||{})])).filter(k => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]))
      list.push({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`, actorId: session.user.id, targetUserId: session.user.id, action: 'PROFILE_UPDATE', changedKeys, at: new Date().toISOString() })
      fs.writeFileSync(afile, JSON.stringify(list, null, 2), 'utf8')
    } catch {}
  }

  // Admin can update everything; non-admin can update limited fields only
  const isAdmin = (session.user as any)?.role === 'ADMIN'
  if (!isAdmin) {
    const allowed = ['fullName', 'phone', 'address']
    const existing: any = readExisting()
    const merged: any = { ...existing }
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) merged[k] = body[k]
    }
    writeAudit(existing, merged)
    fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf8')
    return NextResponse.json({ success: true })
  }

  const before = readExisting()
  fs.writeFileSync(file, JSON.stringify(body, null, 2), 'utf8')
  writeAudit(before, body)
  return NextResponse.json({ success: true })
}
