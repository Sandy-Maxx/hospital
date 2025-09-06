'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

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
}

interface BookingResult {
  appointment: any
  tokenNumber: string
  sessionInfo: {
    name: string
    date: string
    startTime: string
    endTime: string
  }
}

export default function PublicBookAppointment() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [doctors, setDoctors] = useState<{id: string, name: string}[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

  const [formData, setFormData] = useState({
    // Patient Information
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    
    // Appointment Details
    sessionId: '',
    doctorId: '',
    type: 'CONSULTATION',
    priority: 'NORMAL',
    notes: ''
  })

  // Load available sessions for selected date
  const loadSessions = async (date: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessions/simple?date=${date}&active=true`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        toast.error('Failed to load available sessions')
      }
    } catch (error) {
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  // Load available doctors
  const loadDoctors = async () => {
    try {
      const response = await fetch('/api/doctors/public')
      if (response.ok) {
        const data = await response.json()
        setDoctors(data.doctors || [])
      }
    } catch (error) {
      console.error('Failed to load doctors:', error)
    }
  }

  // Load patient data if patientId is provided
  const loadPatientData = async (patientId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        const patient = data.patient
        setFormData(prev => ({
          ...prev,
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          phone: patient.phone || '',
          email: patient.email || '',
          dateOfBirth: patient.dateOfBirth || '',
          gender: patient.gender || ''
        }))
      }
    } catch (error) {
      console.error('Failed to load patient data:', error)
    }
  }

  useEffect(() => {
    if (selectedDate) {
      loadSessions(selectedDate)
      loadDoctors()
    }
    
    // Auto-fill patient data if coming from patient details page
    const patientId = searchParams.get('patientId')
    if (patientId) {
      loadPatientData(patientId)
    }
  }, [selectedDate, searchParams])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    const { firstName, lastName, phone } = formData
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toast.error('Please fill in all required fields')
      return false
    }
    if (phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    return formData.sessionId.trim() !== '' && formData.doctorId.trim() !== ''
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return

    setLoading(true)
    try {
      const response = await fetch('/api/appointments/book-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setBookingResult(data)
        setStep(4)
        toast.success('Appointment booked successfully!')
      } else {
        // Handle validation errors from API
        if (Array.isArray(data.error)) {
          // Zod validation errors
          const errorMessages = data.error.map((err: any) => err.message).join(', ')
          toast.error(errorMessages)
        } else if (typeof data.error === 'string') {
          toast.error(data.error)
        } else {
          toast.error('Failed to book appointment')
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableSlots = (session: Session) => {
    const available = session.maxTokens - session.currentTokens
    return Math.max(0, available)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
          <p className="text-gray-600">Schedule your visit with our healthcare professionals</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3, 4].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div className={`flex items-center space-x-2 ${
                step >= stepNumber ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200'
                } ${step === stepNumber ? 'ring-2 ring-blue-300' : ''}`}>
                  {stepNumber === 4 && step >= 4 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {stepNumber === 1 && 'Personal Info'}
                  {stepNumber === 2 && 'Select Session'}
                  {stepNumber === 3 && 'Review'}
                  {stepNumber === 4 && 'Confirmation'}
                </span>
              </div>
              {stepNumber < 4 && (
                <div className="w-8 h-px bg-gray-300"></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
              <CardDescription>Please provide your contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Session */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Select Appointment Session
              </CardTitle>
              <CardDescription>Choose your preferred date and session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Select Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label htmlFor="doctor">Select Doctor</Label>
                <select
                  id="doctor"
                  value={formData.doctorId}
                  onChange={(e) => handleInputChange('doctorId', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Available Sessions for {formatDate(selectedDate)}</Label>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No sessions available for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((session) => {
                      const availableSlots = getAvailableSlots(session)
                      const isSelected = formData.sessionId === session.id
                      
                      return (
                        <div
                          key={session.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                              : availableSlots > 0 
                                ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50' 
                                : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          }`}
                          onClick={() => {
                            if (availableSlots > 0) {
                              handleInputChange('sessionId', session.id)
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">{session.name}</h3>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {session.shortCode}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {session.startTime} - {session.endTime}
                            </div>
                            {session.doctor && (
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                Dr. {session.doctor.name}
                              </div>
                            )}
                            <div className={`font-medium ${
                              availableSlots > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {availableSlots > 0 
                                ? `${availableSlots} slots available`
                                : 'Session Full'
                              }
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Appointment Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="CONSULTATION">Consultation</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="ROUTINE_CHECKUP">Routine Checkup</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any specific concerns or requirements..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!formData.sessionId}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Appointment</CardTitle>
              <CardDescription>Please review your information before confirming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
                    <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                    {formData.email && <p><span className="font-medium">Email:</span> {formData.email}</p>}
                    {formData.dateOfBirth && <p><span className="font-medium">Date of Birth:</span> {formData.dateOfBirth}</p>}
                    {formData.gender && <p><span className="font-medium">Gender:</span> {formData.gender}</p>}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Appointment Details</h3>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const selectedSession = sessions.find(s => s.id === formData.sessionId)
                      return selectedSession ? (
                        <>
                          <p><span className="font-medium">Date:</span> {formatDate(selectedDate)}</p>
                          <p><span className="font-medium">Session:</span> {selectedSession.name} ({selectedSession.shortCode})</p>
                          <p><span className="font-medium">Time:</span> {selectedSession.startTime} - {selectedSession.endTime}</p>
                          {selectedSession.doctor && (
                            <p><span className="font-medium">Doctor:</span> Dr. {selectedSession.doctor.name}</p>
                          )}
                          <p><span className="font-medium">Type:</span> {formData.type}</p>
                          <p><span className="font-medium">Priority:</span> {formData.priority}</p>
                          {formData.notes && <p><span className="font-medium">Notes:</span> {formData.notes}</p>}
                        </>
                      ) : null
                    })()}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important Information:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Please arrive 15 minutes before your session starts</li>
                      <li>Bring a valid ID and any relevant medical documents</li>
                      <li>You will receive a token number for queue management</li>
                      <li>Contact us if you need to reschedule or cancel</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Booking...' : 'Confirm Appointment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && bookingResult && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Appointment Confirmed!</CardTitle>
              <CardDescription>Your appointment has been successfully booked</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  Token: {bookingResult.tokenNumber}
                </div>
                <p className="text-gray-600">Please save this token number for your reference</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Appointment Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Date:</span> {formatDate(bookingResult.sessionInfo.date)}</p>
                  <p><span className="font-medium">Session:</span> {bookingResult.sessionInfo.name}</p>
                  <p><span className="font-medium">Time:</span> {bookingResult.sessionInfo.startTime} - {bookingResult.sessionInfo.endTime}</p>
                  <p><span className="font-medium">Patient:</span> {formData.firstName} {formData.lastName}</p>
                  <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  <li>Arrive at the hospital 15 minutes before your session time</li>
                  <li>Present your token number at the reception</li>
                  <li>Wait for your token to be called</li>
                  <li>Bring valid ID and any medical documents</li>
                </ul>
              </div>

              <div className="text-center">
                <Button onClick={() => window.location.reload()}>
                  Book Another Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
