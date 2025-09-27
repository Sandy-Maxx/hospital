import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        department: true,
        specialization: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ doctors })
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
