"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface SoapNotes {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface Vitals {
  temperature?: string
  bloodPressure?: string
  pulse?: string
  respiratoryRate?: string
  oxygenSaturation?: string
}

interface SoapFormProps {
  soap: SoapNotes
  vitals: Vitals
  onChangeSoap: (next: SoapNotes) => void
  onChangeVitals: (next: Vitals) => void
}

export default function SoapForm({ soap, vitals, onChangeSoap, onChangeVitals }: SoapFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">SOAP Notes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Subjective (S)</Label>
          <textarea
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            rows={3}
            value={soap.subjective}
            onChange={(e) => onChangeSoap({ ...soap, subjective: e.target.value })}
          />
        </div>
        <div>
          <Label>Objective (O)</Label>
          <textarea
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            rows={3}
            value={soap.objective}
            onChange={(e) => onChangeSoap({ ...soap, objective: e.target.value })}
          />
        </div>
        <div>
          <Label>Assessment (A)</Label>
          <textarea
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            rows={3}
            value={soap.assessment}
            onChange={(e) => onChangeSoap({ ...soap, assessment: e.target.value })}
          />
        </div>
        <div>
          <Label>Plan (P)</Label>
          <textarea
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            rows={3}
            value={soap.plan}
            onChange={(e) => onChangeSoap({ ...soap, plan: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <Label>Temp</Label>
          <Input value={vitals.temperature || ''} onChange={(e) => onChangeVitals({ ...vitals, temperature: e.target.value })} />
        </div>
        <div>
          <Label>BP</Label>
          <Input value={vitals.bloodPressure || ''} onChange={(e) => onChangeVitals({ ...vitals, bloodPressure: e.target.value })} />
        </div>
        <div>
          <Label>Pulse</Label>
          <Input value={vitals.pulse || ''} onChange={(e) => onChangeVitals({ ...vitals, pulse: e.target.value })} />
        </div>
        <div>
          <Label>RR</Label>
          <Input value={vitals.respiratoryRate || ''} onChange={(e) => onChangeVitals({ ...vitals, respiratoryRate: e.target.value })} />
        </div>
        <div>
          <Label>SpO2</Label>
          <Input value={vitals.oxygenSaturation || ''} onChange={(e) => onChangeVitals({ ...vitals, oxygenSaturation: e.target.value })} />
        </div>
      </div>
    </div>
  )
}
