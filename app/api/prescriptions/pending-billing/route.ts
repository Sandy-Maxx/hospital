import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user has billing access (ADMIN or RECEPTIONIST)
    const role = (session as any)?.user?.role as string | undefined
    if (!session || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!['ADMIN', 'RECEPTIONIST', 'NURSE'].includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const doctorId = searchParams.get('doctorId')

    let whereClause: any = {
      // Only get prescriptions that don't have bills yet
      bills: {
        none: {}
      }
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      whereClause.createdAt = {
        gte: startDate,
        lt: endDate,
      }
    }

    if (doctorId) {
      whereClause.doctorId = doctorId
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            department: true,
            specialization: true,
          }
        },
        consultation: {
          include: {
            appointment: {
              select: {
                id: true,
                tokenNumber: true,
                type: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      prescriptions
    })
  } catch (error) {
    console.error('Error fetching pending billing prescriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
