import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignDoctorSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'RECEPTIONIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = assignDoctorSchema.parse(body)
    const appointmentId = params.id

    // Verify appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, session: true }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Verify doctor exists and is active
    const doctor = await prisma.user.findUnique({
      where: { 
        id: validatedData.doctorId,
        role: 'DOCTOR',
        isActive: true
      }
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found or inactive' }, { status: 404 })
    }

    // Update appointment with assigned doctor
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { doctorId: validatedData.doctorId },
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
        session: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            startTime: true,
            endTime: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Doctor assigned successfully',
      appointment: updatedAppointment 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      }, { status: 400 })
    }
    
    console.error('Error assigning doctor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
