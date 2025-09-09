import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const billSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  prescriptionId: z.string().optional(),
  appointmentId: z.string().optional(),
  doctorId: z.string().min(1, 'Doctor is required'),
  consultationFee: z.number().min(0).optional(),
  items: z.array(z.object({
    itemType: z.enum(['CONSULTATION', 'MEDICINE', 'LAB_TEST', 'THERAPY', 'PROCEDURE', 'OTHER']),
    itemName: z.string(),
    quantity: z.number().min(1).default(1),
    unitPrice: z.number().min(0).optional(),
    gstRate: z.number().min(0).max(100).optional(),
  })),
  discountAmount: z.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
})

// Generate bill number
function generateBillNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const time = now.getTime().toString().slice(-6)
  return `BILL-${year}${month}${day}-${time}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (patientId) {
      where.patientId = patientId
    }
    
    if (from && to) {
      const startDate = new Date(from)
      const endDate = new Date(to)
      where.createdAt = {
        gte: startDate,
        lt: endDate,
      }
    } else if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.createdAt = {
        gte: startDate,
        lt: endDate,
      }
    }
    
    if (status) {
      where.paymentStatus = status
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              name: true,
              department: true,
            }
          },
          prescription: true,
          billItems: true,
        },
      }),
      prisma.bill.count({ where }),
    ])

    return NextResponse.json({
      bills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = billSchema.parse(body)

    // Generate bill number
    const billNumber = generateBillNumber()

    // Calculate amounts
    let totalAmount = validatedData.consultationFee || 0
    let cgst = 0
    let sgst = 0

    const bill = await prisma.bill.create({
      data: {
        billNumber,
        patientId: validatedData.patientId,
        prescriptionId: validatedData.prescriptionId,
        appointmentId: validatedData.appointmentId,
        doctorId: validatedData.doctorId,
        consultationFee: validatedData.consultationFee,
        totalAmount: 0, // Will be updated after items are created
        cgst: 0,
        sgst: 0,
        discountAmount: validatedData.discountAmount,
        finalAmount: 0, // Will be calculated
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        createdBy: session.user.id || '',
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

// Create bill items (only include those with a user-entered rate)
    const itemsToCreate = validatedData.items.filter((item) => typeof item.unitPrice === 'number' && item.unitPrice > 0)

    const billItems = await Promise.all(
      itemsToCreate.map(async (item) => {
        const itemTotal = (item.unitPrice || 0) * item.quantity
        const gstAmount = item.gstRate ? (itemTotal * item.gstRate) / 100 : 0
        
        totalAmount += itemTotal
        cgst += gstAmount / 2
        sgst += gstAmount / 2

        return prisma.billItem.create({
          data: {
            billId: bill.id,
            itemType: item.itemType,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal,
            gstRate: item.gstRate,
          }
        })
      })
    )

    // Calculate final amount
    const finalAmount = totalAmount + cgst + sgst - validatedData.discountAmount

    // Update bill with calculated amounts
    const updatedBill = await prisma.bill.update({
      where: { id: bill.id },
      data: {
        totalAmount,
        cgst,
        sgst,
        finalAmount,
        // Consider bill paid on creation
        paymentStatus: 'PAID',
        paidAmount: finalAmount,
        balanceAmount: 0,
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            name: true,
            department: true,
          },
        },
        prescription: true,
        billItems: true,
      },
    })

    return NextResponse.json(updatedBill, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body = await request.json()
    const updateSchema = z.object({
      items: z.array(z.object({
        itemType: z.enum(['CONSULTATION', 'MEDICINE', 'LAB_TEST', 'THERAPY', 'PROCEDURE', 'OTHER']),
        itemName: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        gstRate: z.number().min(0).max(100).optional(),
      })).optional(),
      discountAmount: z.number().min(0).default(0).optional(),
      paymentMethod: z.string().optional(),
      paymentStatus: z.enum(['PENDING','PARTIAL','PAID','REFUNDED']).optional(),
      paidAmount: z.number().min(0).optional(),
      balanceAmount: z.number().min(0).optional(),
      notes: z.string().optional(),
    })

    const data = updateSchema.parse(body)

    let totalAmount = 0
    let cgst = 0
    let sgst = 0

    let finalAmount: number | undefined = undefined

    if (data.items) {
      // Replace bill items when provided
      await prisma.billItem.deleteMany({ where: { billId: id } })

      await Promise.all(
        data.items.map(async (item) => {
          const line = (item.unitPrice || 0) * item.quantity
          const gstAmount = item.gstRate ? (line * item.gstRate) / 100 : 0
          totalAmount += line
          cgst += gstAmount / 2
          sgst += gstAmount / 2
          await prisma.billItem.create({
            data: {
              billId: id,
              itemType: item.itemType,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: line,
              gstRate: item.gstRate,
            },
          })
        })
      )

      finalAmount = totalAmount + cgst + sgst - (data.discountAmount ?? 0)
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        ...(finalAmount !== undefined ? { totalAmount, cgst, sgst, finalAmount } : {}),
        ...(data.discountAmount !== undefined ? { discountAmount: data.discountAmount } : {}),
        ...(data.paymentMethod !== undefined ? { paymentMethod: data.paymentMethod } : {}),
        ...(data.paymentStatus !== undefined ? { paymentStatus: data.paymentStatus } : {}),
        ...(data.paidAmount !== undefined ? { paidAmount: data.paidAmount } : {}),
        ...(data.balanceAmount !== undefined ? { balanceAmount: data.balanceAmount } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: {
        patient: {
          select: { firstName: true, lastName: true, phone: true },
        },
        doctor: { select: { name: true, department: true } },
        billItems: true,
      },
    })

    return NextResponse.json(updatedBill)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    // Delete items then bill
    await prisma.billItem.deleteMany({ where: { billId: id } })
    await prisma.bill.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
