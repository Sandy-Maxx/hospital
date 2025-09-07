import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const consultationFeeSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  consultationType: z.string().default('GENERAL'),
  fee: z.number().min(0, 'Fee must be positive'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')

    let whereClause: any = { isActive: true }
    
    if (doctorId) {
      whereClause.doctorId = doctorId
    }

    const consultationFees = await prisma.doctorConsultationFee.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            department: true,
            specialization: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      consultationFees
    })
  } catch (error) {
    console.error('Error fetching consultation fees:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = consultationFeeSchema.parse(body)

    // Check if fee already exists for this doctor and consultation type
    const existingFee = await prisma.doctorConsultationFee.findUnique({
      where: {
        doctorId_consultationType: {
          doctorId: validatedData.doctorId,
          consultationType: validatedData.consultationType
        }
      }
    })

    if (existingFee) {
      // Update existing fee
      const updatedFee = await prisma.doctorConsultationFee.update({
        where: { id: existingFee.id },
        data: {
          fee: validatedData.fee,
          isActive: true,
        },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              department: true,
              specialization: true,
            }
          }
        }
      })

      return NextResponse.json(updatedFee)
    } else {
      // Create new fee
      const consultationFee = await prisma.doctorConsultationFee.create({
        data: validatedData,
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              department: true,
              specialization: true,
            }
          }
        }
      })

      return NextResponse.json(consultationFee, { status: 201 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating/updating consultation fee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
