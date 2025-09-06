import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    const targetDate = new Date(date)
    
    // Check if sessions already exist for this date
    const existingSessions = await prisma.appointmentSession.findMany({
      where: { date: targetDate }
    })
    
    if (existingSessions.length > 0) {
      return NextResponse.json({ 
        message: 'Sessions already exist for this date',
        sessions: existingSessions 
      })
    }
    
    // Create default sessions
    const defaultSessions = [
      {
        date: targetDate,
        name: 'Morning',
        shortCode: 'S1',
        startTime: '09:00',
        endTime: '13:00',
        maxTokens: 50,
        currentTokens: 0,
        isActive: true,
      },
      {
        date: targetDate,
        name: 'Afternoon', 
        shortCode: 'S2',
        startTime: '14:00',
        endTime: '17:00',
        maxTokens: 40,
        currentTokens: 0,
        isActive: true,
      }
    ]
    
    const createdSessions = []
    for (const sessionData of defaultSessions) {
      const session = await prisma.appointmentSession.create({
        data: sessionData
      })
      createdSessions.push(session)
    }
    
    return NextResponse.json({
      message: 'Default sessions created successfully',
      sessions: createdSessions
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating default sessions:', error)
    return NextResponse.json(
      { error: 'Failed to create default sessions' },
      { status: 500 }
    )
  }
}
