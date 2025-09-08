"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CampaignViewModalProps {
  open: boolean
  onClose: () => void
  campaign: any | null
}

function replaceAll(html: string, map: Record<string, string>) {
  let out = html || ''
  for (const [key, val] of Object.entries(map)) {
    const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    out = out.replace(re, val)
  }
  return out
}

export default function CampaignViewModal({ open, onClose, campaign }: CampaignViewModalProps) {
  const [hospital, setHospital] = useState<{ name?: string } | null>(null)
  useEffect(() => {
    if (!open) return
    fetch('/api/settings').then(async (res) => { if (res.ok) setHospital(await res.json()) }).catch(() => {})
  }, [open])

  const channels = useMemo(() => Object.entries(campaign?.channels || {}).filter(([_, v]) => v).map(([k]) => (k as string).toUpperCase()).join(', ') || '—', [campaign])
  const audienceSummary = useMemo(() => {
    const a = campaign?.audience || {}
    const parts: string[] = []
    parts.push(a.selector || 'ALL')
    if (a.period) parts.push(a.period)
    if (a.gender) parts.push(`gender:${a.gender}`)
    if (a.minAge) parts.push(`minAge:${a.minAge}`)
    if (a.maxAge) parts.push(`maxAge:${a.maxAge}`)
    if (Array.isArray(a.conditions) && a.conditions.length) parts.push(`conditions:${a.conditions.join('|')}`)
    return parts.join(' • ')
  }, [campaign])

  const previewHtml = useMemo(() => {
    const raw = (campaign?.messageHtml || campaign?.message || '') as string
    const map = {
      PATIENT_NAME: 'John Doe',
      HOSPITAL_NAME: hospital?.name || 'Hospital',
      DOCTOR_NAME: 'Dr. Smith',
      APPOINTMENT_DATE: new Date().toLocaleString(),
      LAB_RESULTS_LINK: 'https://example.com/download',
      PRESCRIPTION_PASSCODE: 'ABC123',
    }
    return replaceAll(raw, map)
  }, [campaign, hospital])

  if (!open || !campaign) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Campaign Preview</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="font-medium">Name:</span> {campaign.name || '—'}</div>
                <div><span className="font-medium">Channels:</span> {channels}</div>
                <div><span className="font-medium">Scheduled:</span> {campaign.scheduledAt || 'Now'}</div>
                <div><span className="font-medium">Status:</span> {campaign.status}</div>
                <div><span className="font-medium">Audience:</span> {audienceSummary}</div>
                <div><span className="font-medium">Created:</span> {campaign.createdAt}</div>
                {campaign.updatedAt && <div><span className="font-medium">Updated:</span> {campaign.updatedAt}</div>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>Delivery outcome</CardDescription>
            </CardHeader>
            <CardContent>
              {campaign.result ? (
                <div className="text-sm text-gray-700 space-y-1">
                  <div><span className="font-medium">Sent:</span> {campaign.result.sent || 0}</div>
                  <div><span className="font-medium">Failed:</span> {campaign.result.failed || 0}</div>
                  <div><span className="font-medium">Total audience:</span> {campaign.result.total || 0}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No results yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Message Preview</CardTitle>
            <CardDescription>Rendered with sample values</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded p-4 bg-white text-gray-900" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

