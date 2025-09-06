import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const availabilitySchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  type: z.enum(['UNAVAILABLE', 'LEAVE', 'HOLIDAY', 'CUSTOM']),
  startDate: z.string(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  weekdays: z.array(z.number()).optional(),
  reason: z.string().optional(),
  isRecurring: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')

    // If user is a doctor, only show their own rules
    const whereClause = session.user.role === 'DOCTOR' 
      ? { doctorId: session.user.id }
      : doctorId 
        ? { doctorId }
        : {}

    const availabilityRules = await prisma.doctorAvailability.findMany({
      where: {
        ...whereClause,
        isActive: true
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
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ availabilityRules })

  } catch (error) {
    console.error('Error fetching availability rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = availabilitySchema.parse(body)

    // If user is a doctor, ensure they can only create rules for themselves
    if (session.user.role === 'DOCTOR' && validatedData.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Doctors can only manage their own availability' }, { status: 403 })
    }

    const availabilityRule = await prisma.doctorAvailability.create({
      data: {
        doctorId: validatedData.doctorId,
        type: validatedData.type,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        weekdays: validatedData.weekdays ? JSON.stringify(validatedData.weekdays) : null,
        reason: validatedData.reason,
        isRecurring: validatedData.isRecurring,
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

    return NextResponse.json({ 
      message: 'Availability rule created successfully',
      availabilityRule 
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      }, { status: 400 })
    }
    
    console.error('Error creating availability rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only admins and doctors can delete availability rules.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Availability rule ID is required' }, { status: 400 })
    }

    // Get the availability rule to check ownership
    const availabilityRule = await prisma.doctorAvailability.findUnique({
      where: { id }
    })

    if (!availabilityRule) {
      return NextResponse.json({ error: 'Availability rule not found' }, { status: 404 })
    }

    // If user is a doctor, ensure they can only delete their own rules
    if (session.user.role === 'DOCTOR' && availabilityRule.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Doctors can only delete their own availability rules' }, { status: 403 })
    }

    await prisma.doctorAvailability.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Availability rule deleted successfully' })

  } catch (error) {
    console.error('Error deleting availability rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
