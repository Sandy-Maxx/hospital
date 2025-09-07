import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const presc = await prisma.prescription.findUnique({
      where: { id: params.id },
      include: { patient: true, doctor: true, consultation: true }
    })
    if (!presc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ prescription: presc })
  } catch (e) {
    console.error('Fetch prescription error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
