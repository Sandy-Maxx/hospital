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
  fs.writeFileSync(file, JSON.stringify(body, null, 2), 'utf8')
  return NextResponse.json({ success: true })
}

