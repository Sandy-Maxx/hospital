import { PrismaClient } from '@prisma/client'

// Enhanced Prisma client with performance monitoring
class OptimizedPrismaClient extends PrismaClient {
  private queryTimes: Map<string, number[]> = new Map()

  constructor() {
    const baseConfig: any = {
      log: process.env.NODE_ENV === 'development'
        ? [ { emit: 'event', level: 'query' }, { emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' } ]
        : [ { emit: 'event', level: 'error' } ],
    }

    const dbUrl = process.env.DATABASE_URL
    if (dbUrl) {
      baseConfig.datasources = {
        db: {
          url:
            process.env.NODE_ENV === 'production'
              ? `${dbUrl}?connection_limit=20&pool_timeout=20&socket_timeout=60`
              : dbUrl,
        },
      }
    }

    super(baseConfig)

    // Monitor query performance
    if (process.env.NODE_ENV === 'development') {
      ;(this as any).$on('query', (e: any) => {
      if (e.duration > 1000) {
        console.warn('Slow query detected:', {
          query: e.query,
          duration: e.duration,
          params: e.params,
          timestamp: new Date().toISOString(),
        })
      }

      // Track query patterns
      const queryKey = this.getQueryPattern(e.query)
      const times = this.queryTimes.get(queryKey) || []
      times.push(e.duration)
      
      // Keep only last 100 queries per pattern
      if (times.length > 100) {
        times.splice(0, times.length - 100)
      }
      
      this.queryTimes.set(queryKey, times)
    })
    }

    ;(this as any).$on('error', (e: any) => {
      console.error('Database error:', {
        message: e.message,
        timestamp: new Date().toISOString(),
      })
    })
  }

  private getQueryPattern(query: string): string {
    // Extract the basic query pattern for analytics
    return query
      .replace(/\$\d+/g, '$param')
      .replace(/IN\s*\([^)]+\)/gi, 'IN ($params)')
      .replace(/\d+/g, 'NUM')
      .replace(/'[^']*'/g, "'TEXT'")
      .substring(0, 100)
  }

  // Get query performance statistics
  getPerformanceStats() {
    const stats: Record<string, { avg: number; max: number; min: number; count: number }> = {}
    
    this.queryTimes.forEach((times, pattern) => {
      if (times.length > 0) {
        stats[pattern] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          max: Math.max(...times),
          min: Math.min(...times),
          count: times.length,
        }
      }
    })
    
    return stats
  }
}

// Global database client instance
declare global {
  var prisma: OptimizedPrismaClient | undefined
}

const prisma: OptimizedPrismaClient =
  process.env.NODE_ENV === 'test'
    ? (new Proxy({} as any, {
        get() {
          throw new Error('Prisma client is disabled in test environment')
        },
      }) as unknown as OptimizedPrismaClient)
    : ((globalThis as any).prisma ?? new OptimizedPrismaClient())

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') (globalThis as any).prisma = prisma

// Pagination helper for consistent pagination across the app
export interface PaginationOptions {
  page?: number
  limit?: number
  orderBy?: Record<string, 'asc' | 'desc'>
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export const getPaginatedResults = async <T>(
  model: any,
  options: PaginationOptions & {
    where?: any
    include?: any
    select?: any
  } = {}
): Promise<PaginationResult<T>> => {
  const page = Math.max(1, options.page || 1)
  const limit = Math.min(100, Math.max(1, options.limit || 10))
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    model.findMany({
      where: options.where,
      include: options.include,
      select: options.select,
      skip,
      take: limit,
      orderBy: options.orderBy || { createdAt: 'desc' },
    }),
    model.count({ where: options.where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// Optimized queries for common operations
export const optimizedQueries = {
  // Get appointments with related data efficiently
  getAppointmentsWithDetails: async (where: any = {}, options: PaginationOptions = {}) => {
    return getPaginatedResults(prisma.appointment, {
      ...options,
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            department: true,
          },
        },
        session: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })
  },

  // Get patients with appointment counts
  getPatientsWithStats: async (where: any = {}, options: PaginationOptions = {}) => {
    return getPaginatedResults(prisma.patient, {
      ...options,
      where,
      include: {
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
            bills: true,
          },
        },
        appointments: {
          select: {
            id: true,
            dateTime: true,
            status: true,
          },
          orderBy: { dateTime: 'desc' },
          take: 1, // Get latest appointment
        },
      },
    })
  },

