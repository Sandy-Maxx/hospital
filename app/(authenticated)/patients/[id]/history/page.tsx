'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Activity, Calendar, Clock, User, AlertCircle, Heart } from 'lucide-react'
import Link from 'next/link'
import MedicalTimeline from '@/components/timeline/medical-timeline'

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  bloodGroup: string
  allergies: string
  medicalHistory: string
}

interface Appointment {
  id: string
  dateTime: string
  type: string
  status: string
  doctor: {
    name: string
    department: string
  }
  notes?: string
}

interface Bill {
  id: string
  date: string
  amount: number
  status: string
  description: string
}

export default function PatientMedicalHistory() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (patientId) {
      fetchPatientHistory()
    }
  }, [patientId])

  const fetchPatientHistory = async () => {
    try {
      // Fetch patient details
      const patientResponse = await fetch(`/api/patients/${patientId}`)
      if (patientResponse.ok) {
        const patientData = await patientResponse.json()
        setPatient(patientData.patient)
      }

      // Fetch appointments
      const appointmentsResponse = await fetch(`/api/appointments?patientId=${patientId}`)
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(appointmentsData.appointments || [])
      }

      // Fetch bills
      const billsResponse = await fetch(`/api/bills?patientId=${patientId}`)
      if (billsResponse.ok) {
        const billsData = await billsResponse.json()
        setBills(billsData.bills || [])
      }
    } catch (error) {
      console.error('Failed to fetch patient history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">Please sign in to access patient history.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/patients/${patientId}`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patient
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'} - Medical History
          </h1>
          <p className="text-gray-600">Complete medical history and timeline</p>
        </div>
      </div>

      {/* Patient Summary */}
      {patient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Patient Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">
                  {patient.dateOfBirth ? `${calculateAge(patient.dateOfBirth)} years` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Group</p>
                <p className="font-medium">{patient.bloodGroup || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Appointments</p>
                <p className="font-medium">{appointments.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Bills</p>
                <p className="font-medium">${bills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}</p>
              </div>
            </div>

            {patient.allergies && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <h4 className="font-medium text-red-800">Allergies</h4>
                </div>
                <p className="text-red-700 mt-1">{patient.allergies}</p>
              </div>
            )}

            {patient.medicalHistory && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Heart className="w-4 h-4 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-800">Medical History</h4>
                </div>
                <p className="text-blue-700 mt-1">{patient.medicalHistory}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Medical Timeline Widget */}
      <div className="animate-fade-in-up">
        <MedicalTimeline patientId={patientId} />
      </div>
    </div>
  )
}
