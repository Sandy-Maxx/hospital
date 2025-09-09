import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const filePath = path.join(process.cwd(), 'data', 'notifications.json')

function readAll() {
  try {
    if (!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

function writeAll(list: any[]) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const onlyUnread = searchParams.get('unread') === '1'
  const all = readAll()
  const items = all
    .filter((n:any) => (onlyUnread ? !n.isRead : true))
    .sort((a:any,b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return NextResponse.json({ notifications: items })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, body: message, type } = body || {}
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })
  const all = readAll()
  const now = new Date().toISOString()
  const item = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`,
    title,
    body: message || '',
    type: type || 'INFO',
    isRead: false,
    createdAt: now,
  }
  all.push(item)
  writeAll(all)
  return NextResponse.json(item, { status: 201 })
}

