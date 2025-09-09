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
  const [history, setHistory] = useState<{ link: { url: string; passcode: string; expiresAt?: string } | null; sends: { channel: string; to?: string; at: string }[] }>({ link: null, sends: [] })

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
    // fetch existing link + send history
    fetch(`/api/lab/reports-state?prescriptionId=${prescriptionId}`).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setHistory({ link: data.link || null, sends: Array.isArray(data.sends) ? data.sends : [] })
        if (data.link) setLink(data.link)
      }
    }).catch(() => {})
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
    if (res.ok) {
      const l = await res.json();
      setLink(l)
      // persist to lab state so others can see later
      await fetch('/api/lab/reports-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId, link: l }) })
      setHistory((h) => ({ ...h, link: l }))
    }
  }

  const sendToPatient = async (channel: 'email' | 'sms' | 'whatsapp') => {
    if (!link) return
    setSending(true); setSendStatus('')
    try {
      const res = await fetch('/api/reports/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionId, channel, linkUrl: link.url, passcode: link.passcode })
      })
      if (res.ok) {
        setSendStatus('Sent successfully')
        // persist send log with inferred recipient
        const to = channel === 'email' ? (patient?.email || '') : (patient?.phone || '')
        await fetch('/api/lab/reports-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId, send: { channel, to } }) })
        setHistory((h) => ({ ...h, sends: [...(h.sends || []), { channel, to, at: new Date().toISOString() }] }))
      } else setSendStatus('Failed to send')
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
            {(link || history.link) && (
              <div className="text-sm text-gray-700">
                <div>Link: <a className="text-blue-600 underline" href={(link || history.link)?.url} target="_blank">{(link || history.link)?.url}</a></div>
                <div>Passcode (last 6 of Prescription No.): <span className="font-mono">{(link || history.link)?.passcode}</span></div>
                <div>Expires: <span className="font-mono">{new Date(((link || history.link)?.expiresAt) || Date.now()).toLocaleString()}</span></div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-gray-500">Send to patient:</span>
                  <Button variant="outline" size="sm" disabled={sending} onClick={() => sendToPatient('email')}>Email</Button>
                  <Button variant="outline" size="sm" disabled={sending} onClick={() => sendToPatient('sms')}>SMS</Button>
                  <Button variant="outline" size="sm" disabled={sending} onClick={() => sendToPatient('whatsapp')}>WhatsApp</Button>
                  {sendStatus && <span className="text-xs text-gray-600">{sendStatus}</span>}
                </div>
                {history.sends && history.sends.length > 0 && (
                  <div className="mt-3 text-xs text-gray-600">
                    <div className="font-medium text-gray-800">Send History</div>
                    <ul className="list-disc ml-4">
                      {history.sends.map((s, i) => (
                        <li key={i}>{s.channel.toUpperCase()} to {s.to || 'N/A'} on {new Date(s.at).toLocaleString()}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

