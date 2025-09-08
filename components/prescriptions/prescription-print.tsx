"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  open: boolean
  onClose: () => void
  id: string
}

function formatPrescNumber(id: string) {
  const short = id.slice(-6).toUpperCase()
  const d = new Date()
  const y = d.getFullYear().toString().slice(-2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `PR-${y}${m}${day}-${short}`
}

export default function PrescriptionPrint({ open, onClose, id }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<any>({})
  const [qrUrl, setQrUrl] = useState<string>('')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      fetch(`/api/prescriptions/${id}`).then(res => res.ok ? res.json() : null),
      fetch('/api/settings').then(res => res.ok ? res.json() : {})
    ]).then(async ([pres, s]) => {
      if (pres?.prescription) setData(pres.prescription)
      setSettings(s || {})
    }).finally(() => setLoading(false))
  }, [open, id])

  if (!open) return null

  const parseMedicines = (json: string) => { try { return JSON.parse(json) } catch { return {} } }
  const meds = data ? parseMedicines(data.medicines) : {}

  const prescNo = data ? formatPrescNumber(data.id) : ''

  const qrData = data ? JSON.stringify({
    prescriptionNo: prescNo,
    patientName: `${data.patient.firstName} ${data.patient.lastName}`,
    age: data.patient.age || '',
    date: new Date(data.createdAt).toISOString(),
    doctorName: data.doctor.name
  }) : ''

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!qrData) return
        const QR = (await import('qrcode')).default
        const url = await QR.toDataURL(qrData, { width: 140, margin: 1, errorCorrectionLevel: 'M' })
        if (mounted) setQrUrl(url)
      } catch (e) { if (mounted) setQrUrl('') }
    })()
    return () => { mounted = false }
  }, [qrData])

  const handlePrint = () => {
    if (!printRef.current) return
    const w = window.open('', 'PRINT', 'height=800,width=700')
    if (!w) return
    w.document.write(`<html><head><title>${prescNo}</title><style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#111; }
      .header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb; padding-bottom:8px; margin-bottom:12px; }
      .brand { font-weight:700; font-size:20px; color:#1f2937; }
      .meta { font-size:12px; color:#374151; text-align:right; }
      .section { margin-top:12px; }
      .rx { font-size:28px; font-weight:700; color:#2563eb; }
      .table { width:100%; border-collapse: collapse; }
      .table th, .table td { border:1px solid #e5e7eb; padding:8px; font-size:12px; }
      .footer { margin-top:40px; display:flex; justify-content:space-between; align-items:center; }
      .sign { border-top:1px solid #374151; width:220px; text-align:center; padding-top:4px; font-size:12px; }
    </style></head><body>`)
    w.document.write(printRef.current.innerHTML)
    w.document.write('</body></html>')
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Print Prescription</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            <Button size="sm" onClick={handlePrint}>Print / Download</Button>
          </div>
        </div>
        {loading || !data ? (
          <div className="text-center py-8">{loading ? 'Loading...' : 'Not found'}</div>
        ) : (
          <div ref={printRef}>
            <div className="header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {settings.logo && <img src={settings.logo} alt="logo" style={{ height:48, width:'auto', objectFit:'contain' }} />}
                <div>
                  <div className="brand">{settings.name || 'Hospital'}</div>
                  {settings.tagline && <div style={{ fontSize:12, color:'#6b7280' }}>{settings.tagline}</div>}
                  {(settings.address || settings.phone || settings.email) && (
                    <div style={{ fontSize:12, color:'#6b7280' }}>
                      {settings.phone}{settings.phone && settings.email ? ' • ' : ''}{settings.email}
                      {settings.address ? ` • ${settings.address}` : ''}
                    </div>
                  )}
                  <div style={{ fontSize:12, color:'#374151' }}>Prescription No: {prescNo}</div>
                </div>
              </div>
              {qrUrl ? <img alt="QR" src={qrUrl} width={100} height={100} /> : <div style={{width:100,height:100,fontSize:10,color:'#6b7280',display:'flex',alignItems:'center',justifyContent:'center'}}>QR</div>}
            </div>

            <div className="section" style={{ fontSize:12 }}>
              <div><strong>Patient:</strong> {data.patient.firstName} {data.patient.lastName} • <strong>Age:</strong> {data.patient.age || '-'} • <strong>Gender:</strong> {data.patient.gender || '-'}</div>
              <div><strong>Doctor:</strong> {data.doctor.name}</div>
              <div><strong>Date:</strong> {new Date(data.createdAt).toLocaleString()}</div>
            </div>

            <div className="section">
              <div className="rx">Rx</div>
              <table className="table" style={{ marginTop:8 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:'left' }}>Medicine</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {(meds.medicines || []).map((m:any, i:number) => (
                    <tr key={i}>
                      <td>{m.name}</td>
                      <td style={{ textAlign:'center' }}>{m.dosage}</td>
                      <td style={{ textAlign:'center' }}>{m.frequency}</td>
                      <td style={{ textAlign:'center' }}>{m.duration}</td>
                      <td>{m.instructions || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(meds.labTests && meds.labTests.length > 0) && (
                <div className="section" style={{ fontSize:12 }}>
                  <strong>Lab Tests:</strong>
                  <ul>
                    {meds.labTests.map((t:any, i:number) => (<li key={i}>{t.name} {t.instructions ? `- ${t.instructions}` : ''}</li>))}
                  </ul>
                </div>
              )}

              {(meds.therapies && meds.therapies.length > 0) && (
                <div className="section" style={{ fontSize:12 }}>
                  <strong>Therapies:</strong>
                  <ul>
                    {meds.therapies.map((t:any, i:number) => (<li key={i}>{t.name} {t.frequency ? `• ${t.frequency}` : ''} {t.duration ? `• ${t.duration}` : ''} {t.instructions ? `• ${t.instructions}` : ''}</li>))}
                  </ul>
                </div>
              )}
            </div>

            <div className="footer">
              <div style={{ fontSize:12, color:'#6b7280' }}>This prescription is digitally generated. For verification, scan the QR code.</div>
              <div className="sign">
                <div style={{ marginBottom:6 }}>
                  <img src={`/uploads/users/${data.doctor?.id}/signature.png`} alt="Signature" style={{ maxHeight:48, maxWidth:220 }} onError={(e:any) => { e.currentTarget.style.display='none' }} />
                </div>
                Doctor's Signature
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

