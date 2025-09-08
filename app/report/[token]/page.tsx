"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ReportDownloadPage({ params, searchParams }: any) {
  const { token } = params
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  const download = async () => {
    setError('')
    try {
      const url = `/api/reports/download?token=${encodeURIComponent(token)}&pass=${encodeURIComponent(pass)}`
      const a = document.createElement('a')
      a.href = url
      a.download = `reports.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e:any) {
      setError('Failed to start download')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Download Lab Reports</CardTitle>
          <CardDescription>Enter your passcode (last 6 alphanumeric of your Prescription No.) to begin download. Link expires in 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <input className="w-full p-2 border rounded" placeholder="Passcode" value={pass} onChange={(e) => setPass(e.target.value.toUpperCase())} />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Button className="w-full" onClick={download}>Download</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

