'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, Phone, User, UserCheck, Search, CheckCircle, AlertCircle, XCircle, Printer, Download, RefreshCw, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import TokenPrint from '@/components/appointments/token-print'
import toast from 'react-hot-toast'

interface Doctor {
  id: string
  name: string
  department: string
}

interface Appointment {
  id: string
  tokenNumber: string
  status: string
  type: string
  priority: string
  notes?: string
  createdAt: string
  patient: {
    id: string
    firstName: string
    lastName: string
    phone: string
  }
  session: {
    id: string
    name: string
    shortCode: string
    startTime: string
    endTime: string
  }
  doctor?: {
    id: string
    name: string
    department: string
  }
}

interface Session {
  id: string
  name: string
  shortCode: string
  date: string
  startTime: string
  endTime: string
  maxTokens: number
  currentTokens: number
  isActive: boolean
  doctor?: {
    id: string
    name: string
  }
  appointments: Appointment[]
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

const priorityColors = {
  EMERGENCY: 'bg-red-500 text-white',
  HIGH: 'bg-orange-500 text-white',
  NORMAL: 'bg-blue-500 text-white',
  LOW: 'bg-gray-500 text-white',
}

export default function Receptionist() {
  const { data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([]) // deprecated, keep if needed elsewhere
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [hospitalSettings, setHospitalSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [printingToken, setPrintingToken] = useState<string | null>(null)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessions?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        toast.error('Failed to fetch sessions')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fetchHospitalSettings = async () => {
    try {
      // Use API route which persists settings to the filesystem
      const response = await fetch('/api/settings/hospital')
      if (response.ok) {
        const settings = await response.json()
        setHospitalSettings(settings)
      }
    } catch (error) {
      console.error('Failed to fetch hospital settings:', error)
    }
  }

  useEffect(() => {
    fetchSessions()
    fetchDoctors()
    fetchHospitalSettings()
  }, [])

  // Refresh sessions when date changes
  useEffect(() => {
    fetchSessions()
  }, [selectedDate])

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors')
      if (response.ok) {
        const data = await response.json()
        const list = Array.isArray(data) ? data : (data.doctors || [])
        setDoctors(list)
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

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
        fetchSessions()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const assignDoctor = async (appointmentId: string, doctorId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/assign-doctor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId })
      })

      if (response.ok) {
        toast.success('Doctor assigned successfully')
        fetchSessions()
        setEditingAppointment(null)
        setSelectedDoctorId('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to assign doctor')
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
            variant="default"
            className="bg-green-600 hover:bg-green-700"
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
            variant="default"
            className="bg-yellow-600 hover:bg-yellow-700"
            onClick={() => updateAppointmentStatus(appointment.id, 'WAITING')}
          >
            Move to Queue
          </Button>
        )
        break
      case 'WAITING':
        // Receptionist should not start consultation; allow sending back to Arrived only
        actions.push(
          <Button
            key="back-arrived"
            size="sm"
            variant="outline"
            onClick={() => updateAppointmentStatus(appointment.id, 'ARRIVED')}
          >
            Back to Arrived
          </Button>
        )
        break
      case 'IN_CONSULTATION':
        actions.push(
          <Button
            key="complete"
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}
          >
            Complete
          </Button>
        )
        actions.push(
          <Button
            key="back-waiting"
            size="sm"
            variant="outline"
            onClick={() => updateAppointmentStatus(appointment.id, 'WAITING')}
          >
            Back to Queue
          </Button>
        )
        break
    }

    // Doctor assignment allowed only when status is ARRIVED
    if (appointment.status === 'ARRIVED') {
      if (editingAppointment === appointment.id) {
        actions.push(
          <div key="doctor-select" className="flex items-center space-x-2">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="">Select Doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="default"
              disabled={!selectedDoctorId}
              onClick={() => assignDoctor(appointment.id, selectedDoctorId)}
            >
              Assign
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingAppointment(null)
                setSelectedDoctorId('')
              }}
            >
              Cancel
            </Button>
          </div>
        )
      } else {
        actions.push(
          <Button
            key="assign-doctor"
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingAppointment(appointment.id)
              setSelectedDoctorId(appointment.doctor?.id || '')
            }}
          >
            <UserCheck className="w-4 h-4 mr-1" />
            {appointment.doctor ? 'Reassign' : 'Assign'} Doctor
          </Button>
        )
      }

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

  const filteredSessions = sessions.filter(session => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return session.appointments.some(apt => 
        apt.patient.firstName.toLowerCase().includes(term) ||
        apt.patient.lastName.toLowerCase().includes(term) ||
        apt.patient.phone.includes(term) ||
        apt.tokenNumber.toLowerCase().includes(term)
      )
    }
    return true
  })

  const getTotalStats = () => {
    const allAppointments = sessions.flatMap(s => s.appointments)
    return {
      total: allAppointments.length,
      scheduled: allAppointments.filter(a => a.status === 'SCHEDULED').length,
      arrived: allAppointments.filter(a => a.status === 'ARRIVED').length,
      waiting: allAppointments.filter(a => a.status === 'WAITING').length,
      inConsultation: allAppointments.filter(a => a.status === 'IN_CONSULTATION').length,
      completed: allAppointments.filter(a => a.status === 'COMPLETED').length,
    }
  }

  const stats = getTotalStats()

  if (session?.user?.role !== 'RECEPTIONIST' && session?.user?.role !== 'ADMIN') {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">Access denied. Receptionist or Admin privileges required.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-primary-600" />
            Reception Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage appointments and patient queue</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchSessions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/patients/new">
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Register Patient
            </Button>
          </Link>
          <Link href="/book-appointment">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-gray-600">Total Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-500">{stats.scheduled}</div>
            <p className="text-xs text-gray-600">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.arrived}</div>
            <p className="text-xs text-gray-600">Arrived</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.waiting}</div>
            <p className="text-xs text-gray-600">Waiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-500">{stats.inConsultation}</div>
            <p className="text-xs text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500">{stats.completed}</div>
            <p className="text-xs text-gray-600">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Token Print Modal */}
      {selectedAppointment && hospitalSettings && (
        <TokenPrint
          appointment={selectedAppointment}
          hospitalSettings={hospitalSettings}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session
              </label>
              <select
                value=""
                onChange={() => {}}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} ({session.shortCode}) - {session.startTime}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, phone, or token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions and Appointments */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No sessions found for this date</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      {session.name} ({session.shortCode})
                    </CardTitle>
                    <CardDescription>
                      {session.startTime} - {session.endTime}
                      {session.doctor && ` • Dr. ${session.doctor.name}`}
                      <br />
                      {session.currentTokens} of {session.maxTokens} appointments
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={session.isActive ? 'default' : 'secondary'}>
                      {session.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {session.appointments.length} appointments
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {session.appointments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No appointments in this session
                  </div>
                ) : (
                  <div className="space-y-3">
                    {session.appointments
                      .filter(apt => {
                        if (!searchTerm) return true
                        const term = searchTerm.toLowerCase()
                        return apt.patient.firstName.toLowerCase().includes(term) ||
                               apt.patient.lastName.toLowerCase().includes(term) ||
                               apt.patient.phone.includes(term) ||
                               apt.tokenNumber.toLowerCase().includes(term)
                      })
                      .sort((a, b) => {
                        // Sort by priority first, then by token number
                        const priorityOrder = { EMERGENCY: 0, HIGH: 1, NORMAL: 2, LOW: 3 }
                        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2
                        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2
                        
                        if (aPriority !== bPriority) return aPriority - bPriority
                        return a.tokenNumber.localeCompare(b.tokenNumber)
                      })
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-primary-600 font-medium text-sm">
                                    {appointment.tokenNumber}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {appointment.patient.firstName} {appointment.patient.lastName}
                                  </h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center">
                                      <Phone className="w-4 h-4 mr-1" />
                                      {appointment.patient.phone}
                                    </span>
                                    <span className="flex items-center">
                                      <User className="w-4 h-4 mr-1" />
                                      {appointment.type}
                                    </span>
                                    {appointment.doctor && (
                                      <span className="flex items-center text-blue-600">
                                        <UserCheck className="w-4 h-4 mr-1" />
                                        Dr. {appointment.doctor.name}
                                      </span>
                                    )}
                                  </div>
                                  {appointment.notes && (
                                    <p className="text-sm text-gray-600 mt-2">
                                      <strong>Notes:</strong> {appointment.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={priorityColors[appointment.priority as keyof typeof priorityColors]}>
                                {appointment.priority}
                              </Badge>
                              <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                                {appointment.status.replace('_', ' ')}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedAppointment(appointment)}
                                className="ml-2"
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                Print Token
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex space-x-2">
                            {getStatusActions(appointment)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
