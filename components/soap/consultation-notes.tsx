"use client"

import React from 'react'
import { ClipboardList, Activity } from 'lucide-react'

export interface SoapNotesState {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface QuickNotesState {
  commonSymptoms: string[]
  vitalSigns: {
    temperature: string
    bloodPressure: string
    pulse: string
    respiratoryRate: string
    oxygenSaturation: string
  }
  commonDiagnoses: string[]
}

interface ConsultationNotesProps {
  soapNotes: SoapNotesState
  quickNotes: QuickNotesState
  onChangeSoap: (next: SoapNotesState) => void
  onChangeQuick: (next: QuickNotesState) => void
}

export default function ConsultationNotes({ soapNotes, quickNotes, onChangeSoap, onChangeQuick }: ConsultationNotesProps) {
  const toggleArrayItem = (arr: string[], value: string, checked: boolean) => {
    return checked ? [...arr, value] : arr.filter(v => v !== value)
  }

  return (
    <div className="space-y-6">
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
              onChange={(e) => onChangeSoap({ ...soapNotes, subjective: e.target.value })}
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
              onChange={(e) => onChangeSoap({ ...soapNotes, objective: e.target.value })}
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
              onChange={(e) => onChangeSoap({ ...soapNotes, assessment: e.target.value })}
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
              onChange={(e) => onChangeSoap({ ...soapNotes, plan: e.target.value })}
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
                  onChange={(e) => onChangeQuick({
                    ...quickNotes,
                    commonSymptoms: toggleArrayItem(quickNotes.commonSymptoms, symptom, e.target.checked)
                  })}
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
              onChange={(e) => onChangeQuick({
                ...quickNotes,
                vitalSigns: { ...quickNotes.vitalSigns, temperature: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Blood Pressure"
              value={quickNotes.vitalSigns.bloodPressure}
              onChange={(e) => onChangeQuick({
                ...quickNotes,
                vitalSigns: { ...quickNotes.vitalSigns, bloodPressure: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Pulse (bpm)"
              value={quickNotes.vitalSigns.pulse}
              onChange={(e) => onChangeQuick({
                ...quickNotes,
                vitalSigns: { ...quickNotes.vitalSigns, pulse: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Respiratory Rate"
              value={quickNotes.vitalSigns.respiratoryRate}
              onChange={(e) => onChangeQuick({
                ...quickNotes,
                vitalSigns: { ...quickNotes.vitalSigns, respiratoryRate: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="O2 Saturation (%)"
              value={quickNotes.vitalSigns.oxygenSaturation}
              onChange={(e) => onChangeQuick({
                ...quickNotes,
                vitalSigns: { ...quickNotes.vitalSigns, oxygenSaturation: e.target.value }
              })}
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
                  onChange={(e) => onChangeQuick({
                    ...quickNotes,
                    commonDiagnoses: toggleArrayItem(quickNotes.commonDiagnoses, diagnosis, e.target.checked)
                  })}
                  className="mr-2"
                />
                <span className="text-sm">{diagnosis}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

