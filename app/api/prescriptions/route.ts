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

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const where = patientId ? { patientId } : {}

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        consultation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
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
    const { patientId, consultationId, medicines, labTests, therapies, symptoms, diagnosis, notes, vitals } = body

    // Find the doctor ID from session
    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Validate required fields
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Prepare prescription data
    const prescriptionCreateData: any = {
      patientId,
      doctorId: doctor.id,
      symptoms,
      diagnosis,
      notes,
      vitals: vitals ? JSON.stringify(vitals) : null,
      medicines: JSON.stringify({
        medicines: medicines || [],
        labTests: labTests || [],
        therapies: therapies || []
      })
    }

    // Only include consultationId if it's provided
    if (consultationId) {
      prescriptionCreateData.consultationId = consultationId
    }

    const prescription = await prisma.prescription.create({
      data: prescriptionCreateData,
      include: {
        patient: true,
        doctor: true,
        consultation: true
      }
    })

    return NextResponse.json({ prescription }, { status: 201 })
  } catch (error) {
    console.error('Error creating prescription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
