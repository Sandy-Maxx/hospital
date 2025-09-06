'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, User, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Doctor {
  id: string
  name: string
  department: string
  specialization: string
}

interface AvailabilityRule {
  id: string
  doctorId: string
  type: 'UNAVAILABLE' | 'LEAVE' | 'HOLIDAY' | 'CUSTOM'
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  weekdays?: string | number[]
  reason?: string
  isRecurring: boolean
  doctor: Doctor
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
}

export default function DoctorAvailabilityPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'availability' | 'sessions'>('availability')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  // Check if current user is a doctor
  const isDoctor = session?.user?.role === 'DOCTOR'
  const currentDoctorId = isDoctor ? session.user.id : ''

  const [formData, setFormData] = useState({
    doctorId: currentDoctorId,
    type: 'UNAVAILABLE' as const,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    weekdays: [] as number[],
    reason: '',
    isRecurring: false,
  })

  const [sessionAssignment, setSessionAssignment] = useState({
    sessionId: '',
    selectedDoctors: [] as string[],
  })

  useEffect(() => {
    if (!isDoctor) {
      fetchDoctors()
    }
    loadSessions()
    loadAvailabilityRules()
    
    // Set doctor ID for doctors automatically
    if (isDoctor && currentDoctorId) {
      setFormData(prev => ({ ...prev, doctorId: currentDoctorId }))
    }
  }, [isDoctor, currentDoctorId])

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors')
      if (response.ok) {
        const data = await response.json()
        setDoctors(data)
      }
    } catch (error) {
      toast.error('Failed to load doctors')
    }
  }

  const loadAvailabilityRules = async () => {
    try {
      const url = isDoctor ? `/api/doctors/availability?doctorId=${currentDoctorId}` : '/api/doctors/availability'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAvailabilityRules(data.availabilityRules || [])
      }
    } catch (error) {
      toast.error('Failed to load availability rules')
    }
  }

  const loadSessions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/sessions?date=${today}&future=true`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      toast.error('Failed to load sessions')
    }
  }

  const handleSubmitAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For doctors, use their own ID; for admins, require doctor selection
    const doctorIdToUse = isDoctor ? session?.user?.id : formData.doctorId
    
    if (!doctorIdToUse || !formData.startDate) {
      toast.error('Please fill in required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/doctors/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          doctorId: doctorIdToUse,
          weekdays: formData.isRecurring ? formData.weekdays : [],
        }),
      })

      if (response.ok) {
        toast.success('Availability rule created successfully')
        setFormData({
          doctorId: '',
          type: 'UNAVAILABLE',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          weekdays: [],
          reason: '',
          isRecurring: false,
        })
        loadAvailabilityRules()
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        toast.error(typeof errorData.error === 'string' ? errorData.error : 'Failed to create availability rule')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/doctors/availability?id=${ruleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Availability rule deleted')
        loadAvailabilityRules()
      } else {
        toast.error('Failed to delete rule')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleAssignDoctors = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sessionAssignment.sessionId || sessionAssignment.selectedDoctors.length === 0) {
      toast.error('Please select a session and at least one doctor')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sessions/assign-doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionAssignment),
      })

      if (response.ok) {
        toast.success('Doctors assigned to session successfully')
        setSessionAssignment({
          sessionId: '',
          selectedDoctors: [],
        })
        loadSessions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to assign doctors')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggleWeekday = (day: number) => {
    setFormData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day]
    }))
  }

  const toggleDoctorSelection = (doctorId: string) => {
    setSessionAssignment(prev => ({
      ...prev,
      selectedDoctors: prev.selectedDoctors.includes(doctorId)
        ? prev.selectedDoctors.filter(id => id !== doctorId)
        : [...prev.selectedDoctors, doctorId]
    }))
  }

  const weekdayNames = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']
  const weekdayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Format date in Indian format (DD/MM/YYYY)
  const formatIndianDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN')
  }

  // Format time in Indian format (12-hour with AM/PM)
  const formatIndianTime = (timeString: string) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Doctor Availability Management</h1>
        <p className="text-gray-600">Manage doctor schedules and session assignments</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('availability')}
          className={`pb-2 px-1 ${activeTab === 'availability' 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500'}`}
        >
          {isDoctor ? 'My Availability' : 'Availability Rules'}
        </button>
        {!isDoctor && (
          <button
            onClick={() => setActiveTab('sessions')}
            className={`pb-2 px-1 ${activeTab === 'sessions' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500'}`}
          >
            Session Assignments
          </button>
        )}
      </div>

      {/* Availability Rules Tab */}
      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Availability Rule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create Availability Rule
              </CardTitle>
              <CardDescription>
                Set doctor unavailability periods, leaves, or holidays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAvailability} className="space-y-4">
                {!isDoctor && (
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor</Label>
                    <select
                      id="doctor"
                      value={formData.doctorId}
                      onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.department}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {isDoctor && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Setting availability for:</strong> {session?.user?.name}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="UNAVAILABLE">Unavailable</option>
                    <option value="LEAVE">Leave</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time (Optional)</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, startTime: time }))}
                          className={`px-3 py-1 text-sm rounded-md border ${
                            formData.startTime === time 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Or select custom time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time (Optional)</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['12:00', '13:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, endTime: time }))}
                          className={`px-3 py-1 text-sm rounded-md border ${
                            formData.endTime === time 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Or select custom time"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                      className="mr-2"
                    />
                    Recurring (Weekly)
                  </Label>
                  
                  {formData.isRecurring && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {weekdayNames.map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleWeekday(index)}
                          className={`px-3 py-1 text-sm rounded-md border ${
                            formData.weekdays.includes(index)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for unavailability..."
                    rows={2}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Rule'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Existing Availability Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availabilityRules.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No availability rules found</p>
                ) : (
                  availabilityRules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          Dr. {rule.doctor?.name || 'Unknown Doctor'}
                        </h4>
                        {(session?.user?.role === 'ADMIN' || 
                          (session?.user?.role === 'DOCTOR' && rule.doctorId === session.user.id)) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Type:</strong> {rule.type}</p>
                        <p><strong>Period:</strong> {formatIndianDate(rule.startDate)} {rule.endDate && `to ${formatIndianDate(rule.endDate)}`}</p>
                        {rule.startTime && (
                          <p><strong>Time:</strong> {formatIndianTime(rule.startTime)} - {formatIndianTime(rule.endTime || '')}</p>
                        )}
                        {rule.isRecurring && rule.weekdays && (
                          <p><strong>Weekdays:</strong> {
                            typeof rule.weekdays === 'string' 
                              ? JSON.parse(rule.weekdays).map((d: number) => weekdayNames[d]).join(', ')
                              : Array.isArray(rule.weekdays) 
                                ? rule.weekdays.map((d: number) => weekdayNames[d]).join(', ')
                                : 'Invalid weekdays data'
                          }</p>
                        )}
                        {rule.reason && <p><strong>Reason:</strong> {rule.reason}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Assignments Tab */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assign Doctors to Session */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Assign Doctors to Session
              </CardTitle>
              <CardDescription>
                Select multiple doctors for each session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignDoctors} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session">Session</Label>
                  <select
                    id="session"
                    value={sessionAssignment.sessionId}
                    onChange={(e) => setSessionAssignment(prev => ({ ...prev, sessionId: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name} ({session.shortCode}) - {session.date} {session.startTime}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Select Doctors</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {doctors.map((doctor) => (
                      <label key={doctor.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={sessionAssignment.selectedDoctors.includes(doctor.id)}
                          onChange={() => toggleDoctorSelection(doctor.id)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {doctor.name} - {doctor.department}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Assigning...' : 'Assign Doctors'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Session Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Session Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No sessions found</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {session.name} ({session.shortCode})
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          session.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Date:</strong> {formatIndianDate(session.date)}</p>
                        <p><strong>Time:</strong> {formatIndianTime(session.startTime)} - {formatIndianTime(session.endTime)}</p>
                        <p><strong>Capacity:</strong> {session.currentTokens}/{session.maxTokens}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
