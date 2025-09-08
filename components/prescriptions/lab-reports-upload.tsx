"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  open: boolean
  onClose: () => void
  prescriptionId: string
  labTests: { name: string }[]
}

export default function LabReportsUpload({ open, onClose, prescriptionId, labTests }: Props) {
  const [reports, setReports] = useState<any[]>([])
  const [link, setLink] = useState<{ url: string; passcode: string; expiresAt?: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [patient, setPatient] = useState<{ email?: string; phone?: string; name?: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<string>('')

  useEffect(() => {
    if (!open) return
    fetch(`/api/prescriptions/${prescriptionId}/lab-reports`).then(async (res) => {
      if (res.ok) { const data = await res.json(); setReports(data.reports || []) }
    })
    fetch(`/api/prescriptions/${prescriptionId}`).then(async (res) => {
      if (res.ok) {
        const data = await res.json()
        const p = data.prescription?.patient
        if (p) setPatient({ email: p.email, phone: p.phone, name: `${p.firstName} ${p.lastName}` })
      }
    })
  }, [open, prescriptionId])

  const upload = async (testName: string, file: File) => {
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        await fetch(`/api/prescriptions/${prescriptionId}/lab-reports`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testName, dataUrl, fileName: file.name })
        })
        const res = await fetch(`/api/prescriptions/${prescriptionId}/lab-reports`)
        const data = await res.json(); setReports(data.reports || [])
      }
      reader.readAsDataURL(file)
    } finally { setUploading(false) }
  }

  const generateLink = async () => {
    const res = await fetch('/api/reports/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId }) })
    if (res.ok) setLink(await res.json())
  }

  const sendToPatient = async (channel: 'email' | 'sms' | 'whatsapp') => {
    if (!link) return
    setSending(true); setSendStatus('')
    try {
      const res = await fetch('/api/reports/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionId, channel, linkUrl: link.url, passcode: link.passcode })
      })
      if (res.ok) setSendStatus('Sent successfully')
      else setSendStatus('Failed to send')
    } catch { setSendStatus('Failed to send') } finally { setSending(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Lab Reports</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="space-y-4">
          {labTests.length === 0 ? (
            <div className="text-sm text-gray-500">No lab tests in this prescription.</div>
          ) : (
            labTests.map((t, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <input type="file" accept="application/pdf,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(t.name, f) }} />
                </CardContent>
              </Card>
            ))
          )}

          {reports.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Uploaded Reports</h3>
              <ul className="list-disc ml-4 text-sm">
                {reports.map((r, i) => (<li key={i}><a href={r.url} target="_blank" className="text-blue-600 underline">{r.name}</a></li>))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={generateLink} disabled={reports.length === 0}>Generate Share Link</Button>
            {link && (
              <div className="text-sm text-gray-700">
                <div>Link: <a className="text-blue-600 underline" href={link.url} target="_blank">{link.url}</a></div>
                <div>Passcode (last 6 of Prescription No.): <span className="font-mono">{link.passcode}</span></div>
                <div>Expires: <span className="font-mono">{new Date(link.expiresAt || Date.now()).toLocaleString()}</span></div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-gray-500">Send to patient:</span>
                  <Button variant="outline" size="sm" disabled={sending} onClick={() => sendToPatient('email')}>Email</Button>
                  <Button variant="outline" size="sm" disabled={sending} onClick={() => sendToPatient('sms')}>SMS</Button>
                  <Button variant="outline" size="sm" disabled={sending} onClick={() => sendToPatient('whatsapp')}>WhatsApp</Button>
                  {sendStatus && <span className="text-xs text-gray-600">{sendStatus}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

