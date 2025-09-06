'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Calendar, Clock, User, Phone, Plus } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Appointment {
  id: string
  date: string
  time: string
  type: string
  status: string
  notes?: string
  tokenNumber?: number
  patient: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }
  doctor: {
    id: string
    name: string
  }
}

const statusColors = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ARRIVED: 'bg-green-100 text-green-800',
  WAITING: 'bg-yellow-100 text-yellow-800',
  IN_CONSULTATION: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
}

export default function Appointments() {
  const { data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        date: selectedDate,
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/appointments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      } else {
        toast.error('Failed to fetch appointments')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate, statusFilter])

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Status updated successfully')
        fetchAppointments()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const getStatusActions = (appointment: Appointment) => {
    const actions = []
    
    switch (appointment.status) {
      case 'SCHEDULED':
        actions.push(
          <Button
            key="arrived"
            size="sm"
            variant="success"
            onClick={() => updateAppointmentStatus(appointment.id, 'ARRIVED')}
          >
            Mark Arrived
          </Button>
        )
        break
      case 'ARRIVED':
        actions.push(
          <Button
            key="waiting"
            size="sm"
            variant="warning"
            onClick={() => updateAppointmentStatus(appointment.id, 'WAITING')}
          >
            Move to Queue
          </Button>
        )
        break
      case 'WAITING':
        if (session?.user.role === 'DOCTOR') {
          actions.push(
            <Button
              key="consultation"
              size="sm"
              onClick={() => updateAppointmentStatus(appointment.id, 'IN_CONSULTATION')}
            >
              Start Consultation
            </Button>
          )
        }
        break
      case 'IN_CONSULTATION':
        if (session?.user.role === 'DOCTOR') {
          actions.push(
            <Button
              key="complete"
              size="sm"
              variant="success"
              onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}
            >
              Complete
            </Button>
          )
        }
        break
    }

    if (!['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="destructive"
          onClick={() => updateAppointmentStatus(appointment.id, 'CANCELLED')}
        >
          Cancel
        </Button>
      )
    }

    return actions
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-primary-600" />
            Appointments
          </h1>
          <p className="text-gray-600 mt-2">Manage patient appointments and schedules</p>
        </div>
        {session?.user.role === 'RECEPTIONIST' && (
          <Link href="/book-appointment">
            <Button className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              >
                <option value="">All Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARRIVED">Arrived</option>
                <option value="WAITING">Waiting</option>
                <option value="IN_CONSULTATION">In Consultation</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Appointments for {formatDate(selectedDate)}
          </CardTitle>
          <CardDescription>
            {appointments.length} appointments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No appointments found for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {appointment.tokenNumber || '#'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTime(appointment.time)}
                            </span>
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              Dr. {appointment.doctor.name}
                            </span>
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {appointment.patient.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[appointment.status as keyof typeof statusColors]
                      }`}>
                        {appointment.status.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {appointment.type}
                      </span>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-3 text-sm text-gray-600">
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}
                  
                  <div className="mt-3 flex space-x-2">
                    {getStatusActions(appointment)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
