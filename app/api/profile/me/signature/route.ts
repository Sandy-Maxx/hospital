import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'users')

function ensureUserDir(userId: string) {
  const dir = path.join(uploadDir, userId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function saveDataUrl(filePath: string, dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/)
  if (!match) throw new Error('Invalid dataUrl')
  const buffer = Buffer.from(match[2], 'base64')
  fs.writeFileSync(filePath, buffer)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { dataUrl, userId } = await request.json()
  const targetUserId = userId || session.user.id
  const dir = ensureUserDir(targetUserId)
  const filePath = path.join(dir, 'signature.png')
  saveDataUrl(filePath, dataUrl)
  return NextResponse.json({ url: `/uploads/users/${targetUserId}/signature.png` })
}

