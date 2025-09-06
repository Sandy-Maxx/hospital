'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Calendar, User, Stethoscope, Pill } from 'lucide-react'
import Link from 'next/link'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface Prescription {
  id: string
  createdAt: string
  doctor: {
    name: string
    department: string
  }
  medicines: string
}

interface Consultation {
  id: string
  date: string
  doctor: {
    name: string
    department: string
  }
  symptoms: string
  diagnosis: string
  notes: string
}

export default function PatientRecords() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (patientId) {
      fetchPatientRecords()
    }
  }, [patientId])

  const fetchPatientRecords = async () => {
    try {
      // Fetch patient details
      const patientResponse = await fetch(`/api/patients/${patientId}`)
      if (patientResponse.ok) {
        const patientData = await patientResponse.json()
        setPatient(patientData.patient)
      }

      // Fetch prescriptions
      const prescriptionsResponse = await fetch(`/api/prescriptions?patientId=${patientId}`)
      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json()
        setPrescriptions(prescriptionsData.prescriptions || [])
      }

      // Fetch consultations
      const consultationsResponse = await fetch(`/api/consultations?patientId=${patientId}`)
      if (consultationsResponse.ok) {
        const consultationsData = await consultationsResponse.json()
        setConsultations(consultationsData.consultations || [])
      }
    } catch (error) {
      console.error('Failed to fetch patient records:', error)
    } finally {
      setLoading(false)
    }
  }

  const parsePrescriptionMedicines = (medicinesJson: string) => {
    try {
      const data = JSON.parse(medicinesJson)
      return {
        medicines: data.medicines || [],
        labTests: data.labTests || [],
        therapies: data.therapies || []
      }
    } catch {
      return { medicines: [], labTests: [], therapies: [] }
    }
  }

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">Please sign in to access patient records.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient records...</p>
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
            {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'} - Medical Records
          </h1>
          <p className="text-gray-600">Complete medical records and treatment history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Pill className="w-5 h-5 mr-2" />
              Prescriptions ({prescriptions.length})
            </CardTitle>
            <CardDescription>Medication history and prescriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {prescriptions.length > 0 ? (
              <div className="space-y-4">
                {prescriptions.map((prescription) => {
                  const parsedData = parsePrescriptionMedicines(prescription.medicines)
                  return (
                    <div key={prescription.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            Dr. {prescription.doctor.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {prescription.doctor.department}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      
                      {parsedData.medicines.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Medicines:</h4>
                          <div className="space-y-1">
                            {parsedData.medicines.map((medicine: any, index: number) => (
                              <p key={index} className="text-sm text-gray-600">
                                • {medicine.name} - {medicine.dosage} ({medicine.frequency}) for {medicine.duration}
                                {medicine.instructions && ` - ${medicine.instructions}`}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedData.labTests.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Lab Tests:</h4>
                          <div className="flex flex-wrap gap-1">
                            {parsedData.labTests.map((test: any, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {test.name || test}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedData.therapies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Therapies:</h4>
                          <div className="flex flex-wrap gap-1">
                            {parsedData.therapies.map((therapy: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {therapy.name || therapy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No prescriptions found</p>
            )}
          </CardContent>
        </Card>

        {/* Consultations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="w-5 h-5 mr-2" />
              Consultations ({consultations.length})
            </CardTitle>
            <CardDescription>Doctor consultations and diagnoses</CardDescription>
          </CardHeader>
          <CardContent>
            {consultations.length > 0 ? (
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <div key={consultation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          Dr. {consultation.doctor.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {consultation.doctor.department}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(consultation.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    
                    {consultation.symptoms && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Symptoms:</h4>
                        <p className="text-sm text-gray-600">{consultation.symptoms}</p>
                      </div>
                    )}

                    {consultation.diagnosis && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Diagnosis:</h4>
                        <p className="text-sm text-gray-600">{consultation.diagnosis}</p>
                      </div>
                    )}

                    {consultation.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Notes:</h4>
                        <p className="text-sm text-gray-600">{consultation.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No consultations found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