  // Get bills with comprehensive details
  getBillsWithDetails: async (where: any = {}, options: PaginationOptions = {}) => {
    return getPaginatedResults(prisma.bill, {
      ...options,
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
        billItems: {
          select: {
            id: true,
            itemType: true,
            itemName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            gstRate: true,
          },
        },
        appointment: {
          select: {
            id: true,
            dateTime: true,
            tokenNumber: true,
          },
        },
        prescription: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    })
  },

  // Search patients efficiently
  searchPatients: async (searchTerm: string, options: PaginationOptions = {}) => {
    const search = searchTerm.toLowerCase().trim()
    
    return getPaginatedResults(prisma.patient, {
      ...options,
      where: {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
          {
            AND: [
              { firstName: { contains: search.split(' ')[0] || '' } },
              { lastName: { contains: search.split(' ')[1] || '' } },
            ],
          },
        ],
      },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
        appointments: {
          select: {
            id: true,
            dateTime: true,
            status: true,
          },
          orderBy: { dateTime: 'desc' },
          take: 1,
        },
      },
    })
  },

  // Get dashboard metrics efficiently
  getDashboardMetrics: async (doctorId?: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const where = doctorId ? { doctorId } : {}

    const [
      todayAppointments,
      totalPatients,
      pendingBills,
      completedToday,
      weeklyStats,
    ] = await Promise.all([
      // Today's appointments
      prisma.appointment.count({
        where: {
          ...where,
          dateTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // Total patients (or doctor's patients)
      doctorId
        ? prisma.appointment
            .groupBy({ by: ['patientId'], where: { doctorId } })
            .then((rows) => rows.length)
        : prisma.patient.count(),

      // Pending bills
      prisma.bill.count({
        where: {
          ...where,
          paymentStatus: 'PENDING',
        },
      }),

      // Completed appointments today
      prisma.appointment.count({
        where: {
          ...where,
          dateTime: {
            gte: today,
            lt: tomorrow,
          },
          status: 'COMPLETED',
        },
      }),

      // Weekly appointment counts
      Promise.all(
        Array.from({ length: 7 }, async (_, i) => {
          const date = new Date(today)
          date.setDate(date.getDate() - (6 - i))
          const nextDate = new Date(date)
          nextDate.setDate(nextDate.getDate() + 1)

          return prisma.appointment.count({
            where: {
              ...where,
              dateTime: {
                gte: date,
                lt: nextDate,
              },
            },
          })
        })
      ),
    ])

    return {
      todayAppointments,
      totalPatients,
      pendingBills,
      completedToday,
      weeklyAppointmentTrend: weeklyStats,
      waitingPatients: await prisma.appointment.count({
        where: {
          ...where,
          status: 'WAITING',
        },
      }),
    }
  },
}

// In-memory cache implementation for frequently accessed data
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private defaultTtl = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl: number = this.defaultTtl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  clear() {
    this.cache.clear()
  }

  size() {
    return this.cache.size
  }
}

export const cache = new SimpleCache()

// Cache decorator for API responses
export const withCache = (key: string, ttl: number = 5 * 60 * 1000) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`
      
      // Try to get from cache
      const cached = cache.get(cacheKey)
      if (cached) {
        return cached
      }

      // Execute method and cache result
      const result = await method.apply(this, args)
      cache.set(cacheKey, result, ttl)

      return result
    }
  }
}

// Bulk operations for better performance
export const bulkOperations = {
  async createManyAppointments(appointments: any[]) {
    return prisma.$transaction(
      appointments.map(appointment =>
        prisma.appointment.create({
          data: appointment,
        })
      )
    )
  },

  async updateManyAppointmentStatuses(ids: string[], status: string) {
    return prisma.appointment.updateMany({
      where: {
        id: { in: ids },
      },
      data: { status },
    })
  },

  async deleteManyRecords(model: string, ids: string[]) {
    const modelInstance = (prisma as any)[model]
    return modelInstance.deleteMany({
      where: {
        id: { in: ids },
      },
    })
  },
}

export default prisma
export { prisma }
