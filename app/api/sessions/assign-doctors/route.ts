import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignDoctorsSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  doctorIds: z.array(z.string()).min(1, 'At least one doctor must be assigned'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = assignDoctorsSchema.parse(body)

    // Remove existing assignments for this session
    await prisma.doctorSessionAssignment.updateMany({
      where: { sessionId: validatedData.sessionId },
      data: { isActive: false }
    })

    // Create new assignments
    const assignments = await Promise.all(
      validatedData.doctorIds.map(doctorId =>
        prisma.doctorSessionAssignment.create({
          data: {
            doctorId,
            sessionId: validatedData.sessionId,
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
      )
    )

    return NextResponse.json({
      message: 'Doctors assigned to session successfully',
      assignments
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    console.error('Error assigning doctors to session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const assignments = await prisma.doctorSessionAssignment.findMany({
      where: {
        sessionId,
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
      }
    })

    return NextResponse.json({ assignments })

  } catch (error) {
    console.error('Error fetching session assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
