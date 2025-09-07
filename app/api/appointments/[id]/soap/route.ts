import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session as any)?.user?.role as string | undefined
    // Allow nurses, doctors, and admins to save SOAP. Receptionists excluded by default.
    if (!role || !['NURSE', 'DOCTOR', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    const { soapNotes, quickNotes } = body || {}

    const appt = await prisma.appointment.findUnique({ where: { id } })
    if (!appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Merge SOAP into notes as JSON
    let existing: any = {}
    if (appt.notes) {
      try { existing = JSON.parse(appt.notes) } catch { existing = { text: appt.notes } }
    }

const currentUserMeta = {
      id: (session as any)?.user?.id || '',
      name: (session as any)?.user?.name || '',
      role: role,
      at: new Date().toISOString()
    }

    let editedBy = Array.isArray((existing as any)?.editedBy) ? (existing as any).editedBy as any[] : []

    // If filledBy already exists, append current user to editedBy if it's a different edit
    let filledBy = (existing as any)?.filledBy
    if (!filledBy) {
      filledBy = currentUserMeta
    } else {
      const last = editedBy.length > 0 ? editedBy[editedBy.length - 1] : filledBy
      if (last?.id !== currentUserMeta.id || last?.role !== currentUserMeta.role) {
        editedBy = [...editedBy, currentUserMeta]
      }
    }

    const merged = {
      ...existing,
      filledBy,
      editedBy,
      soapNotes: {
        subjective: soapNotes?.subjective || existing?.soapNotes?.subjective || '',
        objective: soapNotes?.objective || existing?.soapNotes?.objective || '',
        assessment: soapNotes?.assessment || existing?.soapNotes?.assessment || '',
        plan: soapNotes?.plan || existing?.soapNotes?.plan || ''
      },
      quickNotes: {
        ...(existing?.quickNotes || {}),
        commonSymptoms: Array.isArray(quickNotes?.commonSymptoms)
          ? quickNotes.commonSymptoms
          : (existing?.quickNotes?.commonSymptoms || []),
        commonDiagnoses: Array.isArray(quickNotes?.commonDiagnoses)
          ? quickNotes.commonDiagnoses
          : (existing?.quickNotes?.commonDiagnoses || []),
        vitalSigns: {
          ...(existing?.quickNotes?.vitalSigns || {}),
          ...(quickNotes?.vitalSigns || {})
        }
      }
    }

    await prisma.appointment.update({
      where: { id },
      data: { notes: JSON.stringify(merged) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving SOAP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

