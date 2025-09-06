import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const consultations = await prisma.consultation.findMany({
      include: {
        patient: true,
        doctor: true,
        appointment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ consultations })
  } catch (error) {
    console.error('Error fetching consultations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, symptoms, diagnosis, notes } = body

    // Get appointment details to find patient and doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const consultation = await prisma.consultation.create({
      data: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointmentId,
        symptoms,
        diagnosis,
        notes: notes || ''
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true
      }
    })

    return NextResponse.json({ consultation }, { status: 201 })
  } catch (error) {
    console.error('Error creating consultation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
