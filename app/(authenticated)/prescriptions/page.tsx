'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pill, Search, FileText, Calendar, User, Plus, Stethoscope, ClipboardList, Activity } from 'lucide-react'
import PrescriptionForm from '@/components/prescriptions/prescription-form'
import toast from 'react-hot-toast'

interface Patient {
  id: string
  firstName: string
  lastName: string
  phone: string
  age: number
  gender: string
}

interface Prescription {
  id: string
  patient: Patient
  doctor: {
    id: string
    name: string
  }
  medicines: string
  createdAt: string
  consultation?: {
    id: string
    symptoms: string
    diagnosis: string
  }
}

export default function PrescriptionsPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewPrescription, setShowNewPrescription] = useState(false)
  const [consultationMode, setConsultationMode] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [soapNotes, setSoapNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  })
  const [quickNotes, setQuickNotes] = useState({
    commonSymptoms: [] as string[],
    vitalSigns: {
      temperature: '',
      bloodPressure: '',
      pulse: '',
      respiratoryRate: '',
      oxygenSaturation: ''
    },
    commonDiagnoses: [] as string[]
  })

  useEffect(() => {
    fetchPrescriptions()
    fetchPatients()
  }, [])

  useEffect(() => {
    // Check if coming from consultation
    const patientId = searchParams.get('patientId')
    const appointmentIdParam = searchParams.get('appointmentId')
    const consultation = searchParams.get('consultation')
    
    console.log('URL Params:', { patientId, appointmentIdParam, consultation })
    console.log('Current URL:', window.location.href)
    
    if (patientId && consultation === 'true') {
      console.log('Setting consultation mode')
      setConsultationMode(true)
      setAppointmentId(appointmentIdParam)
      setShowNewPrescription(true)
      
      // Always fetch patient directly for consultation mode
      fetchPatientById(patientId)
    }
  }, [searchParams])

  // Separate effect to handle patient selection when patients list changes
  useEffect(() => {
    const patientId = searchParams.get('patientId')
    const consultation = searchParams.get('consultation')
    
    if (patientId && consultation === 'true' && patients.length > 0 && !selectedPatient) {
      const patient = patients.find(p => p.id === patientId)
      if (patient) {
        console.log('Auto-selecting patient from list:', patient)
        setSelectedPatient(patient)
      }
    }
  }, [patients, searchParams, selectedPatient])

  const fetchPatientById = async (patientId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched patient directly:', data.patient)
        setSelectedPatient(data.patient)
      }
    } catch (error) {
      console.error('Error fetching patient:', error)
    }
  }

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/prescriptions')
      if (response.ok) {
        const data = await response.json()
        setPrescriptions(data.prescriptions || [])
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrescriptionSuccess = () => {
    setShowNewPrescription(false)
    setSelectedPatient(null)
    setConsultationMode(false)
    setSoapNotes({
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    })
    setQuickNotes({
      commonSymptoms: [],
      vitalSigns: {
        temperature: '',
        bloodPressure: '',
        pulse: '',
        respiratoryRate: '',
        oxygenSaturation: ''
      },
      commonDiagnoses: []
    })
    fetchPrescriptions()
    toast.success('Prescription created successfully')
  }

  const filteredPatients = patients.filter(patient =>
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.patient && (
      prescription.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patient.phone.includes(searchTerm)
    )
  )

  const parseMedicines = (medicinesJson: string) => {
    try {
      return JSON.parse(medicinesJson)
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600">Manage patient prescriptions and medications</p>
        </div>
        <Button
          onClick={() => setShowNewPrescription(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {consultationMode ? 'Complete Consultation' : 'New Prescription'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Pill className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {prescriptions.filter(p => {
                    const today = new Date().toISOString().split('T')[0]
                    return p.createdAt.split('T')[0] === today
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showNewPrescription && (
        <div className="space-y-6">
          {!selectedPatient ? (
            <Card>
              <CardHeader>
                <CardTitle>Select Patient</CardTitle>
                <CardDescription>Choose a patient to create a prescription for</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <h3 className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {patient.age} years, {patient.gender}
                        </p>
                        <p className="text-sm text-gray-600">{patient.phone}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewPrescription(false)
                        setSearchTerm('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {consultationMode && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Stethoscope className="w-5 h-5 mr-2" />
                      Consultation Notes
                    </CardTitle>
                    <CardDescription>
                      SOAP notes and clinical observations for {selectedPatient?.firstName} {selectedPatient?.lastName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* SOAP Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <ClipboardList className="w-4 h-4 inline mr-1" />
                            Subjective (Patient's complaints)
                          </label>
                          <textarea
                            value={soapNotes.subjective}
                            onChange={(e) => setSoapNotes(prev => ({...prev, subjective: e.target.value}))}
                            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500"
                            rows={4}
                            placeholder="Patient's symptoms, concerns, and history..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Activity className="w-4 h-4 inline mr-1" />
                            Objective (Clinical findings)
                          </label>
                          <textarea
                            value={soapNotes.objective}
                            onChange={(e) => setSoapNotes(prev => ({...prev, objective: e.target.value}))}
                            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500"
                            rows={4}
                            placeholder="Physical examination findings, vital signs..."
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assessment (Diagnosis)
                          </label>
                          <textarea
                            value={soapNotes.assessment}
                            onChange={(e) => setSoapNotes(prev => ({...prev, assessment: e.target.value}))}
                            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500"
                            rows={4}
                            placeholder="Clinical diagnosis and assessment..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Plan (Treatment plan)
                          </label>
                          <textarea
                            value={soapNotes.plan}
                            onChange={(e) => setSoapNotes(prev => ({...prev, plan: e.target.value}))}
                            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500"
                            rows={4}
                            placeholder="Treatment plan, follow-up instructions..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Selection Tools */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Common Symptoms</label>
                        <div className="space-y-2">
                          {['Fever', 'Headache', 'Cough', 'Sore throat', 'Nausea', 'Fatigue', 'Body ache', 'Dizziness'].map(symptom => (
                            <label key={symptom} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={quickNotes.commonSymptoms.includes(symptom)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setQuickNotes(prev => ({
                                      ...prev,
                                      commonSymptoms: [...prev.commonSymptoms, symptom]
                                    }))
                                  } else {
                                    setQuickNotes(prev => ({
                                      ...prev,
                                      commonSymptoms: prev.commonSymptoms.filter(s => s !== symptom)
                                    }))
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">{symptom}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vital Signs</label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Temperature (°F)"
                            value={quickNotes.vitalSigns.temperature}
                            onChange={(e) => setQuickNotes(prev => ({
                              ...prev,
                              vitalSigns: {...prev.vitalSigns, temperature: e.target.value}
                            }))}
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
                          />
                          <input
                            type="text"
                            placeholder="Blood Pressure"
                            value={quickNotes.vitalSigns.bloodPressure}
                            onChange={(e) => setQuickNotes(prev => ({
                              ...prev,
                              vitalSigns: {...prev.vitalSigns, bloodPressure: e.target.value}
                            }))}
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
                          />
                          <input
                            type="text"
                            placeholder="Pulse (bpm)"
                            value={quickNotes.vitalSigns.pulse}
                            onChange={(e) => setQuickNotes(prev => ({
                              ...prev,
                              vitalSigns: {...prev.vitalSigns, pulse: e.target.value}
                            }))}
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
                          />
                          <input
                            type="text"
                            placeholder="Respiratory Rate"
                            value={quickNotes.vitalSigns.respiratoryRate}
                            onChange={(e) => setQuickNotes(prev => ({
                              ...prev,
                              vitalSigns: {...prev.vitalSigns, respiratoryRate: e.target.value}
                            }))}
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
                          />
                          <input
                            type="text"
                            placeholder="O2 Saturation (%)"
                            value={quickNotes.vitalSigns.oxygenSaturation}
                            onChange={(e) => setQuickNotes(prev => ({
                              ...prev,
                              vitalSigns: {...prev.vitalSigns, oxygenSaturation: e.target.value}
                            }))}
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Common Diagnoses</label>
                        <div className="space-y-2">
                          {['Upper Respiratory Infection', 'Hypertension', 'Diabetes Type 2', 'Gastritis', 'Migraine', 'Anxiety', 'Back Pain', 'Allergic Rhinitis'].map(diagnosis => (
                            <label key={diagnosis} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={quickNotes.commonDiagnoses.includes(diagnosis)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setQuickNotes(prev => ({
                                      ...prev,
                                      commonDiagnoses: [...prev.commonDiagnoses, diagnosis]
                                    }))
                                  } else {
                                    setQuickNotes(prev => ({
                                      ...prev,
                                      commonDiagnoses: prev.commonDiagnoses.filter(d => d !== diagnosis)
                                    }))
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">{diagnosis}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <PrescriptionForm
                selectedPatient={selectedPatient}
                onSuccess={handlePrescriptionSuccess}
                onCancel={() => setShowNewPrescription(false)}
                consultationData={consultationMode ? {
                  soapNotes,
                  quickNotes,
                  appointmentId
                } : undefined}
              />
            </div>
          )}
        </div>
      )}

      {!showNewPrescription && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
            <CardDescription>View and manage patient prescriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search prescriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-4">
                {filteredPrescriptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No prescriptions found</p>
                  </div>
                ) : (
                  filteredPrescriptions.map((prescription) => {
                    const medicines = parseMedicines(prescription.medicines)
                    const medicinesArray = Array.isArray(medicines) ? medicines : []
                    return (
                      <div key={prescription.id} className="p-6 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {prescription.patient.firstName} {prescription.patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {prescription.patient.age} years, {prescription.patient.gender} • {prescription.patient.phone}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Dr. {prescription.doctor.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(prescription.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {prescription.consultation && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">Consultation Notes:</p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Symptoms:</span> {prescription.consultation.symptoms}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Diagnosis:</span> {prescription.consultation.diagnosis}
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Prescribed Medicines:</h4>
                          {medicinesArray.map((medicine: any, index: number) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-blue-900">{medicine.name}</h5>
                                <span className="text-sm text-blue-700">{medicine.dosage}</span>
                              </div>
                              <div className="mt-1 text-sm text-blue-700">
                                <span className="font-medium">Frequency:</span> {medicine.frequency} • 
                                <span className="font-medium ml-2">Duration:</span> {medicine.duration}
                              </div>
                              {medicine.instructions && (
                                <p className="mt-1 text-sm text-blue-600">
                                  <span className="font-medium">Instructions:</span> {medicine.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
